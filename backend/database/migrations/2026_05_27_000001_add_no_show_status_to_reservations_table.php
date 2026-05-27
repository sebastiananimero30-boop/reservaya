<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();
        $allowed = "'pending', 'confirmed', 'cancelled', 'completed', 'no_show'";

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check');
            DB::statement("ALTER TABLE reservations ALTER COLUMN status TYPE VARCHAR(255)");
            DB::statement("ALTER TABLE reservations ADD CONSTRAINT reservations_status_check CHECK (status IN ({$allowed}))");
            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE reservations MODIFY status ENUM({$allowed}) NOT NULL DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        $allowed = "'pending', 'confirmed', 'cancelled', 'completed'";

        DB::table('reservations')
            ->where('status', 'no_show')
            ->update(['status' => 'cancelled']);

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check');
            DB::statement("ALTER TABLE reservations ADD CONSTRAINT reservations_status_check CHECK (status IN ({$allowed}))");
            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE reservations MODIFY status ENUM({$allowed}) NOT NULL DEFAULT 'pending'");
        }
    }
};
