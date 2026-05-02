<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web:      __DIR__ . '/../routes/web.php',
        api:      __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health:   '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // El middleware de CORS lo registro globalmente para que se ejecute
        // antes que cualquier otra cosa, incluyendo las peticiones preflight OPTIONS
        // que el navegador manda antes de cada request real
        $middleware->use([
            \App\Http\Middleware\CorsMiddleware::class,
        ]);

        $middleware->alias([
            'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Capturo los errores más comunes y los devuelvo en formato JSON
        // cuando la petición viene de la API, para que el frontend los pueda manejar bien

        // Token inválido o expirado
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'No autenticado.'], 401);
            }
        });

        // Campos inválidos en el formulario
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Error de validacion.', 'errors' => $e->errors()], 422);
            }
        });

        // Cuando busco un modelo por ID y no existe
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Recurso no encontrado.'], 404);
            }
        });

        // Cualquier otro error HTTP como 403, 409, etc.
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => $e->getMessage() ?: 'Error HTTP.'], $e->getStatusCode());
            }
        });
    })->create();
