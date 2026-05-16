<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->string('payment_provider')->nullable()->after('qr_code');
            $table->string('payment_status')->default('unpaid')->after('payment_provider');
            $table->unsignedInteger('payment_amount')->nullable()->after('payment_status');
            $table->string('payment_currency', 3)->default('usd')->after('payment_amount');
            $table->string('stripe_checkout_session_id')->nullable()->index()->after('payment_currency');
            $table->string('stripe_payment_intent_id')->nullable()->index()->after('stripe_checkout_session_id');
            $table->timestamp('payment_paid_at')->nullable()->after('stripe_payment_intent_id');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['stripe_checkout_session_id']);
            $table->dropIndex(['stripe_payment_intent_id']);
            $table->dropColumn([
                'payment_provider',
                'payment_status',
                'payment_amount',
                'payment_currency',
                'stripe_checkout_session_id',
                'stripe_payment_intent_id',
                'payment_paid_at',
            ]);
        });
    }
};
