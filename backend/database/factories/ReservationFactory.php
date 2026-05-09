<?php

namespace Database\Factories;

use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReservationFactory extends Factory
{
    protected $model = Reservation::class;

    public function definition(): array
    {
        $table = Table::factory()->create();
        return [
            'user_id'          => User::factory()->client(),
            'restaurant_id'    => $table->restaurant_id,
            'table_id'         => $table->id,
            'start_time'       => now()->addDays(1)->setHour(19)->setMinute(0),
            'duration_minutes' => 90,
            'guests'           => 2,
            'status'           => 'confirmed',
            'notes'            => null,
        ];
    }

    public function cancelled(): static
    {
        return $this->state(['status' => 'cancelled']);
    }

    public function pending(): static
    {
        return $this->state(['status' => 'pending']);
    }
}
