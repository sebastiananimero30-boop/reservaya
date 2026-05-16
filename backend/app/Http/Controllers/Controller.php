<?php

namespace App\Http\Controllers;

abstract class Controller
{
    /**
     * Respuesta de éxito estandarizada.
     */
    protected function success(mixed $data = null, string $message = 'OK', int $status = 200): \Illuminate\Http\JsonResponse
    {
        $response = ['message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        return response()->json($response, $status);
    }

    /**
     * Respuesta de error estandarizada.
     */
    protected function error(string $message, int $status = 400, array $errors = []): \Illuminate\Http\JsonResponse
    {
        $response = ['message' => $message];
        if (!empty($errors)) {
            $response['errors'] = $errors;
        }
        return response()->json($response, $status);
    }
}
