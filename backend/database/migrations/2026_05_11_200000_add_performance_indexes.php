<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Índices en reservations — las consultas más frecuentes del sistema
        Schema::table('reservations', function (Blueprint $table) {
            $table->index('user_id',       'idx_reservations_user');
            $table->index('restaurant_id', 'idx_reservations_restaurant');
            $table->index('table_id',      'idx_reservations_table');
            $table->index('status',        'idx_reservations_status');
            $table->index('start_time',    'idx_reservations_start_time');
            // Índice compuesto para la query de anti-solapamiento
            $table->index(['table_id', 'status', 'start_time'], 'idx_reservations_overlap');
        });

        // Índices en restaurants
        Schema::table('restaurants', function (Blueprint $table) {
            $table->index('owner_id',    'idx_restaurants_owner');
            $table->index('category_id', 'idx_restaurants_category');
            $table->index('is_active',   'idx_restaurants_active');
            $table->index('rating',      'idx_restaurants_rating');
        });

        // Índices en tables
        Schema::table('tables', function (Blueprint $table) {
            $table->index(['restaurant_id', 'is_active'], 'idx_tables_restaurant_active');
        });

        // Índices en reviews
        Schema::table('reviews', function (Blueprint $table) {
            $table->index('restaurant_id', 'idx_reviews_restaurant');
        });

        // Índices en menu_items
        Schema::table('menu_items', function (Blueprint $table) {
            $table->index(['restaurant_id', 'is_available'], 'idx_menu_items_restaurant_available');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex('idx_reservations_user');
            $table->dropIndex('idx_reservations_restaurant');
            $table->dropIndex('idx_reservations_table');
            $table->dropIndex('idx_reservations_status');
            $table->dropIndex('idx_reservations_start_time');
            $table->dropIndex('idx_reservations_overlap');
        });

        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropIndex('idx_restaurants_owner');
            $table->dropIndex('idx_restaurants_category');
            $table->dropIndex('idx_restaurants_active');
            $table->dropIndex('idx_restaurants_rating');
        });

        Schema::table('tables', function (Blueprint $table) {
            $table->dropIndex('idx_tables_restaurant_active');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex('idx_reviews_restaurant');
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropIndex('idx_menu_items_restaurant_available');
        });
    }
};
