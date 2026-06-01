<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ReservationHelper;
use App\Mail\ReservationConfirmed;
use App\Mail\OwnerNewReservation;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;

class ReservationController extends Controller
{
    // Devuelve todas las reservas del usuario autenticado,
    // ordenadas de la más reciente a la más antigua
    public function myReservations(Request $request): AnonymousResourceCollection
    {
        $reservations = Reservation::with(['restaurant', 'table'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('start_time')
            ->paginate(10);

        return ReservationResource::collection($reservations);
    }

    // Crea una nueva reserva. Antes de guardarla hago tres verificaciones:
    // 1. Que la mesa pertenezca al restaurante indicado
    // 2. Que la capacidad sea suficiente para el número de personas
    // 3. Que no haya otra reserva solapada en esa mesa (±90 minutos)
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'restaurant_id'  => 'required|exists:restaurants,id',
            'table_id'       => 'required|exists:tables,id',
            'start_time'     => 'required|date|after:' . now()->subMinutes(10)->toDateTimeString(),
            'guests'         => 'required|integer|min:1|max:20',
            'notes'          => 'nullable|string|max:500',
            'pay_with_stripe'=> 'sometimes|boolean',
        ]);

        $payWithStripe = ($data['pay_with_stripe'] ?? false) && config('services.stripe.secret');

        // Verifico que la mesa exista y esté activa en ese restaurante
        $table = Table::where('id', $data['table_id'])
            ->where('restaurant_id', $data['restaurant_id'])
            ->where('is_active', true)
            ->firstOrFail();

        // No tiene sentido reservar una mesa para más personas de las que caben
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

        $reservation = Reservation::create([
            ...$data,
            'user_id'          => $request->user()->id,
            'duration_minutes' => 90,
            'status'           => $payWithStripe ? 'pending' : 'confirmed',
            'payment_provider' => $payWithStripe ? 'stripe' : null,
            'payment_status'   => 'unpaid',
        ]);

        $reservation->load(['restaurant', 'table']);

        // Si el usuario quiere pagar con Stripe y está configurado
        if ($payWithStripe) {
            try {
                $checkout = app(\App\Services\StripeCheckoutService::class);
                $session  = $checkout->createReservationSession($reservation);

                return response()->json([
                    'data'         => new ReservationResource($reservation->fresh(['restaurant', 'table'])),
                    'checkout_url' => $session->url,
                    'session_id'   => $session->id,
                ], 201);
            } catch (\Exception $e) {
                // Si Stripe falla, confirmo la reserva sin pago
                $reservation->update(['status' => 'confirmed', 'payment_provider' => null]);
                \Log::warning('Stripe checkout falló: ' . $e->getMessage());
            }
        }

        // Envío email al cliente
        try {
            Mail::to($request->user()->email)
                ->send(new ReservationConfirmed($reservation->load(['restaurant', 'table', 'user'])));
        } catch (\Exception $e) {
            \Log::warning('Email cliente no enviado: ' . $e->getMessage());
        }

        // Envío email al propietario
        try {
            $owner = $reservation->restaurant->owner;
            if ($owner && $owner->email) {
                Mail::to($owner->email)
                    ->send(new OwnerNewReservation($reservation));
            }
        } catch (\Exception $e) {
            \Log::warning('Email propietario no enviado: ' . $e->getMessage());
        }

        return response()->json(new ReservationResource($reservation), 201);
    }

    // Devuelve el detalle de una reserva específica.
    // Solo puede verla el cliente que la hizo o un administrador
    public function show(Request $request, Reservation $reservation): JsonResponse
    {
        if ($request->user()->id !== $reservation->user_id && ! $request->user()->isAdmin()) {
            abort(403, 'No tienes permiso para ver esta reserva.');
        }

        $reservation->load(['restaurant', 'table']);

        return response()->json(new ReservationResource($reservation));
    }

    // Cancela una reserva. Solo puede hacerlo el cliente dueño de la reserva
    // o un administrador. Si ya está cancelada no hago nada
    public function cancel(Request $request, Reservation $reservation): JsonResponse
    {
        if ($request->user()->id !== $reservation->user_id && ! $request->user()->isAdmin()) {
            abort(403, 'No tienes permiso para cancelar esta reserva.');
        }

        if ($reservation->status === 'cancelled') {
            return response()->json(['message' => 'La reserva ya está cancelada.'], 422);
        }

        $reservation->update(['status' => 'cancelled']);

        // Reembolso automático del depósito si existe
        if ($reservation->payment_intent_id && ! $reservation->deposit_refunded) {
            try {
                \Stripe\Stripe::setApiKey(config('services.stripe.secret'));
                $intent = \Stripe\PaymentIntent::retrieve($reservation->payment_intent_id);

                if ($intent->status === 'requires_capture') {
                    $intent->cancel();
                } elseif ($intent->status === 'succeeded') {
                    \Stripe\Refund::create(['payment_intent' => $reservation->payment_intent_id]);
                }

                $reservation->update(['deposit_refunded' => true]);
            } catch (\Exception $e) {
                \Log::warning('Reembolso automático fallido: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'Reserva cancelada correctamente.', 'id' => $reservation->id]);
    }
}
