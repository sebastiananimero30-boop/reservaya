<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\RestaurantResource;
use App\Models\MenuItem;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OwnerMenuController extends Controller
{
    public function restaurants(Request $request): AnonymousResourceCollection
    {
        $this->ensureOwner($request);

        $restaurants = Restaurant::with(['category', 'photos', 'menuItems'])
            ->where('owner_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        return RestaurantResource::collection($restaurants);
    }

    public function index(Request $request, Restaurant $restaurant): AnonymousResourceCollection
    {
        $this->authorizeRestaurant($request, $restaurant);

        return MenuItemResource::collection(
            $restaurant->menuItems()->get()
        );
    }

    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->authorizeRestaurant($request, $restaurant);

        $data = $this->validateMenuItem($request);

        $item = $restaurant->menuItems()->create($data);

        return response()->json(new MenuItemResource($item), 201);
    }

    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $this->authorizeRestaurant($request, $menuItem->restaurant);

        $menuItem->update($this->validateMenuItem($request, partial: true));

        return response()->json(new MenuItemResource($menuItem->fresh()));
    }

    public function destroy(Request $request, MenuItem $menuItem): JsonResponse
    {
        $this->authorizeRestaurant($request, $menuItem->restaurant);

        $menuItem->delete();

        return response()->json(['message' => 'Plato eliminado correctamente.']);
    }

    public function reservations(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->authorizeRestaurant($request, $restaurant);

        $status = $request->get('status'); // filtro opcional

        $query = \App\Models\Reservation::with(['user', 'table'])
            ->where('restaurant_id', $restaurant->id)
            ->orderByDesc('start_time');

        if ($status) {
            $query->where('status', $status);
        }

        $reservations = $query->paginate(20);

        return response()->json([
            'data' => $reservations->map(fn ($r) => [
                'id'         => $r->id,
                'guest_name' => $r->user->name ?? 'Cliente',
                'guest_email'=> $r->user->email ?? '',
                'table'      => $r->table->name ?? "Mesa #{$r->table_id}",
                'guests'     => $r->guests,
                'start_time' => $r->start_time?->toIso8601String(),
                'status'     => $r->status,
                'notes'      => $r->notes,
            ]),
            'total'    => $reservations->total(),
            'per_page' => $reservations->perPage(),
        ]);
    }

    public function updateReservationStatus(Request $request, \App\Models\Reservation $reservation): JsonResponse
    {
        $this->ensureOwner($request);

        // Verificar que la reserva pertenece a un restaurante del owner
        if ($reservation->restaurant->owner_id !== $request->user()->id) {
            abort(403, 'No tienes permiso para modificar esta reserva.');
        }

        $data = $request->validate([
            'status' => 'required|in:confirmed,cancelled,completed',
        ]);

        $reservation->update(['status' => $data['status']]);

        return response()->json(['message' => 'Estado actualizado.', 'status' => $reservation->status]);
    }
    public function stats(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->authorizeRestaurant($request, $restaurant);

        $driver = \DB::connection()->getDriverName();

        // ── Reservas por hora del día ──────────────────────────────────────────
        if ($driver === 'pgsql') {
            $byHour = \DB::table('reservations')
                ->selectRaw("EXTRACT(HOUR FROM start_time)::int AS hour, COUNT(*) AS total")
                ->where('restaurant_id', $restaurant->id)
                ->whereNotIn('status', ['cancelled'])
                ->groupByRaw("EXTRACT(HOUR FROM start_time)::int")
                ->orderByRaw("EXTRACT(HOUR FROM start_time)::int")
                ->get();
        } else {
            $byHour = \DB::table('reservations')
                ->selectRaw("CAST(strftime('%H', start_time) AS INTEGER) AS hour, COUNT(*) AS total")
                ->where('restaurant_id', $restaurant->id)
                ->whereNotIn('status', ['cancelled'])
                ->groupByRaw("strftime('%H', start_time)")
                ->orderByRaw("strftime('%H', start_time)")
                ->get();
        }

        // ── Reservas por día de la semana ──────────────────────────────────────
        if ($driver === 'pgsql') {
            $byDay = \DB::table('reservations')
                ->selectRaw("EXTRACT(DOW FROM start_time)::int AS day_num, COUNT(*) AS total")
                ->where('restaurant_id', $restaurant->id)
                ->whereNotIn('status', ['cancelled'])
                ->groupByRaw("EXTRACT(DOW FROM start_time)::int")
                ->orderByRaw("EXTRACT(DOW FROM start_time)::int")
                ->get();
        } else {
            $byDay = \DB::table('reservations')
                ->selectRaw("CAST(strftime('%w', start_time) AS INTEGER) AS day_num, COUNT(*) AS total")
                ->where('restaurant_id', $restaurant->id)
                ->whereNotIn('status', ['cancelled'])
                ->groupByRaw("strftime('%w', start_time)")
                ->orderByRaw("strftime('%w', start_time)")
                ->get();
        }

        $dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        $byDayFormatted = collect(range(0, 6))->map(function ($d) use ($byDay, $dayNames) {
            $found = collect($byDay)->firstWhere('day_num', $d);
            return ['day' => $dayNames[$d], 'total' => $found ? (int) $found->total : 0];
        });

        // ── Platos más pedidos (por nombre en notas — aproximación con menu) ──
        // Como no hay tabla de pedidos, usamos los platos del menú ordenados por sort_order
        // y mostramos los más visibles como proxy de popularidad
        $topItems = $restaurant->menuItems()
            ->where('is_available', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->limit(8)
            ->get()
            ->map(fn ($item) => [
                'nombre' => $item->name,
                'precio' => (float) $item->price,
                'categoria' => $item->category ?? 'General',
            ]);

        // ── Resumen general ────────────────────────────────────────────────────
        $totalReservations  = \App\Models\Reservation::where('restaurant_id', $restaurant->id)->count();
        $confirmedCount     = \App\Models\Reservation::where('restaurant_id', $restaurant->id)->where('status', 'confirmed')->count();
        $cancelledCount     = \App\Models\Reservation::where('restaurant_id', $restaurant->id)->where('status', 'cancelled')->count();
        $completedCount     = \App\Models\Reservation::where('restaurant_id', $restaurant->id)->where('status', 'completed')->count();
        $totalGuests        = \App\Models\Reservation::where('restaurant_id', $restaurant->id)->whereNotIn('status', ['cancelled'])->sum('guests');
        $avgGuests          = \App\Models\Reservation::where('restaurant_id', $restaurant->id)->whereNotIn('status', ['cancelled'])->avg('guests');

        return response()->json([
            'summary' => [
                'total_reservations' => $totalReservations,
                'confirmed'          => $confirmedCount,
                'cancelled'          => $cancelledCount,
                'completed'          => $completedCount,
                'total_guests'       => (int) $totalGuests,
                'avg_guests'         => round((float) $avgGuests, 1),
            ],
            'by_hour' => collect(range(10, 23))->map(function ($h) use ($byHour) {
                $found = collect($byHour)->firstWhere('hour', $h);
                return ['hora' => "{$h}:00", 'reservas' => $found ? (int) $found->total : 0];
            }),
            'by_day'      => $byDayFormatted,
            'menu_items'  => $topItems,
        ]);
    }

    private function ensureOwner(Request $request): void
    {
        if (! $request->user()?->isOwner()) {
            abort(403, 'Solo los propietarios pueden administrar menús.');
        }
    }

    private function authorizeRestaurant(Request $request, Restaurant $restaurant): void
    {
        $this->ensureOwner($request);

        if ($restaurant->owner_id !== $request->user()->id) {
            abort(403, 'No tienes permiso para modificar este restaurante.');
        }
    }

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
