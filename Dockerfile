FROM node:20-alpine AS frontend_builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

ARG VITE_API_URL=/api
ARG VITE_GOOGLE_CLIENT_ID=""
ARG VITE_STRIPE_KEY=""
ARG VITE_CLOUDINARY_CLOUD_NAME=""
ARG VITE_CLOUDINARY_UPLOAD_PRESET=""
ARG VITE_MAPS_KEY=""
ARG VITE_GROQ_KEY=""

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_STRIPE_KEY=${VITE_STRIPE_KEY}
ENV VITE_CLOUDINARY_CLOUD_NAME=${VITE_CLOUDINARY_CLOUD_NAME}
ENV VITE_CLOUDINARY_UPLOAD_PRESET=${VITE_CLOUDINARY_UPLOAD_PRESET}
ENV VITE_MAPS_KEY=${VITE_MAPS_KEY}
ENV VITE_GROQ_KEY=${VITE_GROQ_KEY}

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
