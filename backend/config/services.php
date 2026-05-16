<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel'              => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Google OAuth — configura las credenciales en el .env
    'google' => [
        'client_id'     => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect'      => env('GOOGLE_REDIRECT_URI', 'http://localhost:5173/auth/google/callback'),
    ],

    // Stripe — pasarela de pagos
    'stripe' => [
        'key'                => env('STRIPE_KEY'),
        'secret'             => env('STRIPE_SECRET'),
        'webhook_secret'     => env('STRIPE_WEBHOOK_SECRET'),
        'reservation_amount' => (int) env('STRIPE_RESERVATION_AMOUNT', 500),
        'currency'           => env('STRIPE_CURRENCY', 'usd'),
        'success_url'        => env('STRIPE_SUCCESS_URL', 'http://localhost:5173/mis-reservas?stripe=success&session_id={CHECKOUT_SESSION_ID}'),
        'cancel_url'         => env('STRIPE_CANCEL_URL', 'http://localhost:5173/mis-reservas?stripe=cancelled'),
    ],

];
