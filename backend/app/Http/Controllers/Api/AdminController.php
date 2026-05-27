<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantResource;
use App\Http\Resources\UserResource;
use App\Models\Category;
use App\Models\Restaurant;
use App\Models\RestaurantPhoto;
use App\Models\Schedule;
use App\Models\Table;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    // Verifico que el usuario que hace la petición sea administrador,
    // si no lo es simplemente corto la ejecución con un 403
    private function ensureAdmin(Request $request): void
    {
        if (! $request->user()?->isAdmin()) {
            abort(403, 'Solo los administradores pueden realizar esta acción.');
        }
    }

    // Devuelve todos los propietarios registrados junto con cuántos
    // restaurantes tiene cada uno asignados
    public function owners(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $owners = User::where('role', 'owner')
            ->withCount('restaurants')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => UserResource::collection($owners),
        ]);
    }

    // Crea un nuevo propietario con los datos que manda el admin.
    // La contraseña se genera automáticamente y se devuelve una sola vez,
    // después ya no hay forma de recuperarla desde aquí
    public function createOwner(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
        ]);

        // Genero una contraseña de 12 caracteres con letras y números
        $plainPassword = Str::password(12, letters: true, numbers: true, symbols: false);

        $owner = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'phone'    => $data['phone'] ?? null,
            'password' => Hash::make($plainPassword),
            'role'     => 'owner',
        ]);

        return response()->json([
            'owner'    => new UserResource($owner),
            'password' => $plainPassword, // esto solo se muestra aquí, después no se puede recuperar
            'message'  => 'Propietario creado. Guarda la contraseña, no se mostrará de nuevo.',
        ], 201);
    }

    // Elimina un propietario. Antes de borrarlo desasigno sus restaurantes
    // para que no queden huérfanos, y también revoco sus tokens activos
    public function deleteOwner(Request $request, User $user): JsonResponse
    {
        $this->ensureAdmin($request);

        if (! $user->isOwner()) {
            abort(422, 'El usuario no es un propietario.');
        }

        // Dejo los restaurantes sin dueño en vez de eliminarlos
        $user->restaurants()->update(['owner_id' => null]);
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Propietario eliminado correctamente.']);
    }

    // Lista todos los restaurantes de la plataforma con su categoría,
    // fotos y el conteo de mesas activas
    public function restaurants(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $restaurants = Restaurant::with(['category', 'photos'])
            ->withCount(['tables as tables_count' => fn ($q) => $q->where('is_active', true)])
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => RestaurantResource::collection($restaurants),
        ]);
    }

    // Crea un restaurante nuevo. También le genero un horario por defecto
    // de lunes a domingo, con el lunes cerrado, para que no quede sin horario
    public function createRestaurant(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'address'     => 'required|string|max:500',
            'zone'        => 'required|string|max:100',
            'phone'       => 'nullable|string|max:20',
            'category_id' => 'required|exists:categories,id',
            'owner_id'    => 'nullable|exists:users,id',
            'latitude'    => 'nullable|numeric|between:-90,90',
            'longitude'   => 'nullable|numeric|between:-180,180',
            'capacity'    => 'nullable|integer|min:1|max:1000',
            'table_count' => 'nullable|integer|min:1|max:200',
            'table_seats' => 'nullable|integer|min:1|max:20',
        ]);

        $tableCount = (int) ($data['table_count'] ?? 0);
        $tableSeats = (int) ($data['table_seats'] ?? 4);
        unset($data['table_count'], $data['table_seats']);

        if ($tableCount > 0 && empty($data['capacity'])) {
            $data['capacity'] = $tableCount * $tableSeats;
        }

        $restaurant = DB::transaction(function () use ($data, $tableCount, $tableSeats) {
            $restaurant = Restaurant::create([
                ...$data,
                'rating'    => 0,
                'is_active' => true,
            ]);

            // Creo el horario de la semana completa, el lunes lo dejo cerrado por defecto
            foreach (range(0, 6) as $day) {
                Schedule::create([
                    'restaurant_id' => $restaurant->id,
                    'day_of_week'   => $day,
                    'open_time'     => '11:00:00',
                    'close_time'    => '23:00:00',
                    'is_closed'     => ($day === 1),
                ]);
            }

            if ($tableCount > 0) {
                $this->syncRestaurantTables($restaurant, $tableCount, $tableSeats);
            }

            return $restaurant;
        });

        $restaurant->load(['category', 'photos']);
        $restaurant->loadCount(['tables as tables_count' => fn ($q) => $q->where('is_active', true)]);

        return response()->json(new RestaurantResource($restaurant), 201);
    }

    // Asigna o cambia el propietario de un restaurante.
    // Si mandan owner_id null, el restaurante queda sin dueño
    public function assignOwner(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'owner_id' => 'nullable|exists:users,id',
        ]);

        // Me aseguro de que el usuario que asigno tenga rol de propietario
        if ($data['owner_id']) {
            $owner = User::findOrFail($data['owner_id']);
            if (! $owner->isOwner()) {
                abort(422, 'El usuario seleccionado no tiene rol de propietario.');
            }
        }

        $restaurant->update(['owner_id' => $data['owner_id']]);

        return response()->json([
            'message'    => 'Restaurante asignado correctamente.',
            'restaurant' => new RestaurantResource($restaurant->fresh(['category', 'photos'])),
        ]);
    }

    // Actualiza la foto de portada de un restaurante.
    // Si ya tiene una foto de portada la actualizo, si no la creo
    public function updateCover(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'url' => 'required|url|max:500',
        ]);

        $cover = $restaurant->photos()->where('is_cover', true)->first();

        if ($cover) {
            $cover->update(['url' => $data['url']]);
        } else {
            $restaurant->photos()->create([
                'url'        => $data['url'],
                'is_cover'   => true,
                'sort_order' => 0,
            ]);
        }

        $restaurant->load(['category', 'photos']);

        return response()->json([
            'message'    => 'Foto de portada actualizada.',
            'restaurant' => new RestaurantResource($restaurant),
        ]);
    }

    // Estadísticas globales de la plataforma para el panel del admin.
    // Incluye reservas por mes, por estado, restaurantes por categoría y resumen general.
    // La consulta cambia un poco dependiendo de si usamos PostgreSQL o SQLite
    public function stats(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $driver = \DB::connection()->getDriverName();

        // Cuento las reservas de los últimos 6 meses agrupadas por mes
        if ($driver === 'pgsql') {
            $byMonth = \DB::table('reservations')
                ->selectRaw("TO_CHAR(start_time, 'Mon') AS mes, EXTRACT(MONTH FROM start_time)::int AS mes_num, COUNT(*) AS total")
                ->where('start_time', '>=', now()->subMonths(6))
                ->groupByRaw("TO_CHAR(start_time, 'Mon'), EXTRACT(MONTH FROM start_time)::int")
                ->orderByRaw("EXTRACT(MONTH FROM start_time)::int")
                ->get();
        } else {
            $byMonth = \DB::table('reservations')
                ->selectRaw("strftime('%m', start_time) AS mes_num, COUNT(*) AS total")
                ->where('start_time', '>=', now()->subMonths(6)->toDateTimeString())
                ->groupByRaw("strftime('%m', start_time)")
                ->orderByRaw("strftime('%m', start_time)")
                ->get();
        }

        // Convierto el número del mes a su abreviatura en español
        $monthNames = ['01'=>'Ene','02'=>'Feb','03'=>'Mar','04'=>'Abr','05'=>'May','06'=>'Jun','07'=>'Jul','08'=>'Ago','09'=>'Sep','10'=>'Oct','11'=>'Nov','12'=>'Dic'];
        $byMonthFormatted = $byMonth->map(fn($r) => [
            'mes'   => $monthNames[str_pad($r->mes_num, 2, '0', STR_PAD_LEFT)] ?? $r->mes_num,
            'total' => (int) $r->total,
        ]);

        // Cuántas reservas hay por cada estado
        $byStatus = \DB::table('reservations')
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->get()
            ->map(fn($r) => ['estado' => $r->status, 'total' => (int) $r->total]);

        // Cuántos restaurantes hay por categoría, ordenados de mayor a menor
        $byCategory = \DB::table('restaurants')
            ->join('categories', 'restaurants.category_id', '=', 'categories.id')
            ->selectRaw('categories.name AS categoria, categories.icon, COUNT(*) AS total')
            ->groupBy('categories.id', 'categories.name', 'categories.icon')
            ->orderByDesc('total')
            ->get();

        // Números generales de la plataforma
        $summary = [
            'total_restaurants'  => \App\Models\Restaurant::count(),
            'total_owners'       => \App\Models\User::where('role', 'owner')->count(),
            'total_clients'      => \App\Models\User::where('role', 'client')->count(),
            'total_reservations' => \App\Models\Reservation::count(),
            'total_confirmed'    => \App\Models\Reservation::where('status', 'confirmed')->count(),
            'total_cancelled'    => \App\Models\Reservation::where('status', 'cancelled')->count(),
            'total_no_show'      => \App\Models\Reservation::where('status', 'no_show')->count(),
            'total_guests'       => (int) \App\Models\Reservation::whereNotIn('status', ['cancelled', 'no_show'])->sum('guests'),
        ];

        return response()->json([
            'summary'     => $summary,
            'by_month'    => $byMonthFormatted,
            'by_status'   => $byStatus,
            'by_category' => $byCategory,
        ]);
    }

    // Devuelve todas las categorías disponibles para el formulario de crear restaurante
    public function categories(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json([
            'data' => Category::orderBy('name')->get(),
        ]);
    }

    // Edita los datos de un restaurante existente
    public function updateRestaurant(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:2000',
            'address'     => 'sometimes|string|max:500',
            'zone'        => 'sometimes|string|max:100',
            'phone'       => 'nullable|string|max:20',
            'category_id' => 'sometimes|exists:categories,id',
            'latitude'    => 'nullable|numeric|between:-90,90',
            'longitude'   => 'nullable|numeric|between:-180,180',
            'capacity'    => 'nullable|integer|min:1|max:1000',
            'table_count' => 'nullable|integer|min:1|max:200',
            'table_seats' => 'nullable|integer|min:1|max:20',
            'is_active'   => 'sometimes|boolean',
        ]);

        $tableCount = $data['table_count'] ?? null;
        $tableSeats = $data['table_seats'] ?? null;
        unset($data['table_count'], $data['table_seats']);

        DB::transaction(function () use ($restaurant, $data, $tableCount, $tableSeats) {
            $restaurant->update($data);

            if ($tableCount !== null || $tableSeats !== null) {
                $currentCount = $restaurant->tables()->where('is_active', true)->count();
                $currentSeats = $restaurant->tables()->where('is_active', true)->orderBy('id')->value('seats') ?? 4;

                $this->syncRestaurantTables(
                    $restaurant,
                    (int) ($tableCount ?? $currentCount ?: 1),
                    (int) ($tableSeats ?? $currentSeats)
                );
            }
        });

        $restaurant->load(['category', 'photos']);
        $restaurant->loadCount(['tables as tables_count' => fn ($q) => $q->where('is_active', true)]);

        return response()->json([
            'message'    => 'Restaurante actualizado correctamente.',
            'restaurant' => new RestaurantResource($restaurant),
        ]);
    }

    private function syncRestaurantTables(Restaurant $restaurant, int $tableCount, int $tableSeats): void
    {
        $activeTables = $restaurant->tables()->where('is_active', true)->orderBy('id')->get();

        foreach ($activeTables as $index => $table) {
            if ($index < $tableCount) {
                $table->update([
                    'name'  => 'Mesa ' . ($index + 1),
                    'seats' => $tableSeats,
                ]);
            } else {
                $table->update(['is_active' => false]);
            }
        }

        for ($number = $activeTables->count() + 1; $number <= $tableCount; $number++) {
            Table::create([
                'restaurant_id' => $restaurant->id,
                'name'          => 'Mesa ' . $number,
                'seats'         => $tableSeats,
                'price'         => 0,
                'is_active'     => true,
            ]);
        }
    }
}
