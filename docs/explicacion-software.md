# Explicación detallada del software ReservaYa

Este documento describe punto por punto los componentes y la arquitectura del proyecto ReservaYa, una plataforma de reservas de restaurantes basada en React + Vite para el frontend y Laravel 11 para el backend.

---

## 1. Vista general del proyecto

ReservaYa es una aplicación tipo OpenTable que permite a clientes buscar restaurantes, ver disponibilidad, crear reservas y consultar su historial. El sistema consta de:

- `frontend/`: aplicación web en React que consume una API REST.
- `backend/`: API REST en Laravel 11 que gestiona usuarios, restaurantes, mesas, reservas y autenticación.
- `docker-compose.yml` y `docker-compose.prod.yml`: definiciones para ejecutar el proyecto en desarrollo y producción con contenedores.
- `start.bat` / `start.sh`: scripts de inicio rápido para Windows y Linux/Mac.

---

## 2. Estructura y responsabilidad de cada carpeta

### 2.1 `frontend/`

Esta carpeta contiene la aplicación cliente construida con React 18 y Vite.

- `package.json`: dependencias y scripts del frontend.
- `vite.config.js`: configuración de Vite para el desarrollo y build.
- `tailwind.config.js`: configuración de Tailwind CSS.
- `postcss.config.js`: configuración de PostCSS.
- `src/`: código fuente principal.
- `public/`: archivos estáticos expuestos directamente.

Dentro de `src/`:

- `App.jsx`: componente raíz que define rutas y layout general.
- `main.jsx`: punto de entrada que monta React en el DOM.
- `index.css`: estilos globales y base de Tailwind.
- `api/`: cliente HTTP y adaptadores.
  - `axios.js`: instancia de Axios con interceptor de autorización Bearer.
  - `adapters.js`: funciones que transforman datos del backend para el frontend.
  - `restaurants.js`, `reservations.js`: llamadas específicas a endpoints.
- `context/`: estado compartido de la aplicación.
  - `AuthContext.jsx`: contexto de autenticación JWT/Sanctum.
- `hooks/`: hooks personalizados.
  - `useRestaurants.js`: hook que usa React Query para obtener datos, con modo mock opcional.
- `components/`: componentes reutilizables.
  - `common/`: elementos UI genéricos como Navbar, Modal, Spinner.
  - `restaurants/`: tarjetas de restaurantes, filtros y listados.
  - `reservations/`: formulario de reserva, selector de fecha/hora.
  - `chatbot/`: componente de chatbot y mensajes.
- `pages/`: páginas principales de la app.
  - `Home.jsx`: listado de restaurantes y filtros.
  - `Login.jsx`: formulario de inicio de sesión.
  - `Register.jsx`: formulario de registro de usuario.
  - `RestaurantDetail.jsx`: detalle del restaurante, mesas y reserva.
  - `MyReservations.jsx`: historial y estado de reservas.

---

### 2.2 `backend/`

Carpeta del API REST hecho en Laravel 11. Gestiona la lógica de negocio, base de datos y autenticación.

- `composer.json`: dependencias de PHP y Laravel.
- `artisan`: CLI de Laravel.
- `phpunit.xml`: configuración de pruebas.
- `Dockerfile` / `Dockerfile.prod`: imágenes para contenedores de desarrollo y producción.
- `bootstrap/`: arranque de Laravel y caché de servicios.
- `config/`: configuración de Laravel, incluyendo CORS y servicios.
- `database/`: migraciones, factories y seeders.
- `public/`: punto de entrada HTTP de Laravel.
- `resources/views/`: vistas si se llegara a usar Blade.
- `routes/`: rutas de la aplicación.
  - `api.php`: rutas de la API REST.
  - `web.php` / `console.php`: rutas web y consola, aunque la API es la pieza principal aquí.
- `app/`: lógica principal.
  - `Models/`: modelos Eloquent.
    - `User.php`, `Restaurant.php`, `Reservation.php`, `Table.php`, `Category.php`, `Review.php`, `Schedule.php`, `RestaurantPhoto.php`.
  - `Http/Controllers/`: controladores que reciben solicitudes API.
  - `Http/Resources/`: transformadores JSON para respuesta consistente.
  - `Http/Middleware/`: validaciones y seguridad.
  - `Mail/`: correos transaccionales.
  - `Helpers/ReservationHelper.php`: lógica auxiliar para reservas.
  - `Services/StripeCheckoutService.php`: integración Stripe para pagos.

---

### 2.3 `docker-compose.yml` y `docker-compose.prod.yml`

- `docker-compose.yml`: orquesta servicios de desarrollo.
  - `backend`: contenedor Laravel.
  - `frontend`: contenedor React.
  - `db`: base de datos PostgreSQL.
- `docker-compose.prod.yml`: orquesta servicios optimizados para producción.

---

### 2.4 `postman/`

Contiene la colección `Reservaya.postman_collection.json` para probar la API de forma automática.

---

## 3. Flujo de uso del software

### 3.1 Cliente web

1. El usuario carga la app React.
2. React obtiene datos desde la API usando Axios y React Query.
3. El cliente puede:
   - ver restaurantes disponibles.
   - filtrar por categoría, zona, fecha, hora y número de personas.
   - abrir el detalle de un restaurante.
   - crear una reserva.
   - iniciar sesión / registrarse.
   - ver sus reservas.

### 3.2 Backend API

1. El frontend envía solicitudes HTTP a `http://localhost:8000/api/...`.
2. Laravel autentica con Sanctum y gestiona roles.
3. La API devuelve datos JSON estructurados con Resources.
4. El backend verifica disponibilidad de mesas y previene solapamientos en reservas.
5. En el caso de pago, se usa Stripe vía `StripeCheckoutService`.

---

## 4. Componentes clave y su función

### 4.1 Autenticación

- `AuthController.php`: registra, autentica, cierra sesión y devuelve usuario actual.
- `AuthContext.jsx`: mantiene sesión en React y agrega token Authorization.
- `personal_access_tokens`: tabla de tokens de Sanctum.

### 4.2 Restaurantes y categorías

- `RestaurantController.php`: lista restaurantes con filtros, muestra detalles y mesas.
- `CategoryController.php`: devuelve categorías disponibles.
- `RestaurantResource.php`: transforma datos del restaurante para el frontend.
- `restaurants.js` y `adapters.js`: adaptan datos de la API al formato UI.

### 4.3 Reservas

- `ReservationController.php`: crea, muestra y cancela reservas.
- `ReservationHelper.php`: auxilia en lógica de disponibilidad y tiempos.
- `ReservationResource.php`: formatea la reserva a JSON.
- `reservations.js`: crea reservas y obtiene historial.
- `MyReservations.jsx`: muestra las reservas del usuario.

### 4.4 Mesas y disponibilidad

- `Table` y `Restaurant` almacenan datos de capacidad y mesas.
- El backend consulta tablas disponibles para la fecha y hora solicitadas.
- El frontend presenta esta disponibilidad en la página de detalle.

### 4.5 Base de datos y datos semilla

- `migrations/`: define tablas y columnas.
- `seeders/`: llena datos iniciales como restaurantes, categorías, usuarios y mesas.
- `factories/`: permiten generar datos de prueba masivos.

---

## 5. Variables de entorno importantes

### Frontend

- `VITE_API_URL`: URL base del backend API. Por ejemplo `http://localhost:8000/api`.

### Backend

- `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`: configuración de base de datos.
- `APP_KEY`: clave de Laravel.
- `CORS_ALLOWED_ORIGINS` o configuración en `config/cors.php`: orígenes permitidos.
- `SANCTUM_STATEFUL_DOMAINS`: dominios para tokens de Sanctum.

---

## 6. Descripción de la experiencia del usuario

- Un cliente ingresa a la página principal y ve un directorio de restaurantes.
- Puede filtrar resultados por categoría, zona, fecha, hora y cantidad de comensales.
- Al seleccionar un restaurante, ve fotos, menú, calificación y mesas disponibles.
- Completa un formulario de reserva y confirma su reserva.
- Puede acceder a su perfil y ver todas sus reservas.
- El sistema envía notificaciones y puede manejar cancelaciones.

---

## 7. Resumen final detallado

ReservaYa es una plataforma web de reservas de restaurantes que combina:

- un frontend moderno en React + Vite con diseño responsivo, rutas y estados de usuario,
- un backend robusto en Laravel 11 que expone una API REST segura, maneja la lógica de reservas y protege la información con roles,
- una base de datos relacional con PostgreSQL en producción (o SQLite en desarrollo),
- una arquitectura preparada para Docker y despliegue en entornos de desarrollo y producción.

El proyecto está organizado para separar claramente:

1. la presentación visual y la interacción del cliente (`frontend/`),
2. la lógica de negocio y la persistencia de datos (`backend/`),
3. el soporte de infraestructura y contenedores (`docker-compose.yml`, `Dockerfile`, `Dockerfile.prod`).

Todo está pensado para ofrecer una experiencia completa: búsqueda y filtrado de restaurantes, gestión de reservas, autenticación de usuarios y un flujo de trabajo sencillo para arrancar el proyecto tanto en local como en contenedores. La documentación generada aquí explica cada pieza, cómo encajan y cuál es el papel de cada módulo.
