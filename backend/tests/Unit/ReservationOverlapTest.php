<?php

namespace Tests\Unit;

use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests unitarios para la lógica de anti-solapamiento de reservas.
 * Verifica que la ventana de 90 minutos funcione correctamente en todos los casos borde.
 */
class ReservationOverlapTest extends TestCase
{
    use RefreshDatabase;

    private Table $table;
    private User $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = User::factory()->client()->create();
        $this->table  = Table::factory()->create(['seats' => 4, 'is_active' => true]);
    }

    private function createReservation(Carbon $startTime, string $status = 'confirmed'): Reservation
    {
        return Reservation::create([
            'user_id'          => $this->client->id,
            'restaurant_id'    => $this->table->restaurant_id,
            'table_id'         => $this->table->id,
            'start_time'       => $startTime,
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => $status,
        ]);
    }

    private function hasConflict(Carbon $newStart): bool
    {
        $end = $newStart->copy()->addMinutes(90);
        $driver = \DB::connection()->getDriverName();
        $overlapEndExpr = $driver === 'pgsql'
            ? "start_time + (duration_minutes * interval '1 minute') > ?"
            : "datetime(start_time, '+' || duration_minutes || ' minutes') > ?";

        return Reservation::where('table_id', $this->table->id)
            ->whereNotIn('status', ['cancelled'])
            ->where(function ($q) use ($newStart, $end, $overlapEndExpr) {
                $q->where('start_time', '<', $end)
                  ->whereRaw($overlapEndExpr, [$newStart]);
            })
            ->exists();
    }

    public function test_no_conflict_when_no_reservations(): void
    {
        $this->assertFalse($this->hasConflict(now()->addDay()->setHour(19)));
    }

    public function test_conflict_at_same_time(): void
    {
        $start = now()->addDay()->setHour(19)->setMinute(0);
        $this->createReservation($start);

        $this->assertTrue($this->hasConflict($start));
    }

    public function test_conflict_30_minutes_after(): void
    {
        $start = now()->addDay()->setHour(19)->setMinute(0);
        $this->createReservation($start);

        $this->assertTrue($this->hasConflict($start->copy()->addMinutes(30)));
    }

    public function test_conflict_30_minutes_before(): void
    {
        $start = now()->addDay()->setHour(19)->setMinute(0);
        $this->createReservation($start);

        $this->assertTrue($this->hasConflict($start->copy()->subMinutes(30)));
    }

    public function test_no_conflict_exactly_90_minutes_after(): void
    {
        $start = now()->addDay()->setHour(19)->setMinute(0);
        $this->createReservation($start);

        $this->assertFalse($this->hasConflict($start->copy()->addMinutes(90)));
    }

    public function test_no_conflict_2_hours_after(): void
    {
        $start = now()->addDay()->setHour(19)->setMinute(0);
        $this->createReservation($start);

        $this->assertFalse($this->hasConflict($start->copy()->addHours(2)));
    }

    public function test_no_conflict_when_existing_reservation_is_cancelled(): void
    {
        $start = now()->addDay()->setHour(19)->setMinute(0);
        $this->createReservation($start, 'cancelled');

        $this->assertFalse($this->hasConflict($start));
    }

    public function test_conflict_89_minutes_after(): void
    {
        $start = now()->addDay()->setHour(19)->setMinute(0);
        $this->createReservation($start);

        // 89 minutos después todavía está dentro de la ventana
        $this->assertTrue($this->hasConflict($start->copy()->addMinutes(89)));
    }
}
