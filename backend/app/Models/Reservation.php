<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'restaurant_id',
        'table_id',
        'start_time',
        'duration_minutes',
        'guests',
        'status',
        'notes',
        'qr_code',
        'payment_provider',
        'payment_status',
        'payment_amount',
        'payment_currency',
        'stripe_checkout_session_id',
        'stripe_payment_intent_id',
        'payment_paid_at',
        'payment_intent_id',
        'deposit_amount',
        'deposit_refunded',
    ];

    protected function casts(): array
    {
        return [
            'start_time'       => 'datetime',
            'duration_minutes' => 'integer',
            'guests'           => 'integer',
            'payment_amount'    => 'integer',
            'payment_paid_at'   => 'datetime',
        ];
    }

    // Antes de guardar una reserva nueva genero automáticamente el código QR.
    // Uso la API pública de qrserver.com para no depender de librerías adicionales
    protected static function booted(): void
    {
        static::creating(function (Reservation $r) {
            if (! $r->qr_code) {
                $token = Str::random(32);
                $r->qr_code = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=reservaya-{$token}";
            }

            $r->status  ??= 'confirmed';
        });
    }

    // Relaciones del modelo

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }
}
