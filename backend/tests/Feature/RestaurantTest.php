<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestaurantTest extends TestCase
{
    use RefreshDatabase;

    // ── Listado ────────────────────────────────────────────────────────────────

    public function test_can_list_active_restaurants(): void
    {
        Restaurant::factory()->count(3)->create(['is_active' => true]);
        Restaurant::factory()->create(['is_active' => false]);

        $response = $this->getJson('/api/restaurants');

        $response->assertStatus(200);
        // Solo deben aparecer los activos
        $this->assertCount(3, $response->json('data'));
    }

    public function test_can_filter_restaurants_by_category(): void
    {
        $cat1 = Category::factory()->create(['slug' => 'italiana']);
        $cat2 = Category::factory()->create(['slug' => 'parrilla']);

        Restaurant::factory()->count(2)->create(['category_id' => $cat1->id, 'is_active' => true]);
        Restaurant::factory()->create(['category_id' => $cat2->id, 'is_active' => true]);

        $response = $this->getJson('/api/restaurants?category=italiana');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_can_filter_restaurants_by_zone(): void
    {
        Restaurant::factory()->create(['zone' => 'Centro', 'is_active' => true]);
        Restaurant::factory()->create(['zone' => 'Chapetón', 'is_active' => true]);

        $response = $this->getJson('/api/restaurants?zone=Centro');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_can_search_restaurants_by_name(): void
    {
        Restaurant::factory()->create(['name' => 'La Ricotta Trattoria', 'is_active' => true]);
        Restaurant::factory()->create(['name' => 'Tango Parrilla', 'is_active' => true]);

        $response = $this->getJson('/api/restaurants?search=Ricotta');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    // ── Detalle ────────────────────────────────────────────────────────────────

    public function test_can_view_restaurant_detail(): void
    {
        $restaurant = Restaurant::factory()->create(['is_active' => true]);

        $response = $this->getJson("/api/restaurants/{$restaurant->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('id', $restaurant->id)
                 ->assertJsonPath('name', $restaurant->name);
    }

    public function test_restaurant_detail_includes_available_tables(): void
    {
        $restaurant = Restaurant::factory()->create(['is_active' => true]);
        Table::factory()->count(3)->create(['restaurant_id' => $restaurant->id, 'is_active' => true]);

        $response = $this->getJson("/api/restaurants/{$restaurant->id}");

        $response->assertStatus(200)
                 ->assertJsonStructure(['available_tables']);
        $this->assertCount(3, $response->json('available_tables'));
    }

    // ── Disponibilidad ─────────────────────────────────────────────────────────

    public function test_can_check_table_availability(): void
    {
        $restaurant = Restaurant::factory()->create();
        Table::factory()->count(2)->create([
            'restaurant_id' => $restaurant->id,
            'seats'         => 4,
            'is_active'     => true,
        ]);

        $date = now()->addDay()->format('Y-m-d');
        $time = '19:00';

        $response = $this->getJson("/api/restaurants/{$restaurant->id}/availability?date={$date}&time={$time}&guests=2");

        $response->assertStatus(200)
                 ->assertJsonStructure(['tables'])
                 ->assertJsonCount(2, 'tables');
    }

    public function test_availability_excludes_tables_with_insufficient_seats(): void
    {
        $restaurant = Restaurant::factory()->create();
        Table::factory()->create(['restaurant_id' => $restaurant->id, 'seats' => 2, 'is_active' => true]);
        Table::factory()->create(['restaurant_id' => $restaurant->id, 'seats' => 6, 'is_active' => true]);

        $date = now()->addDay()->format('Y-m-d');

        $response = $this->getJson("/api/restaurants/{$restaurant->id}/availability?date={$date}&time=19:00&guests=4");

        $response->assertStatus(200);
        // Solo la mesa de 6 debe aparecer
        $this->assertCount(1, $response->json('tables'));
    }

    // ── Categorías ─────────────────────────────────────────────────────────────

    public function test_can_list_categories(): void
    {
        Category::factory()->count(4)->create();

        $this->getJson('/api/categories')
             ->assertStatus(200);
    }
}
