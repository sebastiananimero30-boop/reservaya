FROM php:8.3-cli-alpine

RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    unzip \
    curl \
    && docker-php-ext-install pdo pdo_pgsql zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN mkdir -p storage/framework/sessions \
        storage/framework/views \
        storage/framework/cache \
        storage/logs \
        bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && touch database/database.sqlite

EXPOSE 8000
