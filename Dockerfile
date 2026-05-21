FROM node:20-alpine AS frontend_builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build


FROM php:8.3-cli-alpine AS backend_builder

RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    unzip \
    curl \
    && docker-php-ext-install pdo pdo_pgsql zip opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

COPY backend/ ./
RUN composer dump-autoload --optimize \
    && mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache


FROM php:8.3-cli-alpine

RUN apk add --no-cache \
    nginx \
    gettext \
    postgresql-dev \
    libzip-dev \
    curl \
    && docker-php-ext-install pdo pdo_pgsql zip opcache

WORKDIR /var/www/html

COPY --from=backend_builder /var/www/html ./
COPY --from=frontend_builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/start.sh /usr/local/bin/start.sh

RUN chmod +x /usr/local/bin/start.sh \
    && mkdir -p /run/nginx storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

ENV PORT=80
ENV APP_ENV=production
ENV APP_DEBUG=false

EXPOSE 80

CMD ["/usr/local/bin/start.sh"]
