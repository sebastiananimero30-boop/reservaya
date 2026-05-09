<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\OwnerMenuController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\RestaurantController;
use Illuminate\Support\Facades\Route;

// Rutas públicas de autenticación — no requieren token
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);

    // Google OAuth
    Route::get('google',          [GoogleAuthController::class, 'redirect']);
    Route::post('google/callback', [GoogleAuthController::class, 'callback']);

    // Estas sí requieren token porque necesito saber quién está cerrando sesión
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me',      [AuthController::class, 'me']);
    });
});

// Catálogo público — cualquier persona puede ver restaurantes sin estar registrada
Route::get('categories',                       [CategoryController::class,  'index']);
Route::get('restaurants',                      [RestaurantController::class, 'index']);
Route::get('restaurants/{restaurant}',         [RestaurantController::class, 'show']);

// El frontend llama a estos dos endpoints para consultar disponibilidad de mesas,
// los dejé con dos nombres distintos porque el componente los usa de formas diferentes
Route::get('restaurants/{restaurant}/tables',       [RestaurantController::class, 'availableTables']);
Route::get('restaurants/{restaurant}/availability', [RestaurantController::class, 'availableTables']);

// Todo lo que sigue requiere que el usuario esté autenticado con un token válido
Route::middleware('auth:sanctum')->group(function () {

    // Reservas — cualquier cliente autenticado puede crear y gestionar las suyas
    Route::post('reservations',                       [ReservationController::class, 'store']);
    Route::get('reservations/{reservation}',          [ReservationController::class, 'show']);
    Route::patch('reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
    Route::get('my/reservations',                     [ReservationController::class, 'myReservations']);

    // Panel del propietario — solo accesible para usuarios con rol owner
    Route::prefix('owner')->group(function () {
        Route::get('restaurants',                           [OwnerMenuController::class, 'restaurants']);
        Route::get('restaurants/{restaurant}/menu',         [OwnerMenuController::class, 'index']);
        Route::post('restaurants/{restaurant}/menu',        [OwnerMenuController::class, 'store']);
        Route::patch('menu-items/{menuItem}',               [OwnerMenuController::class, 'update']);
        Route::delete('menu-items/{menuItem}',              [OwnerMenuController::class, 'destroy']);
        Route::get('restaurants/{restaurant}/reservations', [OwnerMenuController::class, 'reservations']);
        Route::patch('reservations/{reservation}/status',   [OwnerMenuController::class, 'updateReservationStatus']);
        Route::get('restaurants/{restaurant}/stats',        [OwnerMenuController::class, 'stats']);
    });

    // Panel del administrador — solo accesible para usuarios con rol admin
    Route::prefix('admin')->group(function () {
        Route::get('owners',                            [AdminController::class, 'owners']);
        Route::post('owners',                           [AdminController::class, 'createOwner']);
        Route::delete('owners/{user}',                  [AdminController::class, 'deleteOwner']);
        Route::get('restaurants',                       [AdminController::class, 'restaurants']);
        Route::post('restaurants',                      [AdminController::class, 'createRestaurant']);
        Route::patch('restaurants/{restaurant}/assign', [AdminController::class, 'assignOwner']);
        Route::patch('restaurants/{restaurant}/cover',  [AdminController::class, 'updateCover']);
        Route::get('categories',                        [AdminController::class, 'categories']);
        Route::get('stats',                             [AdminController::class, 'stats']);
    });
});

// Endpoint de salud para verificar que la API está funcionando
Route::get('health', fn () => response()->json([
    'status'  => 'ok',
    'service' => 'ReservaYa API',
    'version' => '1.0.0',
]));

