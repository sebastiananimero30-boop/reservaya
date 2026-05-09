<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RestaurantFactory extends Factory
{
    protected $model = Restaurant::class;

    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'owner_id'    => User::factory()->owner(),
            'name'        => fake()->company() . ' Restaurant',
            'description' => fake()->paragraph(),
            'address'     => fake()->streetAddress(),
            'zone'        => fake()->city(),
            'latitude'    => fake()->latitude(4.0, 5.0),
            'longitude'   => fake()->longitude(-76.0, -74.0),
            'rating'      => fake()->randomFloat(1, 3.0, 5.0),
            'capacity'    => fake()->numberBetween(20, 100),
            'phone'       => fake()->phoneNumber(),
            'is_active'   => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
