<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Services\StripeCheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class StripePaymentController extends Controller
{
    public function createCheckoutSession(
        Request $request,
        Reservation $reservation,
        StripeCheckoutService $checkout
    ): JsonResponse {
        if ($reservation->user_id !== $request->user()->id) {
            abort(403, 'No tienes permiso para pagar esta reserva.');
        }

        if (in_array($reservation->status, ['cancelled', 'completed', 'no_show'], true)) {
            abort(422, 'Esta reserva no se puede pagar.');
        }

        if ($reservation->payment_status === 'paid') {
            return response()->json([
                'message' => 'La reserva ya esta pagada.',
                'reservation' => new ReservationResource($reservation->load(['restaurant', 'table'])),
            ]);
        }

        $session = $checkout->createReservationSession($reservation);

        return response()->json([
            'checkout_url' => $session->url,
            'session_id' => $session->id,
            'reservation' => new ReservationResource($reservation->fresh(['restaurant', 'table'])),
        ]);
    }

    public function showSession(
        Request $request,
        string $sessionId,
        StripeCheckoutService $checkout
    ): JsonResponse {
        $reservation = $checkout->syncPaidSession($sessionId);

        if (! $reservation || $reservation->user_id !== $request->user()->id) {
            abort(404, 'Pago no encontrado.');
        }

        return response()->json([
            'reservation' => new ReservationResource($reservation),
        ]);
    }

    public function webhook(Request $request, StripeCheckoutService $checkout): JsonResponse
    {
        $secret = config('services.stripe.webhook_secret');

        if (! $secret) {
            abort(500, 'Webhook de Stripe no configurado.');
        }

        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                $request->header('Stripe-Signature'),
                $secret
            );
        } catch (\UnexpectedValueException|SignatureVerificationException $e) {
            throw new BadRequestHttpException('Webhook de Stripe invalido.');
        }

        if (in_array($event->type, ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)) {
            $checkout->markReservationFromSession($event->data->object);
        }

        return response()->json(['received' => true]);
    }
}
