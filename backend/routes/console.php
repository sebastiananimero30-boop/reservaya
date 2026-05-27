<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Reservation;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Artisan::command('reservations:mark-no-shows', function () {
    $cutoff = now()->subMinutes(15);

    $updated = Reservation::query()
        ->whereIn('status', ['pending', 'confirmed'])
        ->where('start_time', '<=', $cutoff)
        ->update(['status' => 'no_show']);

    $this->info("Reservas marcadas como no_show: {$updated}");
})->purpose('Mark reservations as no-show 15 minutes after their start time');

Schedule::command('reservations:mark-no-shows')->everyMinute();
