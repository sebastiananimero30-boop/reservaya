# Anexo 1: Checklist de Validación Post-Restauración
## ReservaYa - Plan de Respaldo y Recuperación

**Fecha de Ejecución:** ________________  
**Responsable:** ________________  
**Respaldo Restaurado:** ________________  
**Hora Inicio:** _______ **Hora Fin:** _______  

---

## ✅ FASE 1: Validación de Conectividad (5 minutos)

### Conexión a Base de Datos
- [ ] Conectarse a BD sin errores de autenticación
- [ ] Verificar que todas las tablas existan
- [ ] Confirmar nombre y versión de BD

**Comando de Prueba:**
```bash
mysql -h <DB_HOST> -u <DB_USER> -p
mysql> SELECT VERSION();
mysql> SHOW TABLES;
```

**Resultado:** _________________________

### Conexión de Aplicación
- [ ] Aplicación puede conectarse a BD restaurada
- [ ] No hay errores en logs de conexión
- [ ] Pool de conexiones funciona correctamente

**Logs a Revisar:**
```bash
tail -f storage/logs/laravel.log
```

**Resultado:** _________________________

---

## ✅ FASE 2: Integridad de Datos - Tablas Principales (10 minutos)

### Tabla: `users`
```sql
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(DISTINCT id) as unique_ids FROM users;
SELECT MIN(created_at), MAX(created_at) FROM users;
```
- [ ] Total de usuarios coincide con esperado: ________
- [ ] No hay registros duplicados
- [ ] Fechas de creación son razonables

**Resultado:** _________________________

### Tabla: `restaurants`
```sql
SELECT COUNT(*) as total_restaurants FROM restaurants;
SELECT COUNT(DISTINCT id) as unique_ids FROM restaurants;
SELECT * FROM restaurants LIMIT 5;
```
- [ ] Total de restaurantes correcto: ________
- [ ] Datos de restaurantes intactos
- [ ] Imágenes y referencias válidas

**Resultado:** _________________________

### Tabla: `reservations`
```sql
SELECT COUNT(*) as total_reservations FROM reservations;
SELECT COUNT(DISTINCT id) as unique_ids FROM reservations;
SELECT * FROM reservations ORDER BY created_at DESC LIMIT 10;
```
- [ ] Total de reservas correcto: ________
- [ ] Últimas 10 reservas visibles
- [ ] Estados de reservas consistentes

**Resultado:** _________________________

### Tabla: `tables`
```sql
SELECT COUNT(*) as total_tables FROM tables;
SELECT * FROM tables LIMIT 5;
```
- [ ] Total de mesas correcto: ________
- [ ] Capacidades registradas correctamente
- [ ] Relaciones con restaurantes intactas

**Resultado:** _________________________

### Tabla: `reviews`
```sql
SELECT COUNT(*) as total_reviews FROM reviews;
SELECT * FROM reviews ORDER BY created_at DESC LIMIT 5;
```
- [ ] Total de reseñas correcto: ________
- [ ] Ratings entre 1 y 5: ________
- [ ] Comentarios íntegros

**Resultado:** _________________________

---

## ✅ FASE 3: Relaciones y Claves Foráneas (5 minutos)

```sql
-- Validar integridad referencial
SELECT COUNT(*) FROM reservations WHERE restaurant_id NOT IN (SELECT id FROM restaurants);
SELECT COUNT(*) FROM reservations WHERE user_id NOT IN (SELECT id FROM users);
SELECT COUNT(*) FROM tables WHERE restaurant_id NOT IN (SELECT id FROM restaurants);
SELECT COUNT(*) FROM reviews WHERE restaurant_id NOT IN (SELECT id FROM restaurants);
```

- [ ] Reservas sin restaurante asociado: **0**
- [ ] Reservas sin usuario asociado: **0**
- [ ] Mesas sin restaurante asociado: **0**
- [ ] Reseñas sin restaurante asociado: **0**

**Resultado:** _________________________

---

## ✅ FASE 4: Validación de Archivos Subidos (10 minutos)

### Directorio de Fotos de Restaurantes
```bash
ls -la storage/uploads/restaurants/photos/ | head -20
du -sh storage/uploads/restaurants/photos/
```

- [ ] Directorio existe y es accesible
- [ ] Archivos de fotos presentes: ________
- [ ] Tamaño total aproximado: ________ MB
- [ ] Permisos correctos (755): ________

**Resultado:** _________________________

### Directorio de Menús
```bash
ls -la storage/uploads/menus/ | head -20
du -sh storage/uploads/menus/
```

- [ ] Directorio existe y es accesible
- [ ] Archivos de menús presentes: ________
- [ ] Tamaño total aproximado: ________ MB

**Resultado:** _________________________

### Verificar Integridad de Imágenes
```bash
# Verificar que las imágenes referenciadas en BD existen
SELECT photo_path FROM restaurant_photos LIMIT 5;
```

- [ ] Las imágenes referenciadas existen en filesystem
- [ ] Rutas en BD coinciden con archivos reales
- [ ] No hay referencias rotas

**Resultado:** _________________________

---

## ✅ FASE 5: Funcionalidad de Aplicación (15 minutos)

### Inicio de Sesión
- [ ] Login de usuario funciona correctamente
- [ ] Tokens de autenticación se generan
- [ ] Cookies de sesión se crean

**Usuario de Prueba:**
- Username: _________________
- Resultado: _________________

### Búsqueda de Restaurantes
- [ ] GET `/api/restaurants` retorna datos
- [ ] Filtros funcionan (capacidad, fecha, hora)
- [ ] Paginación funciona

```bash
curl -s "http://localhost:8000/api/restaurants?capacity=4&date=2026-06-06" | jq .
```

**Resultado:** _________________________

### Búsqueda de Disponibilidad
- [ ] GET `/api/restaurants/{id}/available-tables` funciona
- [ ] Retorna mesas disponibles correctamente
- [ ] Horarios son coherentes

```bash
curl -s "http://localhost:8000/api/restaurants/1/available-tables?date=2026-06-06&time=19:00&capacity=4" | jq .
```

**Resultado:** _________________________

### Creación de Reserva
- [ ] POST `/api/reservations` funciona
- [ ] Se registra en BD correctamente
- [ ] Retorna confirmación con datos

```bash
curl -X POST "http://localhost:8000/api/reservations" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"restaurant_id": 1, "table_id": 1, "reservation_date": "2026-06-07", "reservation_time": "19:00"}'
```

**Resultado:** _________________________

### Consulta de Reservas del Usuario
- [ ] GET `/api/user/reservations` retorna mis reservas
- [ ] Filtros por estado funcionan
- [ ] Detalles completos incluidos

**Resultado:** _________________________

### Panel del Propietario
- [ ] Propietario puede ver dashboard
- [ ] Estadísticas se cargan correctamente
- [ ] Gráficos de reservas visibles

**Resultado:** _________________________

---

## ✅ FASE 6: Validación de Configuración (5 minutos)

### Variables de Entorno
```bash
cat .env | grep -E "DB_|APP_|STRIPE"
```

- [ ] `DB_HOST` correcto: _________________
- [ ] `DB_NAME` correcto: _________________
- [ ] `DB_USER` correcto: _________________
- [ ] `APP_ENV` es correcto: _________________

### Configuración de Stripe (si aplica)
- [ ] Keys de Stripe configuradas
- [ ] Modo de prueba vs producción correcto

**Resultado:** _________________________

---

## ✅ FASE 7: Logs y Monitoreo (5 minutos)

### Revisión de Errores
```bash
tail -100 storage/logs/laravel.log | grep -i "error\|exception"
```

- [ ] No hay errores críticos en logs
- [ ] Solo warnings esperados
- [ ] No hay stack traces relacionados con BD

**Resultado:** _________________________

### Base de Datos - Errores InnoDB (si aplica)
```sql
SHOW ENGINE INNODB STATUS\G
```

- [ ] No hay locks pendientes
- [ ] No hay transacciones abiertas

**Resultado:** _________________________

---

## ✅ FASE 8: Performance y Recursos (5 minutos)

### Tamaño de BD
```sql
SELECT 
  SUM(ROUND(((data_length + index_length) / 1024 / 1024), 2)) as 'Size MB'
FROM information_schema.TABLES 
WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema');
```

- [ ] Tamaño de BD similar al esperado: ________ MB
- [ ] No hay explosión de tamaño

**Resultado:** _________________________

### Queries Lentas
```sql
SELECT * FROM mysql.slow_log LIMIT 5;
```

- [ ] No hay queries bloqueadas
- [ ] Tiempos de respuesta aceptables

**Resultado:** _________________________

---

## ✅ RESUMEN FINAL

### Resultado General
- [ ] **EXITOSO** - Todas las validaciones pasaron
- [ ] **EXITOSO CON ADVERTENCIAS** - Pasar con notas (especificar abajo)
- [ ] **FALLIDO** - No restaurar a producción (reportar issue)

### Advertencias/Problemas Encontrados
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

### Observaciones Adicionales
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

### Métricas de Restauración

| Métrica | Valor |
|---------|-------|
| Hora Inicio | _______ |
| Hora Fin | _______ |
| **Tiempo Total** | _______ minutos |
| Tamaño de BD | _______ MB |
| Cantidad de Registros | _______ |
| Archivos Restaurados | _______ |

---

## Firmas de Aprobación

**Ejecutado por:**  
Nombre: _______________________  
Firma: ________________________  
Fecha: ________________________  

**Validado por:**  
Nombre: _______________________  
Firma: ________________________  
Fecha: ________________________  

**Aprobado por:**  
Nombre: _______________________  
Firma: ________________________  
Fecha: ________________________  

---

## Notas para Próximas Restauraciones

```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```
