<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    // ── Propietarios ───────────────────────────────────────────────────────────

    public function test_admin_can_list_owners(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->owner()->count(3)->create();

        $this->actingAs($admin)
             ->getJson('/api/admin/owners')
             ->assertStatus(200)
             ->assertJsonCount(3, 'data');
    }

    public function test_non_admin_cannot_list_owners(): void
    {
        $client = User::factory()->client()->create();

        $this->actingAs($client)
             ->getJson('/api/admin/owners')
             ->assertStatus(403);
    }

    public function test_admin_can_create_owner(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)
                         ->postJson('/api/admin/owners', [
                             'name'  => 'Nuevo Propietario',
                             'email' => 'owner@nuevo.com',
                             'phone' => '+57 310 000 0000',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['owner', 'password']);

        $this->assertDatabaseHas('users', [
            'email' => 'owner@nuevo.com',
            'role'  => 'owner',
        ]);
    }

    public function test_admin_can_delete_owner(): void
    {
        $admin = User::factory()->admin()->create();
        $owner = User::factory()->owner()->create();

        $this->actingAs($admin)
             ->deleteJson("/api/admin/owners/{$owner->id}")
             ->assertStatus(200);

        $this->assertDatabaseMissing('users', ['id' => $owner->id]);
    }

    public function test_admin_cannot_delete_non_owner_user(): void
    {
        $admin  = User::factory()->admin()->create();
        $client = User::factory()->client()->create();

        $this->actingAs($admin)
             ->deleteJson("/api/admin/owners/{$client->id}")
             ->assertStatus(422);
    }

    // ── Restaurantes ───────────────────────────────────────────────────────────

    public function test_admin_can_list_all_restaurants(): void
    {
        $admin = User::factory()->admin()->create();
        Restaurant::factory()->count(5)->create();

        $this->actingAs($admin)
             ->getJson('/api/admin/restaurants')
             ->assertStatus(200)
             ->assertJsonCount(5, 'data');
    }

    public function test_admin_can_create_restaurant(): void
    {
        $admin    = User::factory()->admin()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin)
                         ->postJson('/api/admin/restaurants', [
                             'name'        => 'Nuevo Restaurante',
                             'address'     => 'Calle 10 #5-20',
                             'zone'        => 'Centro',
                             'category_id' => $category->id,
                             'capacity'    => 40,
                             'table_count' => 8,
                             'table_seats' => 5,
                         ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('restaurants', ['name' => 'Nuevo Restaurante']);
        $this->assertSame(8, Table::where('restaurant_id', $response->json('id'))->where('is_active', true)->count());
        $this->assertDatabaseHas('tables', [
            'restaurant_id' => $response->json('id'),
            'name'          => 'Mesa 1',
            'seats'         => 5,
            'is_active'     => true,
        ]);
    }

    public function test_admin_can_create_restaurant_with_individual_table_capacities(): void
    {
        $admin    = User::factory()->admin()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin)
                         ->postJson('/api/admin/restaurants', [
                             'name'        => 'Bistro Mesas',
                             'address'     => 'Calle 1 #2-3',
                             'zone'        => 'Centro',
                             'category_id' => $category->id,
                             'tables'      => [
                                 ['name' => 'Barra individual', 'seats' => 1],
                                 ['name' => 'Mesa pareja', 'seats' => 2],
                                 ['name' => 'Mesa familiar', 'seats' => 6],
                             ],
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('capacity', 9)
                 ->assertJsonPath('tables_count', 3);

        $restaurantId = $response->json('id');

        $this->assertDatabaseHas('tables', [
            'restaurant_id' => $restaurantId,
            'name'          => 'Barra individual',
            'seats'         => 1,
            'is_active'     => true,
        ]);

        $this->assertDatabaseHas('restaurants', [
            'id'       => $restaurantId,
            'capacity' => 9,
        ]);
    }

    public function test_admin_can_assign_owner_to_restaurant(): void
    {
        $admin      = User::factory()->admin()->create();
        $owner      = User::factory()->owner()->create();
        $restaurant = Restaurant::factory()->create(['owner_id' => null]);

        $this->actingAs($admin)
             ->patchJson("/api/admin/restaurants/{$restaurant->id}/assign", [
                 'owner_id' => $owner->id,
             ])
             ->assertStatus(200);

        $this->assertDatabaseHas('restaurants', [
            'id'       => $restaurant->id,
            'owner_id' => $owner->id,
        ]);
    }

    public function test_admin_can_update_individual_table_capacities(): void
    {
        $admin      = User::factory()->admin()->create();
        $restaurant = Restaurant::factory()->create();
        $tableOne   = Table::factory()->create([
            'restaurant_id' => $restaurant->id,
            'name'          => 'Mesa 1',
            'seats'         => 4,
            'is_active'     => true,
        ]);
        $tableTwo   = Table::factory()->create([
            'restaurant_id' => $restaurant->id,
            'name'          => 'Mesa 2',
            'seats'         => 4,
            'is_active'     => true,
        ]);

        $this->actingAs($admin)
             ->patchJson("/api/admin/restaurants/{$restaurant->id}", [
                 'tables' => [
                     ['id' => $tableOne->id, 'name' => 'Individual', 'seats' => 1],
                     ['id' => $tableTwo->id, 'name' => 'Pareja', 'seats' => 2],
                     ['name' => 'Grupo', 'seats' => 8],
                 ],
             ])
             ->assertStatus(200)
             ->assertJsonPath('restaurant.capacity', 11);

        $this->assertDatabaseHas('tables', [
            'id'    => $tableOne->id,
            'name'  => 'Individual',
            'seats' => 1,
        ]);

        $this->assertDatabaseHas('tables', [
            'restaurant_id' => $restaurant->id,
            'name'          => 'Grupo',
            'seats'         => 8,
            'is_active'     => true,
        ]);
    }

    public function test_admin_can_get_stats(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
             ->getJson('/api/admin/stats')
             ->assertStatus(200)
             ->assertJsonStructure(['summary', 'by_month', 'by_status', 'by_category']);
    }

    // ── Categorías ─────────────────────────────────────────────────────────────

    public function test_admin_can_list_categories(): void
    {
        $admin = User::factory()->admin()->create();
        Category::factory()->count(3)->create();

        $this->actingAs($admin)
             ->getJson('/api/admin/categories')
             ->assertStatus(200)
             ->assertJsonCount(3, 'data');
    }
}
