# 🍽️ ReservaYa — Backend Laravel 11 API

Backend REST API completo para el sistema de reservas de restaurantes **ReservaYa**, construido con **Laravel 11 + Sanctum**.

---

## 🚀 Instalación rápida (3 comandos)

```bash
# 1. Instalar dependencias
composer install

# 2. Configurar entorno
cp .env.example .env
php artisan key:generate

# 3. Migrar y poblar la base de datos
php artisan migrate --seed

# 4. Levantar el servidor
php artisan serve
```

✅ La API estará disponible en: **http://localhost:8000/api**

---

## ⚙️ Configuración del entorno

El proyecto usa **SQLite por defecto** (sin configuración extra).

Para usar **MySQL**, edita el `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=reservaya
DB_USERNAME=root
DB_PASSWORD=tu_password
```

Luego crea la base de datos:
```bash
mysql -u root -p -e "CREATE DATABASE reservaya CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php artisan migrate --seed
```

---

## 📡 Endpoints de la API

### 🔐 Autenticación

| Método | Endpoint             | Auth | Descripción              |
|--------|----------------------|------|--------------------------|
| POST   | `/api/auth/register` | No   | Registrar nuevo usuario  |
| POST   | `/api/auth/login`    | No   | Iniciar sesión → token   |
| POST   | `/api/auth/logout`   | ✅   | Cerrar sesión            |
| GET    | `/api/auth/me`       | ✅   | Perfil del usuario       |

### 🍽️ Restaurantes

| Método | Endpoint                            | Auth | Descripción                          |
|--------|-------------------------------------|------|--------------------------------------|
| GET    | `/api/restaurants`                  | No   | Listar con filtros                   |
| GET    | `/api/restaurants/{id}`             | No   | Detalle + mesas disponibles          |
| GET    | `/api/restaurants/{id}/tables`      | No   | Solo mesas disponibles               |
| GET    | `/api/categories`                   | No   | Listar categorías                    |

**Parámetros de filtro para `/api/restaurants`:**
```
?category=italiana    # slug de categoría
?zone=Miraflores      # zona/dirección
?date=2025-02-20      # fecha (YYYY-MM-DD)
?time=20:00           # hora (HH:MM)
?guests=4             # número de personas
?per_page=12          # paginación
```

### 📅 Reservas

| Método | Endpoint                            | Auth | Descripción              |
|--------|-------------------------------------|------|--------------------------|
| POST   | `/api/reservations`                 | ✅   | Crear reserva            |
| GET    | `/api/reservations/{id}`            | ✅   | Ver detalle              |
| PATCH  | `/api/reservations/{id}/cancel`     | ✅   | Cancelar reserva         |
| GET    | `/api/my/reservations`              | ✅   | Mis reservas             |

---

## 🗄️ Base de Datos

```
users              → id, name, email, password, role, phone
categories         → id, name, slug, icon
restaurants        → id, category_id, owner_id, name, description, address, zone, lat, lng, rating, capacity
tables             → id, restaurant_id, name, seats, price, is_active
reservations       → id, user_id, restaurant_id, table_id, start_time, duration_minutes, guests, status, notes, qr_code
restaurant_photos  → id, restaurant_id, url, is_cover, sort_order
reviews            → id, restaurant_id, user_id, rating, comment
schedules          → id, restaurant_id, day_of_week, open_time, close_time
personal_access_tokens (Sanctum)
```

---

## 🔑 Credenciales de prueba (tras el seed)

| Rol     | Email                      | Password   |
|---------|----------------------------|------------|
| Admin   | admin@reservaya.com        | password   |
| Owner   | owner1@reservaya.com       | password   |
| Owner   | owner2@reservaya.com       | password   |
| Cliente | cliente@reservaya.com      | password   |
| Cliente | cliente1@reservaya.com     | password   |

---

## 📬 Postman

Importa el archivo `ReservaYa.postman_collection.json` en Postman.

El token se guarda automáticamente al hacer login mediante un script de test.

---

## 🧠 Lógica de negocio

### Anti-solapamiento de reservas
Una mesa no puede tener dos reservas que se superpongan en el tiempo.
La ventana de exclusión es de **90 minutos** (duración estándar).

```
Reserva existente: [start_exist ─────── start_exist + 90min]
Nueva reserva:          [start_new ─────── start_new + 90min]
                        ↑ Conflicto si los intervalos se cruzan
```

La query SQL implementada:
```sql
WHERE start_time < nueva_fin
  AND datetime(start_time, '+90 minutes') > nueva_inicio
  AND status != 'cancelled'
```

### Roles de usuario
- `admin` → acceso total
- `owner` → gestiona solo sus restaurantes
- `client` → crea y ve sus propias reservas

---

## 🌐 CORS

Configurado en `config/cors.php` para aceptar:
- `http://localhost:3000` (React CRA)
- `http://localhost:5173` (Vite)

---

## 🛠️ Comandos útiles

```bash
# Reiniciar DB desde cero
php artisan migrate:fresh --seed

# Ver rutas registradas
php artisan route:list --path=api

# Tinker (consola interactiva)
php artisan tinker
>>> App\Models\Restaurant::with('category')->first()
>>> App\Models\User::where('email','cliente@reservaya.com')->first()

# Limpiar caché
php artisan cache:clear && php artisan config:clear
```

---

## 📁 Estructura del proyecto

```
app/
├── Http/
│   ├── Controllers/Api/
│   │   ├── AuthController.php
│   │   ├── CategoryController.php
│   │   ├── RestaurantController.php
│   │   └── ReservationController.php
│   └── Resources/
│       ├── UserResource.php
│       ├── RestaurantResource.php
│       ├── TableResource.php
│       └── ReservationResource.php
├── Models/
│   ├── User.php
│   ├── Category.php
│   ├── Restaurant.php
│   ├── Table.php
│   ├── Reservation.php
│   ├── RestaurantPhoto.php
│   ├── Review.php
│   └── Schedule.php
database/
├── migrations/          (7 archivos)
└── seeders/
    └── DatabaseSeeder.php
routes/
├── api.php
└── web.php
config/
└── cors.php
ReservaYa.postman_collection.json
README.md
```

---

## ✅ Compatibilidad con el Frontend React

El backend está diseñado para responder exactamente a las llamadas Axios/React Query del frontend:

```javascript
// axios.js
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Accept': 'application/json' }
});

// Login y guardar token
const { data } = await api.post('/auth/login', { email, password });
api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

// Listar restaurantes con filtros
const { data } = await api.get('/restaurants', {
  params: { category: 'italiana', zone: 'Centro', date: '2025-02-20', time: '20:00' }
});

// Crear reserva
await api.post('/reservations', {
  restaurant_id: 1,
  table_id: 3,
  start_time: '2025-02-20 20:00:00',
  guests: 2,
  notes: 'Mesa junto a la ventana'
});
```

---

*ReservaYa Backend © 2025 — Laravel 11 + Sanctum*
