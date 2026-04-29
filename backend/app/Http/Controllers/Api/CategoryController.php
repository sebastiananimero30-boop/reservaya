<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    // GET /api/categories
    public function index(): JsonResponse
    {
        $categories = Category::withCount('restaurants')->get();

        return response()->json($categories->map(fn ($c) => [
            'id'                => $c->id,
            'name'              => $c->name,
            'slug'              => $c->slug,
            'icon'              => $c->icon,
            'restaurants_count' => $c->restaurants_count,
        ]));
    }
}
