<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('table_id')->constrained()->cascadeOnDelete();
            $table->dateTime('start_time');
            $table->unsignedSmallInteger('duration_minutes')->default(90);
            $table->unsignedTinyInteger('guests');
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'completed'])->default('pending');
            $table->text('notes')->nullable();
            $table->string('qr_code')->nullable();
            $table->timestamps();

            // Anti-solapamiento: una mesa no puede tener dos reservas exactamente iguales
            $table->unique(['table_id', 'start_time'], 'unique_table_time');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
