<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Table extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'name',
        'seats',
        'price',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'seats'     => 'integer',
            'price'     => 'float',
            'is_active' => 'boolean',
        ];
    }

    // ── Relaciones ─────────────────────────────────────────────────────────────
    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }
}
