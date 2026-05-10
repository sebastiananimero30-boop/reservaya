<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * GET /api/restaurants/{restaurant}/reviews
     * Devuelve las reseñas públicas de un restaurante
     */
    public function index(Restaurant $restaurant): JsonResponse
    {
        $reviews = $restaurant->reviews()
            ->with('user:id,name')
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id'         => $r->id,
                'rating'     => $r->rating,
                'comment'    => $r->comment,
                'user_name'  => $r->user->name ?? 'Cliente',
                'created_at' => $r->created_at->toDateString(),
            ]);

        return response()->json(['data' => $reviews]);
    }

    /**
     * POST /api/restaurants/{restaurant}/reviews
     * El cliente autenticado deja una reseña.
     * Solo puede dejar una reseña por restaurante.
     */
    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        // Verifico que el usuario haya tenido una reserva completada en este restaurante
        $hasVisited = Reservation::where('user_id', $request->user()->id)
            ->where('restaurant_id', $restaurant->id)
            ->where('status', 'completed')
            ->exists();

        if (! $hasVisited) {
            return response()->json([
                'message' => 'Solo puedes reseñar restaurantes donde hayas tenido una reserva completada.',
            ], 403);
        }

        // Un usuario solo puede dejar una reseña por restaurante
        $review = Review::updateOrCreate(
            ['restaurant_id' => $restaurant->id, 'user_id' => $request->user()->id],
            ['rating' => $data['rating'], 'comment' => $data['comment'] ?? null]
        );

        // Recalculo el rating del restaurante
        $restaurant->updateRating();

        return response()->json([
            'message' => 'Reseña guardada correctamente.',
            'review'  => [
                'id'         => $review->id,
                'rating'     => $review->rating,
                'comment'    => $review->comment,
                'user_name'  => $request->user()->name,
                'created_at' => $review->created_at->toDateString(),
            ],
        ], 201);
    }

    /**
     * DELETE /api/restaurants/{restaurant}/reviews
     * El cliente elimina su propia reseña
     */
    public function destroy(Request $request, Restaurant $restaurant): JsonResponse
    {
        $review = Review::where('restaurant_id', $restaurant->id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $review->delete();
        $restaurant->updateRating();

        return response()->json(['message' => 'Reseña eliminada.']);
    }
}
