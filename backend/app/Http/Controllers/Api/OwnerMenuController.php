<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\RestaurantResource;
use App\Models\MenuItem;
use App\Models\Reservation;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OwnerMenuController extends Controller
{
    // Devuelve solo los restaurantes que pertenecen al propietario autenticado.
    // Un owner no puede ver ni tocar los restaurantes de otro
    public function restaurants(Request $request): AnonymousResourceCollection
    {
        $this->ensureOwner($request);

        $restaurants = Restaurant::with(['category', 'photos', 'menuItems'])
            ->where('owner_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        return RestaurantResource::collection($restaurants);
    }

    // Lista todos los platos del menú de un restaurante,
    // incluyendo los que están ocultos para que el owner pueda gestionarlos
    public function index(Request $request, Restaurant $restaurant): AnonymousResourceCollection
    {
        $this->authorizeRestaurant($request, $restaurant);

        return MenuItemResource::collection(
            $restaurant->menuItems()->get()
        );
    }

    // Agrega un nuevo plato al menú del restaurante
    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->authorizeRestaurant($request, $restaurant);

        $data = $this->validateMenuItem($request);

        $item = $restaurant->menuItems()->create($data);

        return response()->json(new MenuItemResource($item), 201);
    }

    // Actualiza los datos de un plato existente.
    // Uso partial: true para que no sea obligatorio mandar todos los campos
    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $this->authorizeRestaurant($request, $menuItem->restaurant);

        $menuItem->update($this->validateMenuItem($request, partial: true));

        return response()->json(new MenuItemResource($menuItem->fresh()));
    }

    // Elimina un plato del menú permanentemente
    public function destroy(Request $request, MenuItem $menuItem): JsonResponse
    {
        $this->authorizeRestaurant($request, $menuItem->restaurant);

        $menuItem->delete();

        return response()->json(['message' => 'Plato eliminado correctamente.']);
    }

    // Devuelve las reservas de un restaurante con soporte para filtrar por estado.
    // El propietario puede ver confirmadas, pendientes, completadas, canceladas o no presentadas
    public function reservations(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->authorizeRestaurant($request, $restaurant);

        $status = $request->get('status');

        $query = \App\Models\Reservation::with(['user', 'table'])
            ->where('restaurant_id', $restaurant->id)
            ->orderByDesc('start_time');

        if ($status) {
            $query->where('status', $status);
        }

        $reservations = $query->paginate(20);

        return response()->json([
            'data' => $reservations->map(fn ($r) => [
                'id'          => $r->id,
                'guest_name'  => $r->user->name ?? 'Cliente',
                'guest_email' => $r->user->email ?? '',
                'table'       => $r->table->name ?? "Mesa #{$r->table_id}",
                'guests'      => $r->guests,
                'start_time'  => $r->start_time?->toIso8601String(),
                'status'      => $r->status,
                'notes'       => $r->notes,
            ]),
            'total'    => $reservations->total(),
            'per_page' => $reservations->perPage(),
        ]);
    }

    // Valida el QR o el código manual RYA-000001 que recibe el cliente.
    // Si complete=true, también marca la reserva como completada al llegar.
    public function scanReservation(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->authorizeRestaurant($request, $restaurant);

        $data = $request->validate([
            'code'     => ['required', 'string', 'max:500'],
            'complete' => ['sometimes', 'boolean'],
        ]);

        $reservation = $this->findReservationByCode($restaurant, trim($data['code']));

        if (! $reservation) {
            abort(404, 'No encontramos una reserva con ese código para este restaurante.');
        }

        if ($data['complete'] ?? false) {
            if (in_array($reservation->status, ['cancelled', 'no_show'], true)) {
                abort(422, 'Esta reserva ya no se puede completar.');
            }

            if ($reservation->status !== 'completed') {
                $reservation->update(['status' => 'completed']);
            }
        }

        $reservation->load(['user', 'table']);

        return response()->json([
            'message'     => 'Reserva validada correctamente.',
            'reservation' => $this->reservationPayload($reservation),
        ]);
    }

    // Permite al propietario cambiar el estado de una reserva de su restaurante.
    // Puede confirmar, completar, cancelar o marcar no asistencia
    public function updateReservationStatus(Request $request, Reservation $reservation): JsonResponse
    {
        $this->ensureOwner($request);

        // Verifico que la reserva sea de un restaurante que le pertenece
        if ($reservation->restaurant->owner_id !== $request->user()->id) {
            abort(403, 'No tienes permiso para modificar esta reserva.');
        }

        $data = $request->validate([
            'status' => 'required|in:confirmed,cancelled,completed,no_show',
        ]);

        $reservation->update(['status' => $data['status']]);

        return response()->json(['message' => 'Estado actualizado.', 'status' => $reservation->status]);
    }

    // Estadísticas del restaurante para el panel del propietario.
    // Incluye reservas por hora del día, por día de la semana y un resumen general.
    // La consulta SQL varía según si usamos PostgreSQL o SQLite
    public function stats(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->authorizeRestaurant($request, $restaurant);

        $driver = \DB::connection()->getDriverName();

        // Cuento reservas agrupadas por hora del día (de 10 a 23)
        if ($driver === 'pgsql') {
            $byHour = \DB::table('reservations')
                ->selectRaw("EXTRACT(HOUR FROM start_time)::int AS hour, COUNT(*) AS total")
                ->where('restaurant_id', $restaurant->id)
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->groupByRaw("EXTRACT(HOUR FROM start_time)::int")
                ->orderByRaw("EXTRACT(HOUR FROM start_time)::int")
                ->get();
        } else {
            $byHour = \DB::table('reservations')
                ->selectRaw("CAST(strftime('%H', start_time) AS INTEGER) AS hour, COUNT(*) AS total")
                ->where('restaurant_id', $restaurant->id)
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->groupByRaw("strftime('%H', start_time)")
                ->orderByRaw("strftime('%H', start_time)")
                ->get();
        }

        // Cuento reservas agrupadas por día de la semana
        if ($driver === 'pgsql') {
            $byDay = \DB::table('reservations')
                ->selectRaw("EXTRACT(DOW FROM start_time)::int AS day_num, COUNT(*) AS total")
                ->where('restaurant_id', $restaurant->id)
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->groupByRaw("EXTRACT(DOW FROM start_time)::int")
                ->orderByRaw("EXTRACT(DOW FROM start_time)::int")
                ->get();
        } else {
            $byDay = \DB::table('reservations')
                ->selectRaw("CAST(strftime('%w', start_time) AS INTEGER) AS day_num, COUNT(*) AS total")
                ->where('restaurant_id', $restaurant->id)
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->groupByRaw("strftime('%w', start_time)")
                ->orderByRaw("strftime('%w', start_time)")
                ->get();
        }

        // Me aseguro de que todos los días de la semana aparezcan aunque tengan 0 reservas
        $dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        $byDayFormatted = collect(range(0, 6))->map(function ($d) use ($byDay, $dayNames) {
            $found = collect($byDay)->firstWhere('day_num', $d);
            return ['day' => $dayNames[$d], 'total' => $found ? (int) $found->total : 0];
        });

        // Como no tenemos tabla de pedidos, uso los platos del menú como referencia.
        // Los primeros en sort_order son los que el dueño considera más importantes
        $topItems = $restaurant->menuItems()
            ->where('is_available', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->limit(8)
            ->get()
            ->map(fn ($item) => [
                'nombre'    => $item->name,
                'precio'    => (float) $item->price,
                'categoria' => $item->category ?? 'General',
            ]);

        // Números generales del restaurante
        $totalReservations = \App\Models\Reservation::where('restaurant_id', $restaurant->id)->count();
        $confirmedCount    = \App\Models\Reservation::where('restaurant_id', $restaurant->id)->where('status', 'confirmed')->count();
        $cancelledCount    = \App\Models\Reservation::where('restaurant_id', $restaurant->id)->where('status', 'cancelled')->count();
        $completedCount    = \App\Models\Reservation::where('restaurant_id', $restaurant->id)->where('status', 'completed')->count();
        $noShowCount       = \App\Models\Reservation::where('restaurant_id', $restaurant->id)->where('status', 'no_show')->count();
        $totalGuests       = \App\Models\Reservation::where('restaurant_id', $restaurant->id)->whereNotIn('status', ['cancelled', 'no_show'])->sum('guests');
        $avgGuests         = \App\Models\Reservation::where('restaurant_id', $restaurant->id)->whereNotIn('status', ['cancelled', 'no_show'])->avg('guests');

        return response()->json([
            'summary' => [
                'total_reservations' => $totalReservations,
                'confirmed'          => $confirmedCount,
                'cancelled'          => $cancelledCount,
                'completed'          => $completedCount,
                'no_show'            => $noShowCount,
                'total_guests'       => (int) $totalGuests,
                'avg_guests'         => round((float) $avgGuests, 1),
            ],
            'by_hour' => collect(range(10, 23))->map(function ($h) use ($byHour) {
                $found = collect($byHour)->firstWhere('hour', $h);
                return ['hora' => "{$h}:00", 'reservas' => $found ? (int) $found->total : 0];
            }),
            'by_day'     => $byDayFormatted,
            'menu_items' => $topItems,
        ]);
    }

    private function findReservationByCode(Restaurant $restaurant, string $code): ?Reservation
    {
        $query = Reservation::where('restaurant_id', $restaurant->id);

        if (preg_match('/^RYA-0*(\d+)$/i', $code, $matches)) {
            return (clone $query)->whereKey((int) $matches[1])->first();
        }

        if (preg_match('/^\d+$/', $code)) {
            return (clone $query)->whereKey((int) $code)->first();
        }

        $qrPayload = $this->extractQrPayload($code);

        if (! str_starts_with($qrPayload, 'reservaya-')) {
            return null;
        }

        return (clone $query)
            ->where(function ($q) use ($qrPayload) {
                $q->where('qr_code', 'like', '%' . $qrPayload . '%')
                    ->orWhere('qr_code', 'like', '%' . rawurlencode($qrPayload) . '%');
            })
            ->first();
    }

    private function extractQrPayload(string $code): string
    {
        if (str_contains($code, 'data=')) {
            $query = parse_url($code, PHP_URL_QUERY);
            parse_str($query ?: '', $params);

            if (! empty($params['data']) && is_string($params['data'])) {
                return trim($params['data']);
            }
        }

        return trim($code);
    }

    private function reservationPayload(Reservation $reservation): array
    {
        return [
            'id'          => $reservation->id,
            'code'        => 'RYA-' . str_pad($reservation->id, 6, '0', STR_PAD_LEFT),
            'guest_name'  => $reservation->user->name ?? 'Cliente',
            'guest_email' => $reservation->user->email ?? '',
            'table'       => $reservation->table->name ?? "Mesa #{$reservation->table_id}",
            'guests'      => $reservation->guests,
            'start_time'  => $reservation->start_time?->toIso8601String(),
            'status'      => $reservation->status,
            'notes'       => $reservation->notes,
        ];
    }

    // Verifico que el usuario sea propietario antes de cualquier operación
    private function ensureOwner(Request $request): void
    {
        if (! $request->user()?->isOwner()) {
            abort(403, 'Solo los propietarios pueden administrar menús.');
        }
    }

    // Verifico que el propietario sea dueño del restaurante que quiere modificar.
    // Esto evita que un owner toque los restaurantes de otro
    private function authorizeRestaurant(Request $request, Restaurant $restaurant): void
    {
        $this->ensureOwner($request);

        if ($restaurant->owner_id !== $request->user()->id) {
            abort(403, 'No tienes permiso para modificar este restaurante.');
        }
    }

    // Valida los campos de un plato del menú.
    // Con partial: true los campos no son obligatorios (para edición parcial)
    private function validateMenuItem(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name'         => [$required, 'string', 'max:255'],
            'description'  => ['nullable', 'string', 'max:1000'],
            'category'     => ['nullable', 'string', 'max:100'],
            'price'        => [$required, 'numeric', 'min:0', 'max:99999999.99'],
            'image_url'    => ['nullable', 'url', 'max:500'],
            'is_available' => ['sometimes', 'boolean'],
            'sort_order'   => ['sometimes', 'integer', 'min:0', 'max:65535'],
        ]);
    }
}
