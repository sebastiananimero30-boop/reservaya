<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->string('payment_intent_id')->nullable()->after('qr_code');
            $table->unsignedInteger('deposit_amount')->nullable()->after('payment_intent_id');
            $table->boolean('deposit_refunded')->default(false)->after('deposit_amount');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn(['payment_intent_id', 'deposit_amount', 'deposit_refunded']);
        });
    }
};
