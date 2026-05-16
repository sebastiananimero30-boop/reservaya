<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ReservationHelper;
use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class PaymentController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * POST /api/payments/create-intent
     * Crea un PaymentIntent de Stripe para el depósito de reserva.
     * El pago se captura pero no se cobra hasta confirmar la asistencia.
     */
    public function createIntent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'restaurant_id' => 'required|exists:restaurants,id',
            'table_id'      => 'required|exists:tables,id',
            'start_time'    => 'required|string',
            'guests'        => 'required|integer|min:1|max:20',
            'notes'         => 'nullable|string|max:500',
            'amount'        => 'sometimes|integer|min:100',
        ]);

        // Monto por defecto: $5.00 USD = 500 centavos
        $amount = $data['amount'] ?? 500;

        // Verifico disponibilidad antes de cobrar
        $table = Table::where('id', $data['table_id'])
            ->where('restaurant_id', $data['restaurant_id'])
            ->where('is_active', true)
            ->firstOrFail();

        if ($data['guests'] > $table->seats) {
            return response()->json([
                'message' => "La mesa {$table->name} tiene capacidad para {$table->seats} personas.",
            ], 422);
        }

        $start = Carbon::parse($data['start_time']);

        if (ReservationHelper::hasConflict($data['table_id'], $start)) {
            return response()->json([
                'message' => 'La mesa no está disponible para el horario seleccionado.',
            ], 409);
        }

        // Creo el PaymentIntent — capture_method: manual significa que
        // el dinero se autoriza pero no se cobra hasta que llamemos a capture()
        $intent = PaymentIntent::create([
            'amount'         => $amount,
            'currency'       => 'usd',
            'capture_method' => 'manual',
            'metadata'       => [
                'user_id'       => $request->user()->id,
                'restaurant_id' => $data['restaurant_id'],
                'table_id'      => $data['table_id'],
                'start_time'    => $data['start_time'],
                'guests'        => $data['guests'],
                'notes'         => $data['notes'] ?? '',
            ],
            'description' => 'Deposito reserva - ' . ($table->restaurant->name ?? 'ReservaYa'),
        ]);

        return response()->json([
            'client_secret' => $intent->client_secret,
            'payment_intent_id' => $intent->id,
            'amount' => $data['amount'],
        ]);
    }

    /**
     * POST /api/payments/confirm-reservation
     * Después de que Stripe confirma el pago, crea la reserva en la DB.
     */
    public function confirmReservation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'payment_intent_id' => 'required|string',
            'restaurant_id'     => 'required|exists:restaurants,id',
            'table_id'          => 'required|exists:tables,id',
            'start_time'        => 'required|string',
            'guests'            => 'required|integer|min:1|max:20',
            'notes'             => 'nullable|string|max:500',
        ]);

        // Verifico que el PaymentIntent esté en estado requires_capture o succeeded
        $intent = PaymentIntent::retrieve($data['payment_intent_id']);

        if (! in_array($intent->status, ['requires_capture', 'succeeded'])) {
            return response()->json([
                'message' => 'El pago no fue completado. Intenta de nuevo.',
            ], 422);
        }

        // Creo la reserva con el payment_intent_id para poder capturar/reembolsar después
        $reservation = \App\Models\Reservation::create([
            'user_id'            => $request->user()->id,
            'restaurant_id'      => $data['restaurant_id'],
            'table_id'           => $data['table_id'],
            'start_time'         => $data['start_time'],
            'duration_minutes'   => 90,
            'guests'             => $data['guests'],
            'notes'              => $data['notes'] ?? null,
            'status'             => 'confirmed',
            'payment_intent_id'  => $intent->id,
            'deposit_amount'     => $intent->amount,
        ]);

        $reservation->load(['restaurant', 'table']);

        // Envío email de confirmación
        try {
            \Mail::to($request->user()->email)
                ->send(new \App\Mail\ReservationConfirmed(
                    $reservation->load(['restaurant', 'table', 'user'])
                ));
        } catch (\Exception $e) {
            \Log::warning('Email no enviado: ' . $e->getMessage());
        }

        return response()->json([
            'message'     => 'Reserva confirmada con pago.',
            'reservation' => new \App\Http\Resources\ReservationResource($reservation),
        ], 201);
    }

    /**
     * POST /api/payments/refund/{reservation}
     * Reembolsa el depósito cuando el cliente llega (el propietario lo marca como completado).
     */
    public function refund(Request $request, \App\Models\Reservation $reservation): JsonResponse
    {
        if (! $request->user()->isAdmin() && $reservation->restaurant->owner_id !== $request->user()->id) {
            abort(403, 'No tienes permiso para gestionar este pago.');
        }

        if (! $reservation->payment_intent_id) {
            return response()->json(['message' => 'Esta reserva no tiene pago asociado.'], 422);
        }

        $intent = PaymentIntent::retrieve($reservation->payment_intent_id);

        if ($intent->status === 'requires_capture') {
            // Cancelar la autorización — no se cobra nada
            $intent->cancel();
        } elseif ($intent->status === 'succeeded') {
            // Reembolsar el pago ya capturado
            \Stripe\Refund::create(['payment_intent' => $reservation->payment_intent_id]);
        }

        $reservation->update(['deposit_refunded' => true]);

        return response()->json(['message' => 'Depósito reembolsado correctamente.']);
    }
}
