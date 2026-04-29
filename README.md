# 🍽️ ReservaYa — Plataforma de Reservas de Restaurantes

Clon funcional de OpenTable construido con **React 18 + Vite** (frontend) y **Laravel 11 + PostgreSQL** (backend).

---

## ⚡ Inicio Rápido (1 comando)

### Windows
```bat
start.bat
```

### Linux / Mac
```bash
chmod +x start.sh && ./start.sh
```

Después de ~2 minutos:
- 🌐 **Frontend:** http://localhost:3000
- 🔌 **API:** http://localhost:8000/api/health
- 🗄️ **DB:** `localhost:5432`

---

## 🔑 Credenciales de Prueba

| Rol    | Email                    | Password   | Acceso                  |
|--------|--------------------------|------------|-------------------------|
| Client | `client@test.app`        | `client123`| Reservar mesas          |
| Owner  | `owner@pizzeria.com`     | `owner123` | Dashboard de propietario|
| Admin  | `admin@reservaya.app`    | `admin123` | Panel de administración |

---

## 🐳 Docker (manual)

```bash
# Desarrollo
docker-compose up -d

# Ver logs
docker-compose logs -f backend frontend

# Detener
docker-compose down

# Reset completo (borra DB)
docker-compose down -v
```

### Producción
```bash
# Requiere .env.prod con variables de entorno reales
docker-compose -f docker-compose.prod.yml up -d
```

---

## 💻 Sin Docker (desarrollo local)

### Backend
```bash
cd backend

# 1. Copiar y configurar .env
cp .env .env.local
# Edita DB_CONNECTION=sqlite para prueba sin PostgreSQL

# 2. Instalar dependencias
composer install

# 3. Setup
php artisan key:generate
php artisan migrate
php artisan db:seed

# 4. Servir
php artisan serve
# → http://localhost:8000
```

### Frontend
```bash
cd frontend

# 1. Instalar
npm install

# 2. Desarrollo
npm run dev
# → http://localhost:5173

# 3. Build producción
npm run build && npm run preview
```

---

## 🗂️ Estructura del Proyecto

```
reservaya/
├── docker-compose.yml          # Dev: postgres + backend + frontend
├── docker-compose.prod.yml     # Producción
├── start.bat                   # 1-click Windows
├── start.sh                    # 1-click Linux/Mac
│
├── frontend/                   # React 18 + Vite + Tailwind
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js        # Axios + Bearer token interceptor
│   │   │   ├── adapters.js     # Normaliza campos EN→ES del API
│   │   │   ├── restaurants.js  # GET /restaurants, /restaurants/:id
│   │   │   └── reservations.js # POST/GET/PATCH reservations
│   │   ├── hooks/
│   │   │   └── useRestaurants.js  # React Query hooks (API real)
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # JWT auth via Sanctum
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── RestaurantDetail.jsx
│   │   │   └── MyReservations.jsx
│   │   └── components/
│   │       ├── common/        # Navbar, Modal, Spinner
│   │       ├── restaurants/   # RestaurantCard, Filters, Grid
│   │       ├── reservations/  # ReservationForm, DateTimePicker
│   │       └── chatbot/       # ChatBot, ChatMessage
│   └── Dockerfile.prod
│
├── backend/                    # Laravel 11 API
│   ├── app/
│   │   ├── Models/             # Restaurant, Table, Reservation, User...
│   │   ├── Http/Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── RestaurantController.php
│   │   │   ├── ReservationController.php
│   │   │   └── CategoryController.php
│   │   └── Http/Resources/     # JSON Resources
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/DatabaseSeeder.php  # 25 restaurantes + 50 mesas
│   ├── routes/api.php
│   ├── config/cors.php
│   ├── Dockerfile
│   └── Dockerfile.prod
│
└── postman/
    └── Reservaya.postman_collection.json
```

---

## 🔌 API Endpoints

| Método | Ruta                                | Auth | Descripción               |
|--------|-------------------------------------|------|---------------------------|
| POST   | `/api/auth/register`                | No   | Registro                  |
| POST   | `/api/auth/login`                   | No   | Login → token             |
| GET    | `/api/auth/me`                      | ✅   | Perfil autenticado        |
| POST   | `/api/auth/logout`                  | ✅   | Cerrar sesión             |
| GET    | `/api/restaurants`                  | No   | Listar (filtros: category, zone, date, time, guests) |
| GET    | `/api/restaurants/:id`              | No   | Detalle + mesas           |
| GET    | `/api/restaurants/:id/tables`       | No   | Mesas disponibles         |
| GET    | `/api/categories`                   | No   | Categorías                |
| POST   | `/api/reservations`                 | ✅   | Crear reserva             |
| GET    | `/api/my/reservations`              | ✅   | Mis reservas              |
| GET    | `/api/reservations/:id`             | ✅   | Ver reserva               |
| PATCH  | `/api/reservations/:id/cancel`      | ✅   | Cancelar                  |
| GET    | `/api/health`                       | No   | Health check              |

---

## 🧪 Postman

Importa `postman/Reservaya.postman_collection.json` en Postman.

El request **Login** guarda automáticamente el token en `{{token}}` para los demás endpoints protegidos.

---

## 🚀 Deploy

### Railway (recomendado — gratis)

1. Crea proyecto en [railway.app](https://railway.app)
2. **Backend:**
   - Nuevo servicio → GitHub → carpeta `backend/`
   - Agrega PostgreSQL plugin
   - Variables: `APP_KEY`, `DB_*`, `CORS_ALLOWED_ORIGINS`, `SANCTUM_STATEFUL_DOMAINS`
   - Start command: `php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=$PORT`
3. **Frontend:**
   - Nuevo servicio → GitHub → carpeta `frontend/`
   - Variable: `VITE_API_URL=https://tu-backend.railway.app/api`
   - Build: `npm run build` | Publish: `dist/`

### Vercel (solo frontend)

```bash
cd frontend
npx vercel --prod
# VITE_API_URL=https://tu-backend.com/api
```

---

## 🛠️ Stack Técnico

**Frontend:** React 18, Vite, Tailwind CSS, React Query, React Router, Axios, Framer Motion, react-hot-toast, React Hook Form, Lucide React

**Backend:** Laravel 11, Laravel Sanctum (JWT), Eloquent ORM, PostgreSQL 16

**DevOps:** Docker, Docker Compose, Nginx (prod)
