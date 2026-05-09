<?php

namespace App\Mail;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OwnerNewReservation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Reservation $reservation) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🔔 Nueva reserva en ' . $this->reservation->restaurant->name . ' — ReservaYa',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.owner-new-reservation',
            with: [
                'reservation' => $this->reservation,
                'restaurant'  => $this->reservation->restaurant,
                'table'       => $this->reservation->table,
                'user'        => $this->reservation->user,
                'owner'       => $this->reservation->restaurant->owner,
            ],
        );
    }
}
