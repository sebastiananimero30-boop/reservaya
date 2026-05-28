<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ReservationHelper;
use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantResource;
use App\Http\Resources\TableResource;
use App\Models\Restaurant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RestaurantController extends Controller
{
    // Lista los restaurantes activos con soporte para varios filtros.
    // Si se pasan fecha, hora y personas también filtra por disponibilidad real de mesas
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Restaurant::with(['category', 'photos'])
            ->withCount(['tables as tables_count' => fn ($q) => $q->where('is_active', true)])
            ->active();

        // Filtro por categoría usando el slug o el nombre
        if ($request->filled('category')) {
            $query->byCategory($request->category);
        }

        // Filtro por zona o dirección
        if ($request->filled('zone')) {
            $query->byZone($request->zone);
        }

        // Búsqueda por texto en nombre, descripción, dirección o zona
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Si el cliente manda fecha y hora, solo muestro restaurantes
        // que tengan al menos una mesa disponible para ese horario y número de personas
        if ($request->filled('date') && $request->filled('time')) {
            $dateTime = $request->date . 'T' . $request->time . ':00';
            $start    = Carbon::parse($dateTime); // Parsea la hora local
            $guests   = (int) $request->get('guests', 1);

            $query->whereHas('tables', function ($q) use ($start, $guests) {
                $q->where('is_active', true)
                  ->where('seats', '>=', $guests);
                ReservationHelper::applyAvailabilityFilter($q, $start);
            });
        }

        // Ordeno por calificación de mayor a menor
        $query->orderByDesc('rating');

        $restaurants = $query->paginate($request->get('per_page', 12));

        return RestaurantResource::collection($restaurants);
    }

    // Devuelve el detalle completo de un restaurante.
    // Si se pasan fecha, hora y personas también calculo las mesas disponibles
    public function show(Request $request, Restaurant $restaurant): JsonResponse
    {
        $restaurant->load(['category', 'photos', 'schedules', 'availableMenuItems']);

        $data = (new RestaurantResource($restaurant))->toArray($request);

        // Si el cliente está buscando para una fecha específica, calculo
        // qué mesas están libres en ese horario
        if ($request->filled('date') && $request->filled('time')) {
                $dateTime = $request->date . 'T' . $request->time . ':00';
                $startTime = $dateTime; // Ya es ISO formato que Carbon puede parsear
            $guests    = (int) $request->get('guests', 1);

            $availableTables = $restaurant->availableTables($startTime, $guests);
            $data['available_tables'] = TableResource::collection($availableTables);
        } else {
            // Sin filtro de fecha devuelvo todas las mesas activas
            $data['available_tables'] = TableResource::collection(
                $restaurant->tables()->where('is_active', true)->get()
            );
        }

        return response()->json($data);
    }

    // Devuelve las mesas disponibles para una fecha, hora y número de personas específicos.
    // Este endpoint lo usa el formulario de reserva para mostrar las opciones al cliente
    public function availableTables(Request $request, Restaurant $restaurant): JsonResponse
    {
        $request->validate([
            'date'   => 'required|date',
            'time'   => 'required|date_format:H:i',
            'guests' => 'nullable|integer|min:1|max:20',
        ]);

        // Construir un datetime válido para buscar disponibilidad
        // El cliente envía la hora en su zona local, la convertimos a ISO 8601
        $dateTime = $request->date . 'T' . $request->time . ':00';
        $startTime = Carbon::parse($dateTime); // Carbon parsea la hora local
        $guests    = (int) $request->get('guests', 1);

        $tables = $restaurant->availableTables($startTime->toDateTimeString(), $guests);

        return response()->json([
            'restaurant_id' => $restaurant->id,
            'start_time'    => $startTime->toIso8601String(),
            'guests'        => $guests,
            'tables'        => TableResource::collection($tables),
        ]);
    }
}
