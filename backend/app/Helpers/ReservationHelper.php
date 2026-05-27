<?php

namespace App\Helpers;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Helper centralizado para la lógica de reservas.
 * Evita duplicar el código de anti-solapamiento en múltiples controladores.
 */
class ReservationHelper
{
    /**
     * Devuelve la expresión SQL para calcular el fin de una reserva.
     * Compatible con SQLite y PostgreSQL.
     */
    public static function overlapEndExpr(): string
    {
        return DB::connection()->getDriverName() === 'pgsql'
            ? "start_time + (duration_minutes * interval '1 minute') > ?"
            : "datetime(start_time, '+' || duration_minutes || ' minutes') > ?";
    }

    /**
     * Verifica si existe un conflicto de horario para una mesa.
     * Retorna true si hay solapamiento, false si está libre.
     */
    public static function hasConflict(int $tableId, Carbon $start, int $durationMinutes = 90): bool
    {
        $end            = $start->copy()->addMinutes($durationMinutes);
        $overlapEndExpr = self::overlapEndExpr();

        return \App\Models\Reservation::where('table_id', $tableId)
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->where(function ($q) use ($start, $end, $overlapEndExpr) {
                $q->where('start_time', '<', $end)
                  ->whereRaw($overlapEndExpr, [$start]);
            })
            ->exists();
    }

    /**
     * Aplica el filtro de disponibilidad a una query de mesas.
     * Excluye mesas con reservas solapadas en el rango dado.
     */
    public static function applyAvailabilityFilter($query, Carbon $start, int $durationMinutes = 90): mixed
    {
        $end            = $start->copy()->addMinutes($durationMinutes);
        $overlapEndExpr = self::overlapEndExpr();

        return $query->whereDoesntHave('reservations', function ($q) use ($start, $end, $overlapEndExpr) {
            $q->whereNotIn('status', ['cancelled', 'no_show'])
              ->where(function ($inner) use ($start, $end, $overlapEndExpr) {
                  $inner->where('start_time', '<', $end)
                        ->whereRaw($overlapEndExpr, [$start]);
              });
        });
    }
}
