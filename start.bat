@echo off
title ReservaYa — Iniciando...
echo.
echo  ================================
echo   🚀 ReservaYa — Starting...
echo  ================================
echo.

:: Check Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta corriendo. Abre Docker Desktop primero.
    pause
    exit /b 1
)

echo [1/3] Levantando base de datos PostgreSQL...
docker-compose up -d db
timeout /t 5 /nobreak >nul

echo [2/3] Levantando backend Laravel...
docker-compose up -d backend

echo [3/3] Levantando frontend React/Vite...
docker-compose up -d frontend

echo.
echo  ================================
echo   ✅ ReservaYa esta corriendo!
echo  ================================
echo.
echo  Frontend:  http://localhost:3000
echo  Backend:   http://localhost:8000/api/health
echo  DB:        localhost:5432
echo.
echo  Credenciales de prueba:
echo   client@test.app    / client123
echo   owner@pizzeria.com / owner123
echo   admin@reservaya.app / admin123
echo.
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo Presiona cualquier tecla para ver los logs...
pause >nul
docker-compose logs -f frontend backend
