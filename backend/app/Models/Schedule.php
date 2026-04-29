<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Schedule extends Model
{
    protected $fillable = ['restaurant_id', 'day_of_week', 'open_time', 'close_time', 'is_closed'];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'is_closed'   => 'boolean',
        ];
    }

    protected static array $days = [
        0 => 'Domingo', 1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles',
        4 => 'Jueves',  5 => 'Viernes', 6 => 'Sábado',
    ];

    public function getDayNameAttribute(): string
    {
        return self::$days[$this->day_of_week] ?? 'Desconocido';
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
