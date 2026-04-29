<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fotos de restaurantes
        Schema::create('restaurant_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('url');
            $table->boolean('is_cover')->default(false);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Reseñas
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating')->comment('1 a 5');
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['restaurant_id', 'user_id'], 'unique_restaurant_user_review');
        });

        // Horarios del restaurante
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week')->comment('0=Domingo, 1=Lunes, ... 6=Sábado');
            $table->time('open_time');
            $table->time('close_time');
            $table->boolean('is_closed')->default(false);
            $table->timestamps();

            $table->unique(['restaurant_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('restaurant_photos');
    }
};
