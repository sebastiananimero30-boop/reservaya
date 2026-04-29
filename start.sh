#!/usr/bin/env bash
set -e

echo ""
echo " ================================"
echo "  🚀 ReservaYa — Starting..."
echo " ================================"
echo ""

# Check Docker
if ! docker info > /dev/null 2>&1; then
  echo "[ERROR] Docker no está corriendo. Inicia Docker primero."
  exit 1
fi

echo "[1/3] Levantando base de datos PostgreSQL..."
docker-compose up -d db

echo "      Esperando que la DB esté lista..."
until docker-compose exec -T db pg_isready -U reservaya > /dev/null 2>&1; do
  sleep 1
done

echo "[2/3] Levantando backend Laravel..."
docker-compose up -d backend

echo "[3/3] Levantando frontend React/Vite..."
docker-compose up -d frontend

echo ""
echo " ================================"
echo "  ✅ ReservaYa está corriendo!"
echo " ================================"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000/api/health"
echo "  DB:        localhost:5432"
echo ""
echo "  Credenciales de prueba:"
echo "   client@test.app     / client123"
echo "   owner@pizzeria.com  / owner123"
echo "   admin@reservaya.app / admin123"
echo ""

# Open browser
if command -v xdg-open > /dev/null; then
  xdg-open http://localhost:3000
elif command -v open > /dev/null; then
  open http://localhost:3000
fi

echo "Siguiendo logs... (Ctrl+C para salir)"
docker-compose logs -f frontend backend
