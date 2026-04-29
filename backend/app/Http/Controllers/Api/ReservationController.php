<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReservationController extends Controller
{
    /**
     * GET /api/my/reservations
     * Reservas del usuario autenticado
     */
    public function myReservations(Request $request): AnonymousResourceCollection
    {
        $reservations = Reservation::with(['restaurant', 'table'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('start_time')
            ->paginate(10);

        return ReservationResource::collection($reservations);
    }

    /**
     * POST /api/reservations
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'restaurant_id' => 'required|exists:restaurants,id',
            'table_id'      => 'required|exists:tables,id',
            'start_time'    => 'required|date|after:now',
            'guests'        => 'required|integer|min:1|max:20',
            'notes'         => 'nullable|string|max:500',
        ]);

        // Verificar que la mesa pertenece al restaurante
        $table = Table::where('id', $data['table_id'])
            ->where('restaurant_id', $data['restaurant_id'])
            ->where('is_active', true)
            ->firstOrFail();

        // Verificar capacidad
        if ($data['guests'] > $table->seats) {
            return response()->json([
                'message' => "La mesa {$table->name} tiene capacidad para {$table->seats} personas.",
            ], 422);
        }

        // Verificar disponibilidad (anti-solapamiento ±90 min)
        $start = Carbon::parse($data['start_time']);
        $end   = $start->copy()->addMinutes(90);
        $overlapEndExpr = DB::connection()->getDriverName() === 'pgsql'
            ? "start_time + (duration_minutes * interval '1 minute') > ?"
            : "datetime(start_time, '+' || duration_minutes || ' minutes') > ?";

        $conflict = Reservation::where('table_id', $data['table_id'])
            ->whereNotIn('status', ['cancelled'])
            ->where(function ($q) use ($start, $end, $overlapEndExpr) {
                $q->where('start_time', '<', $end)
                  ->whereRaw($overlapEndExpr, [$start]);
            })
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'La mesa no está disponible para el horario seleccionado.',
            ], 409);
        }

        $reservation = Reservation::create([
            ...$data,
            'user_id'          => $request->user()->id,
            'duration_minutes' => 90,
            'status'           => 'confirmed',
        ]);

        $reservation->load(['restaurant', 'table']);

        return response()->json(new ReservationResource($reservation), 201);
    }

    /**
     * GET /api/reservations/{id}
     */
    public function show(Request $request, Reservation $reservation): JsonResponse
    {
        // Solo el dueño de la reserva o admin puede verla
        if ($request->user()->id !== $reservation->user_id && ! $request->user()->isAdmin()) {
            abort(403, 'No tienes permiso para ver esta reserva.');
        }

        $reservation->load(['restaurant', 'table']);

        return response()->json(new ReservationResource($reservation));
    }

    /**
     * PATCH /api/reservations/{id}/cancel
     */
    public function cancel(Request $request, Reservation $reservation): JsonResponse
    {
        if ($request->user()->id !== $reservation->user_id && ! $request->user()->isAdmin()) {
            abort(403, 'No tienes permiso para cancelar esta reserva.');
        }

        if ($reservation->status === 'cancelled') {
            return response()->json(['message' => 'La reserva ya está cancelada.'], 422);
        }

        $reservation->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Reserva cancelada correctamente.', 'id' => $reservation->id]);
    }
}
