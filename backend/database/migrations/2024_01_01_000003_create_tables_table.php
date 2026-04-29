<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100)->comment('Ej: Mesa 1, VIP, Terraza');
            $table->unsignedTinyInteger('seats')->comment('Capacidad: 2, 4, 6, 8');
            $table->decimal('price', 8, 2)->default(0)->comment('Precio mínimo de consumo');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tables');
    }
};
