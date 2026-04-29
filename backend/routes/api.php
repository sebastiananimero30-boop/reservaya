<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\RestaurantController;
use Illuminate\Support\Facades\Route;

// ── Auth (público) ─────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me',      [AuthController::class, 'me']);
    });
});

// ── Catálogo (público) ─────────────────────────────────────────────────────
Route::get('categories',   [CategoryController::class, 'index']);
Route::get('restaurants',  [RestaurantController::class, 'index']);
Route::get('restaurants/{restaurant}', [RestaurantController::class, 'show']);

// El frontend llama /tables Y /availability — ambos hacen lo mismo
Route::get('restaurants/{restaurant}/tables',       [RestaurantController::class, 'availableTables']);
Route::get('restaurants/{restaurant}/availability', [RestaurantController::class, 'availableTables']);

// ── Rutas protegidas ───────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('reservations',                       [ReservationController::class, 'store']);
    Route::get('reservations/{reservation}',          [ReservationController::class, 'show']);
    Route::patch('reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
    Route::get('my/reservations',                     [ReservationController::class, 'myReservations']);
});

// ── Health check ───────────────────────────────────────────────────────────
Route::get('health', fn () => response()->json([
    'status'  => 'ok',
    'service' => 'ReservaYa API',
    'version' => '1.0.0',
]));
