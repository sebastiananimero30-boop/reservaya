<?php

namespace Database\Factories;

use App\Models\MenuItem;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

class MenuItemFactory extends Factory
{
    protected $model = MenuItem::class;

    public function definition(): array
    {
        return [
            'restaurant_id' => Restaurant::factory(),
            'name'          => fake()->words(3, true),
            'description'   => fake()->sentence(),
            'category'      => fake()->randomElement(['Entradas', 'Platos Fuertes', 'Postres', 'Bebidas']),
            'price'         => fake()->numberBetween(8000, 60000),
            'image_url'     => null,
            'is_available'  => true,
            'sort_order'    => 0,
        ];
    }
}
