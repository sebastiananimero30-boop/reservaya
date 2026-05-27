#!/bin/sh
set -e

: "${PORT:=80}"

if [ -n "${RENDER_EXTERNAL_URL:-}" ]; then
  export APP_URL="${APP_URL:-$RENDER_EXTERNAL_URL}"
  export FRONTEND_URL="${FRONTEND_URL:-$RENDER_EXTERNAL_URL}"
  export CORS_ALLOWED_ORIGINS="${CORS_ALLOWED_ORIGINS:-$RENDER_EXTERNAL_URL}"
  if [ -z "${STRIPE_SUCCESS_URL:-}" ]; then
    export STRIPE_SUCCESS_URL="$RENDER_EXTERNAL_URL/mis-reservas?stripe=success&session_id={CHECKOUT_SESSION_ID}"
  fi
  if [ -z "${STRIPE_CANCEL_URL:-}" ]; then
    export STRIPE_CANCEL_URL="$RENDER_EXTERNAL_URL/mis-reservas?stripe=cancelled"
  fi
fi

envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/http.d/default.conf

mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache

php artisan config:clear
php artisan route:clear
php artisan view:clear

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force && php artisan db:seed --force
fi

php artisan schedule:work > storage/logs/schedule.log 2>&1 &
php artisan serve --host=127.0.0.1 --port=8000 &

exec nginx -g "daemon off;"
