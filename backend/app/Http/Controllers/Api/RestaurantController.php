<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantResource;
use App\Http\Resources\TableResource;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class RestaurantController extends Controller
{
    /**
     * GET /api/restaurants
     * Params: category (slug), zone, date, time, guests, per_page
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Restaurant::with(['category', 'photos'])
            ->withCount(['tables as tables_count' => fn ($q) => $q->where('is_active', true)])
            ->active();

        // Filtro por categoría (slug)
        if ($request->filled('category')) {
            $query->byCategory($request->category);
        }

        // Filtro por zona / dirección
        if ($request->filled('zone')) {
            $query->byZone($request->zone);
        }

        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filtro por disponibilidad de mesas en fecha+hora+guests
        if ($request->filled('date') && $request->filled('time')) {
            $startTime = $request->date . ' ' . $request->time;
            $guests    = (int) $request->get('guests', 1);
            $overlapEndExpr = DB::connection()->getDriverName() === 'pgsql'
                ? "start_time + (duration_minutes * interval '1 minute') > ?"
                : "datetime(start_time, '+' || duration_minutes || ' minutes') > ?";

            $query->whereHas('tables', function ($q) use ($startTime, $guests, $overlapEndExpr) {
                $end = \Carbon\Carbon::parse($startTime)->addMinutes(90);
                $q->where('is_active', true)
                  ->where('seats', '>=', $guests)
                  ->whereDoesntHave('reservations', function ($r) use ($startTime, $end, $overlapEndExpr) {
                      $r->whereNotIn('status', ['cancelled'])
                        ->where('start_time', '<', $end)
                        ->whereRaw($overlapEndExpr, [$startTime]);
                  });
            });
        }

        // Ordenar por rating desc por defecto
        $query->orderByDesc('rating');

        $restaurants = $query->paginate($request->get('per_page', 12));

        return RestaurantResource::collection($restaurants);
    }

    /**
     * GET /api/restaurants/{id}
     * Params opcionales: date, time, guests
     */
    public function show(Request $request, Restaurant $restaurant): JsonResponse
    {
        $restaurant->load(['category', 'photos', 'schedules']);

        $data = (new RestaurantResource($restaurant))->toArray($request);

        // Mesas disponibles si se pasan parámetros de búsqueda
        if ($request->filled('date') && $request->filled('time')) {
            $startTime = $request->date . ' ' . $request->time;
            $guests    = (int) $request->get('guests', 1);

            $availableTables = $restaurant->availableTables($startTime, $guests);
            $data['available_tables'] = TableResource::collection($availableTables);
        } else {
            // Sin filtro: devolver todas las mesas activas
            $data['available_tables'] = TableResource::collection(
                $restaurant->tables()->where('is_active', true)->get()
            );
        }

        return response()->json($data);
    }

    /**
     * GET /api/restaurants/{id}/tables
     * Mesas disponibles para una fecha/hora específica
     */
    public function availableTables(Request $request, Restaurant $restaurant): JsonResponse
    {
        $request->validate([
            'date'   => 'required|date',
            'time'   => 'required|date_format:H:i',
            'guests' => 'nullable|integer|min:1|max:20',
        ]);

        $startTime = $request->date . ' ' . $request->time;
        $guests    = (int) $request->get('guests', 1);

        $tables = $restaurant->availableTables($startTime, $guests);

        return response()->json([
            'restaurant_id' => $restaurant->id,
            'start_time'    => $startTime,
            'guests'        => $guests,
            'tables'        => TableResource::collection($tables),
        ]);
    }
}
