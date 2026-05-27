<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationTest extends TestCase
{
    use RefreshDatabase;

    private function makeReservationData(Table $table, string $startTime = null): array
    {
        return [
            'restaurant_id' => $table->restaurant_id,
            'table_id'      => $table->id,
            'start_time'    => $startTime ?? now()->addDay()->setHour(19)->setMinute(0)->toIso8601String(),
            'guests'        => 2,
            'notes'         => 'Mesa junto a la ventana',
        ];
    }

    // ── Crear reserva ──────────────────────────────────────────────────────────

    public function test_authenticated_client_can_create_reservation(): void
    {
        $client = User::factory()->client()->create();
        $table  = Table::factory()->create(['seats' => 4, 'is_active' => true]);

        $response = $this->actingAs($client)
                         ->postJson('/api/reservations', $this->makeReservationData($table));

        $response->assertStatus(201)
                 ->assertJsonStructure(['id', 'status', 'qr_code']);

        $this->assertDatabaseHas('reservations', [
            'user_id'  => $client->id,
            'table_id' => $table->id,
            'status'   => 'confirmed',
        ]);
    }

    public function test_reservation_fails_without_authentication(): void
    {
        $table = Table::factory()->create(['seats' => 4, 'is_active' => true]);

        $this->postJson('/api/reservations', $this->makeReservationData($table))
             ->assertStatus(401);
    }

    public function test_reservation_fails_when_guests_exceed_table_capacity(): void
    {
        $client = User::factory()->client()->create();
        $table  = Table::factory()->create(['seats' => 2, 'is_active' => true]);

        $data           = $this->makeReservationData($table);
        $data['guests'] = 5; // más que la capacidad de 2

        $this->actingAs($client)
             ->postJson('/api/reservations', $data)
             ->assertStatus(422);
    }

    public function test_reservation_fails_when_table_is_already_booked(): void
    {
        $client = User::factory()->client()->create();
        $table  = Table::factory()->create(['seats' => 4, 'is_active' => true]);
        $startTime = now()->addDay()->setHour(19)->setMinute(0);

        // Primera reserva
        Reservation::create([
            'user_id'          => $client->id,
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => $startTime,
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'confirmed',
        ]);

        // Segunda reserva en el mismo horario — debe fallar con 409
        $this->actingAs($client)
             ->postJson('/api/reservations', $this->makeReservationData($table, $startTime->toIso8601String()))
             ->assertStatus(409);
    }

    public function test_reservation_succeeds_when_previous_is_cancelled(): void
    {
        $client = User::factory()->client()->create();
        $table  = Table::factory()->create(['seats' => 4, 'is_active' => true]);
        // Usamos un horario diferente para evitar el UNIQUE constraint (table_id, start_time)
        $startTime = now()->addDays(2)->setHour(20)->setMinute(0)->setSecond(0);

        // Reserva cancelada — no debe bloquear el horario
        Reservation::create([
            'user_id'          => $client->id,
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => $startTime,
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'cancelled',
        ]);

        // La nueva reserva va 1 segundo después para evitar el unique constraint
        $newStart = $startTime->copy()->addSecond();

        $this->actingAs($client)
             ->postJson('/api/reservations', $this->makeReservationData($table, $newStart->toIso8601String()))
             ->assertStatus(201);
    }

    public function test_anti_overlap_blocks_reservation_within_90_minutes(): void
    {
        $client = User::factory()->client()->create();
        $table  = Table::factory()->create(['seats' => 4, 'is_active' => true]);
        $startTime = now()->addDay()->setHour(19)->setMinute(0);

        // Reserva a las 19:00
        Reservation::create([
            'user_id'          => $client->id,
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => $startTime,
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'confirmed',
        ]);

        // Intento reservar a las 19:45 (dentro de la ventana de 90 min) — debe fallar
        $overlap = $startTime->copy()->addMinutes(45);

        $this->actingAs($client)
             ->postJson('/api/reservations', $this->makeReservationData($table, $overlap->toIso8601String()))
             ->assertStatus(409);
    }

    public function test_reservation_after_90_minutes_succeeds(): void
    {
        $client = User::factory()->client()->create();
        $table  = Table::factory()->create(['seats' => 4, 'is_active' => true]);
        $startTime = now()->addDay()->setHour(19)->setMinute(0);

        // Reserva a las 19:00
        Reservation::create([
            'user_id'          => $client->id,
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => $startTime,
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'confirmed',
        ]);

        // Reserva a las 20:30 (exactamente después de 90 min) — debe funcionar
        $after = $startTime->copy()->addMinutes(90);

        $this->actingAs($client)
             ->postJson('/api/reservations', $this->makeReservationData($table, $after->toIso8601String()))
             ->assertStatus(201);
    }

    // ── Cancelar reserva ───────────────────────────────────────────────────────

    public function test_client_can_cancel_own_reservation(): void
    {
        $client      = User::factory()->client()->create();
        $table       = Table::factory()->create(['seats' => 4, 'is_active' => true]);
        $reservation = Reservation::create([
            'user_id'          => $client->id,
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => now()->addDay(),
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'confirmed',
        ]);

        $this->actingAs($client)
             ->patchJson("/api/reservations/{$reservation->id}/cancel")
             ->assertStatus(200);

        $this->assertDatabaseHas('reservations', [
            'id'     => $reservation->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_client_cannot_cancel_another_users_reservation(): void
    {
        $owner       = User::factory()->client()->create();
        $other       = User::factory()->client()->create();
        $table       = Table::factory()->create(['seats' => 4, 'is_active' => true]);
        $reservation = Reservation::create([
            'user_id'          => $owner->id,
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => now()->addDay(),
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'confirmed',
        ]);

        $this->actingAs($other)
             ->patchJson("/api/reservations/{$reservation->id}/cancel")
             ->assertStatus(403);
    }

    public function test_admin_can_cancel_any_reservation(): void
    {
        $admin       = User::factory()->admin()->create();
        $client      = User::factory()->client()->create();
        $table       = Table::factory()->create(['seats' => 4, 'is_active' => true]);
        $reservation = Reservation::create([
            'user_id'          => $client->id,
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => now()->addDay(),
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'confirmed',
        ]);

        $this->actingAs($admin)
             ->patchJson("/api/reservations/{$reservation->id}/cancel")
             ->assertStatus(200);
    }

    // ── Mis reservas ───────────────────────────────────────────────────────────

    public function test_client_can_view_own_reservations(): void
    {
        $client = User::factory()->client()->create();
        $table  = Table::factory()->create(['seats' => 4, 'is_active' => true]);

        Reservation::create([
            'user_id'          => $client->id,
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => now()->addDay(),
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'confirmed',
        ]);

        $response = $this->actingAs($client)
                         ->getJson('/api/my/reservations');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_client_cannot_see_other_users_reservations(): void
    {
        $client1 = User::factory()->client()->create();
        $client2 = User::factory()->client()->create();
        $table   = Table::factory()->create(['seats' => 4, 'is_active' => true]);

        Reservation::create([
            'user_id'          => $client1->id,
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => now()->addDay(),
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'confirmed',
        ]);

        $response = $this->actingAs($client2)
                         ->getJson('/api/my/reservations');

        $response->assertStatus(200);
        $this->assertCount(0, $response->json('data'));
    }

    public function test_overdue_active_reservations_are_marked_as_no_show(): void
    {
        $client = User::factory()->client()->create();
        $table  = Table::factory()->create(['seats' => 4, 'is_active' => true]);

        $confirmed = Reservation::create([
            'user_id'          => $client->id,
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => now()->subMinutes(16),
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'confirmed',
        ]);

        $pending = Reservation::create([
            'user_id'          => $client->id,
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => now()->subMinutes(20),
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'pending',
        ]);

        $recent = Reservation::create([
            'user_id'          => $client->id,
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => now()->subMinutes(14),
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'confirmed',
        ]);

        $completed = Reservation::create([
            'user_id'          => $client->id,
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => now()->subMinutes(30),
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'completed',
        ]);

        $this->artisan('reservations:mark-no-shows')->assertSuccessful();

        $this->assertSame('no_show', $confirmed->fresh()->status);
        $this->assertSame('no_show', $pending->fresh()->status);
        $this->assertSame('confirmed', $recent->fresh()->status);
        $this->assertSame('completed', $completed->fresh()->status);
    }
}
