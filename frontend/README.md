# ReservaYa — Frontend

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Abre: http://localhost:5173

## Stack

- React 18 + Vite
- Tailwind CSS (dark mode, custom tokens)
- React Router v6 (lazy loading)
- TanStack Query v5 (caché + fetching)
- Framer Motion (animaciones)
- React Hook Form (formularios)
- Lucide React (iconos)
- React Hot Toast (notificaciones)
- Axios (HTTP client)

## Modo Mock

Por defecto `USE_MOCK = true` en `src/hooks/useRestaurants.js`.
Cambia a `false` cuando tu backend Laravel esté corriendo.

## Páginas

| Ruta | Página |
|------|--------|
| `/` | Home — directorio + filtros |
| `/restaurantes/:id` | Detalle + reserva |
| `/login` | Login |
| `/registro` | Registro |
| `/mis-reservas` | Historial de reservas |

## Variables de entorno

```
VITE_API_URL=http://localhost:8000/api
```
