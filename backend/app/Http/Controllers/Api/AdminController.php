<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantResource;
use App\Http\Resources\UserResource;
use App\Models\Category;
use App\Models\Restaurant;
use App\Models\RestaurantPhoto;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    // ── Guard ──────────────────────────────────────────────────────────────────
    private function ensureAdmin(Request $request): void
    {
        if (! $request->user()?->isAdmin()) {
            abort(403, 'Solo los administradores pueden realizar esta acción.');
        }
    }

    // ── GET /api/admin/owners ──────────────────────────────────────────────────
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

    // ── POST /api/admin/owners ─────────────────────────────────────────────────
    public function createOwner(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
        ]);

        // Generar contraseña aleatoria segura
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
            'password' => $plainPassword, // Solo se devuelve una vez
            'message'  => 'Propietario creado. Guarda la contraseña, no se mostrará de nuevo.',
        ], 201);
    }

    // ── DELETE /api/admin/owners/{user} ───────────────────────────────────────
    public function deleteOwner(Request $request, User $user): JsonResponse
    {
        $this->ensureAdmin($request);

        if (! $user->isOwner()) {
            abort(422, 'El usuario no es un propietario.');
        }

        // Desasignar restaurantes (no eliminarlos)
        $user->restaurants()->update(['owner_id' => null]);
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Propietario eliminado correctamente.']);
    }

    // ── GET /api/admin/restaurants ────────────────────────────────────────────
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

    // ── POST /api/admin/restaurants ───────────────────────────────────────────
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
        ]);

        $restaurant = Restaurant::create([
            ...$data,
            'rating'    => 0,
            'is_active' => true,
        ]);

        // Horario por defecto (lun-dom, lunes cerrado)
        foreach (range(0, 6) as $day) {
            Schedule::create([
                'restaurant_id' => $restaurant->id,
                'day_of_week'   => $day,
                'open_time'     => '11:00:00',
                'close_time'    => '23:00:00',
                'is_closed'     => ($day === 1),
            ]);
        }

        $restaurant->load(['category', 'photos']);

        return response()->json(new RestaurantResource($restaurant), 201);
    }

    // ── PATCH /api/admin/restaurants/{restaurant}/assign ──────────────────────
    public function assignOwner(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'owner_id' => 'nullable|exists:users,id',
        ]);

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

    // ── PATCH /api/admin/restaurants/{restaurant}/cover ──────────────────────
    public function updateCover(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'url' => 'required|url|max:500',
        ]);

        // Actualizar o crear la foto de portada
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

    // ── GET /api/admin/categories ─────────────────────────────────────────────
    public function categories(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json([
            'data' => Category::orderBy('name')->get(),
        ]);
    }
}
