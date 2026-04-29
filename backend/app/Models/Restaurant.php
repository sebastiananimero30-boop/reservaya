<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Restaurant extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'owner_id',
        'name',
        'description',
        'address',
        'zone',
        'latitude',
        'longitude',
        'rating',
        'capacity',
        'phone',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'latitude'  => 'float',
            'longitude' => 'float',
            'rating'    => 'float',
            'is_active' => 'boolean',
        ];
    }

    // ── Scopes ─────────────────────────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->whereHas('category', function ($q) use ($category) {
            $q->where('slug', $category)
              ->orWhere('name', $category);
        });
    }

    public function scopeByZone($query, string $zone)
    {
        return $query->where(function ($q) use ($zone) {
            $operator = DB::connection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';

            $q->where('zone', $operator, "%{$zone}%")
              ->orWhere('address', $operator, "%{$zone}%");
        });
    }

    public function scopeSearch($query, string $term)
    {
        $operator = DB::connection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';

        return $query->where(function ($q) use ($term, $operator) {
            $q->where('name', $operator, "%{$term}%")
              ->orWhere('description', $operator, "%{$term}%")
              ->orWhere('address', $operator, "%{$term}%")
              ->orWhere('zone', $operator, "%{$term}%");
        });
    }

    // ── Relaciones ─────────────────────────────────────────────────────────────
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function tables(): HasMany
    {
        return $this->hasMany(Table::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(RestaurantPhoto::class)->orderBy('sort_order');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class)->orderBy('day_of_week');
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    public function updateRating(): void
    {
        $avg = $this->reviews()->avg('rating') ?? 0;
        $this->update(['rating' => round($avg, 1)]);
    }

    /**
     * Obtener mesas disponibles para una fecha/hora y número de personas dado.
     * Excluye mesas con reservas solapadas ±90 minutos.
     */
    public function availableTables(string $startTime, int $guests = 1)
    {
        $start = \Carbon\Carbon::parse($startTime);
        $end   = $start->copy()->addMinutes(90);
        $overlapEndExpr = DB::connection()->getDriverName() === 'pgsql'
            ? "start_time + (duration_minutes * interval '1 minute') > ?"
            : "datetime(start_time, '+' || duration_minutes || ' minutes') > ?";

        return $this->tables()
            ->where('is_active', true)
            ->where('seats', '>=', $guests)
            ->whereDoesntHave('reservations', function ($q) use ($start, $end, $overlapEndExpr) {
                $q->whereNotIn('status', ['cancelled'])
                  ->where(function ($inner) use ($start, $end, $overlapEndExpr) {
                      // Reserva existente: [rs, re]  Nueva: [start, end]
                      // Solapamiento: rs < end AND re > start
                      $inner->where('start_time', '<', $end)
                            ->whereRaw($overlapEndExpr, [$start]);
                  });
            })
            ->get();
    }
}
