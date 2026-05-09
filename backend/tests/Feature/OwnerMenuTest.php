<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OwnerMenuTest extends TestCase
{
    use RefreshDatabase;

    // ── Menú ───────────────────────────────────────────────────────────────────

    public function test_owner_can_view_own_restaurant_menu(): void
    {
        $owner      = User::factory()->owner()->create();
        $restaurant = Restaurant::factory()->create(['owner_id' => $owner->id]);
        MenuItem::factory()->count(3)->create(['restaurant_id' => $restaurant->id]);

        $response = $this->actingAs($owner)
             ->getJson("/api/owner/restaurants/{$restaurant->id}/menu")
             ->assertStatus(200);

        // MenuItemResource::collection envuelve en 'data'
        $items = $response->json('data') ?? $response->json();
        $this->assertCount(3, $items);
    }

    public function test_owner_cannot_view_other_owners_menu(): void
    {
        $owner1     = User::factory()->owner()->create();
        $owner2     = User::factory()->owner()->create();
        $restaurant = Restaurant::factory()->create(['owner_id' => $owner1->id]);

        $this->actingAs($owner2)
             ->getJson("/api/owner/restaurants/{$restaurant->id}/menu")
             ->assertStatus(403);
    }

    public function test_owner_can_add_menu_item(): void
    {
        $owner      = User::factory()->owner()->create();
        $restaurant = Restaurant::factory()->create(['owner_id' => $owner->id]);

        $response = $this->actingAs($owner)
                         ->postJson("/api/owner/restaurants/{$restaurant->id}/menu", [
                             'name'         => 'Pizza Margherita',
                             'price'        => 28000,
                             'category'     => 'Pizzas',
                             'description'  => 'Clásica pizza italiana',
                             'is_available' => true,
                         ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('menu_items', [
            'restaurant_id' => $restaurant->id,
            'name'          => 'Pizza Margherita',
        ]);
    }

    public function test_owner_can_update_menu_item(): void
    {
        $owner      = User::factory()->owner()->create();
        $restaurant = Restaurant::factory()->create(['owner_id' => $owner->id]);
        $item       = MenuItem::factory()->create(['restaurant_id' => $restaurant->id, 'price' => 20000]);

        $this->actingAs($owner)
             ->patchJson("/api/owner/menu-items/{$item->id}", ['price' => 25000])
             ->assertStatus(200);

        $this->assertDatabaseHas('menu_items', ['id' => $item->id, 'price' => 25000]);
    }

    public function test_owner_can_delete_menu_item(): void
    {
        $owner      = User::factory()->owner()->create();
        $restaurant = Restaurant::factory()->create(['owner_id' => $owner->id]);
        $item       = MenuItem::factory()->create(['restaurant_id' => $restaurant->id]);

        $this->actingAs($owner)
             ->deleteJson("/api/owner/menu-items/{$item->id}")
             ->assertStatus(200);

        $this->assertDatabaseMissing('menu_items', ['id' => $item->id]);
    }

    public function test_owner_can_toggle_item_visibility(): void
    {
        $owner      = User::factory()->owner()->create();
        $restaurant = Restaurant::factory()->create(['owner_id' => $owner->id]);
        $item       = MenuItem::factory()->create([
            'restaurant_id' => $restaurant->id,
            'is_available'  => true,
        ]);

        $this->actingAs($owner)
             ->patchJson("/api/owner/menu-items/{$item->id}", ['is_available' => false])
             ->assertStatus(200);

        $this->assertDatabaseHas('menu_items', ['id' => $item->id, 'is_available' => false]);
    }

    public function test_client_cannot_manage_menu(): void
    {
        $client     = User::factory()->client()->create();
        $restaurant = Restaurant::factory()->create();

        $this->actingAs($client)
             ->postJson("/api/owner/restaurants/{$restaurant->id}/menu", [
                 'name'  => 'Plato',
                 'price' => 10000,
             ])
             ->assertStatus(403);
    }

    // ── Reservas del propietario ───────────────────────────────────────────────

    public function test_owner_can_view_restaurant_reservations(): void
    {
        $owner      = User::factory()->owner()->create();
        $restaurant = Restaurant::factory()->create(['owner_id' => $owner->id]);

        $this->actingAs($owner)
             ->getJson("/api/owner/restaurants/{$restaurant->id}/reservations")
             ->assertStatus(200)
             ->assertJsonStructure(['data']);
    }

    public function test_owner_can_get_restaurant_stats(): void
    {
        $owner      = User::factory()->owner()->create();
        $restaurant = Restaurant::factory()->create(['owner_id' => $owner->id]);

        $this->actingAs($owner)
             ->getJson("/api/owner/restaurants/{$restaurant->id}/stats")
             ->assertStatus(200)
             ->assertJsonStructure(['summary', 'by_hour', 'by_day', 'menu_items']);
    }
}
