<?php

namespace App\Services;

use App\Models\Reservation;
use Stripe\Checkout\Session;
use Stripe\StripeClient;

class StripeCheckoutService
{
    public function createReservationSession(Reservation $reservation): Session
    {
        $secret = config('services.stripe.secret');

        if (! $secret) {
            abort(500, 'Stripe no esta configurado.');
        }

        $reservation->loadMissing(['restaurant', 'table', 'user']);

        $stripe = new StripeClient($secret);
        $amount = (int) config('services.stripe.reservation_amount', 500);
        $currency = strtolower((string) config('services.stripe.currency', 'usd'));
        $restaurantName = $reservation->restaurant->name ?? 'ReservaYa';

        $session = $stripe->checkout->sessions->create([
            'mode' => 'payment',
            'client_reference_id' => (string) $reservation->id,
            'customer_email' => $reservation->user->email,
            'success_url' => config('services.stripe.success_url'),
            'cancel_url' => config('services.stripe.cancel_url'),
            'metadata' => [
                'reservation_id' => (string) $reservation->id,
                'user_id' => (string) $reservation->user_id,
            ],
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => $currency,
                    'unit_amount' => $amount,
                    'product_data' => [
                        'name' => "Reserva en {$restaurantName}",
                        'description' => 'Anticipo de reserva ' . $this->reservationCode($reservation),
                    ],
                ],
            ]],
        ]);

        $reservation->update([
            'payment_provider' => 'stripe',
            'payment_status' => $session->payment_status ?? 'unpaid',
            'payment_amount' => $amount,
            'payment_currency' => $currency,
            'stripe_checkout_session_id' => $session->id,
        ]);

        return $session;
    }

    public function syncPaidSession(string $sessionId): ?Reservation
    {
        $secret = config('services.stripe.secret');

        if (! $secret) {
            abort(500, 'Stripe no esta configurado.');
        }

        $stripe = new StripeClient($secret);
        $session = $stripe->checkout->sessions->retrieve($sessionId, []);

        return $this->markReservationFromSession($session);
    }

    public function markReservationFromSession(Session $session): ?Reservation
    {
        $reservationId = $session->metadata->reservation_id ?? $session->client_reference_id ?? null;

        if (! $reservationId) {
            return null;
        }

        $reservation = Reservation::find($reservationId);

        if (! $reservation) {
            return null;
        }

        $updates = [
            'payment_provider' => 'stripe',
            'payment_status' => $session->payment_status ?? $reservation->payment_status,
            'stripe_checkout_session_id' => $session->id,
            'stripe_payment_intent_id' => is_string($session->payment_intent) ? $session->payment_intent : null,
        ];

        if (($session->payment_status ?? null) === 'paid') {
            $updates['payment_paid_at'] = now();

            if ($reservation->status === 'pending') {
                $updates['status'] = 'confirmed';
            }
        }

        $reservation->update($updates);

        return $reservation->fresh(['restaurant', 'table']);
    }

    private function reservationCode(Reservation $reservation): string
    {
        return 'RYA-' . str_pad((string) $reservation->id, 6, '0', STR_PAD_LEFT);
    }
}
