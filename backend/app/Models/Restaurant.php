<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Helpers\ReservationHelper;
use Carbon\Carbon;
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

    // Scopes para filtrar restaurantes desde el controlador de forma limpia

    // Solo restaurantes que están activos en la plataforma
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Filtra por categoría usando el slug o el nombre
    public function scopeByCategory($query, string $category)
    {
        return $query->whereHas('category', function ($q) use ($category) {
            $q->where('slug', $category)
              ->orWhere('name', $category);
        });
    }

    // Filtra por zona o dirección, busca en ambos campos
    public function scopeByZone($query, string $zone)
    {
        return $query->where(function ($q) use ($zone) {
            // ILIKE en PostgreSQL es case-insensitive, LIKE en SQLite no lo es
            $operator = DB::connection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';

            $q->where('zone', $operator, "%{$zone}%")
              ->orWhere('address', $operator, "%{$zone}%");
        });
    }

    // Búsqueda de texto libre en nombre, descripción, dirección y zona
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

    // Relaciones del modelo

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

    // Las fotos se ordenan por sort_order para respetar el orden que definió el admin
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

    // Todos los platos del menú ordenados por sort_order y luego por nombre
    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class)->orderBy('sort_order')->orderBy('name');
    }

    // Solo los platos que están visibles para los clientes
    public function availableMenuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class)
            ->where('is_available', true)
            ->orderBy('sort_order')
            ->orderBy('name');
    }

    // Recalcula el rating del restaurante promediando todas sus reseñas.
    // Se llama cada vez que se agrega o modifica una reseña
    public function updateRating(): void
    {
        $avg = $this->reviews()->avg('rating') ?? 0;
        $this->update(['rating' => round($avg, 1)]);
    }

    // Devuelve las mesas disponibles para una fecha/hora y número de personas.
    // Excluye las mesas que tienen reservas que se solapan en un rango de ±90 minutos.
    // La expresión SQL para calcular el fin de la reserva cambia según la base de datos
    public function availableTables(string $startTime, int $guests = 1)
    {
        $start = Carbon::parse($startTime);

        $query = $this->tables()
            ->where('is_active', true)
            ->where('seats', '>=', $guests);

        return ReservationHelper::applyAvailabilityFilter($query, $start)->get();
    }
}
