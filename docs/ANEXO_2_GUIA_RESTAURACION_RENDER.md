# Anexo 2: Guía Paso a Paso - Restauración en Render
## ReservaYa - Procedimiento de Recuperación

---

## Tabla de Contenidos
1. [Restauración Rápida desde Render](#restauración-rápida-desde-render)
2. [Restauración Manual desde AWS S3](#restauración-manual-desde-aws-s3)
3. [Solución de Problemas](#solución-de-problemas)
4. [Validación Post-Restauración](#validación-post-restauración)
5. [Contactos de Emergencia](#contactos-de-emergencia)

---

## Restauración Rápida desde Render

### ✅ OPCIÓN RECOMENDADA - Tiempo: 15-30 minutos

**Ventajas:**
- No requiere herramientas adicionales
- Render gestiona toda la restauración
- Backup garantizado por Render
- Rápido y confiable

### Paso 1: Acceder a Render Dashboard

1. Ir a [https://dashboard.render.com](https://dashboard.render.com)
2. Iniciar sesión con credenciales de Render
3. Seleccionar proyecto `ReservaYa` o similar

**📸 Ubicación:**
```
Dashboard → Select Project → [Nombre de tu BD MySQL/PostgreSQL]
```

### Paso 2: Navegar a la Sección de Backups

1. En el dashboard del servicio de BD, buscar la pestaña **"Backups"**
2. Se mostrará una lista de respaldos disponibles

**Ejemplo de lo que verás:**
```
Backup ID          Created At          Status      Size
────────────────────────────────────────────────────────
bak_abc123def456    2026-06-05 02:00:00  Available   245 MB
bak_abc123def455    2026-06-04 02:00:00  Available   244 MB
bak_abc123def454    2026-06-03 02:00:00  Available   243 MB
```

### Paso 3: Seleccionar Respaldo

1. Identificar el respaldo deseado (usualmente el más reciente)
2. Hacer clic en el botón **"Restore"** o **"Restore Backup"**

⚠️ **IMPORTANTE:** 
- Si perdiste datos hoy, usar respaldo de AYER
- Si el problema es antiguo, puedes seleccionar respaldo de días anteriores

### Paso 4: Confirmar la Restauración

Se mostrará un diálogo de confirmación:

```
⚠️ ADVERTENCIA DE RESTAURACIÓN

Esto reemplazará la base de datos actual con el respaldo.
Todos los datos desde el respaldo hasta ahora se PERDERÁN.

Base de Datos: reservaya-prod
Respaldo: bak_abc123def456 (2026-06-05 02:00:00)

¿Continuar? [CANCELAR] [RESTAURAR]
```

- Hacer clic en **"RESTAURAR"** para confirmar

### Paso 5: Esperar Restauración

1. Render mostrará barra de progreso
2. Típicamente toma 5-15 minutos según tamaño
3. Se mostrará mensaje cuando esté completo

**Mensajes esperados:**
```
✅ Restauración en progreso... 25%
✅ Restauración en progreso... 75%
✅ Restauración completada exitosamente

Tu base de datos ahora contiene el respaldo del 2026-06-05 02:00:00
```

### Paso 6: Verificar Aplicación

1. Ir a tu aplicación web: `https://reservaya.onrender.com`
2. Probar inicio de sesión
3. Verificar que datos se ven correctos
4. Revisar logs de error (si aplica)

**Logs en Render:**
```
Ir a: Logs → tail -f logs
Buscar: error, exception, warning
```

---

## Restauración Manual desde AWS S3

### ⏱️ OPCIÓN ALTERNATIVA - Tiempo: 30-45 minutos

**Cuándo usar:**
- Si Render no tiene el respaldo que necesitas
- Para restaurar a ambiente de desarrollo
- Para respaldos más antiguos de 7+ días

### Paso 1: Obtener Acceso SSH a Render

1. En Render Dashboard, ir a tu servicio web (no la BD)
2. Buscar sección **"Shell"** o **"SSH"**
3. Hacer clic para abrir terminal

**Alternativa - SSH Manual:**
```bash
ssh -i ~/.ssh/render_key ubuntu@your-render-ssh-host
```

### Paso 2: Instalar AWS CLI (si no está disponible)

```bash
# En terminal de Render/SSH
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Paso 3: Configurar Credenciales AWS

```bash
aws configure

# Te pedirá:
# AWS Access Key ID: [TU_ACCESS_KEY]
# AWS Secret Access Key: [TU_SECRET_KEY]
# Default region name: us-east-1
# Default output format: json
```

⚠️ **SEGURIDAD:** Credenciales AWS deben estar en variables de entorno, no en código

### Paso 4: Listar Respaldos Disponibles en S3

```bash
aws s3 ls s3://reservaya-backups/daily-backups/

# Salida esperada:
# 2026-06-05 02:00:00  245000000  backup_reservaya_20260605.sql
# 2026-06-04 02:00:00  244000000  backup_reservaya_20260604.sql
# 2026-06-03 02:00:00  243000000  backup_reservaya_20260603.sql
```

### Paso 5: Descargar Respaldo Específico

```bash
# Descargar respaldo de 5 de junio
aws s3 cp s3://reservaya-backups/daily-backups/backup_reservaya_20260605.sql .

# Mostrar progreso
# download: s3://reservaya-backups/daily-backups/backup_reservaya_20260605.sql to ./backup_reservaya_20260605.sql
```

### Paso 6: Conectar a Base de Datos

```bash
# Obtener credenciales de BD desde variables de entorno
echo $DATABASE_URL

# Exportar variables para mysql
export DB_HOST="mysql-xxx.render.com"
export DB_USER="defaultuser"
export DB_PASSWORD="xxxxx"
export DB_NAME="defaultdb"
```

### Paso 7: Crear Base de Datos Nueva (Opcional)

```bash
# Crear BD de backup temporal
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "CREATE DATABASE reservaya_restore_$(date +%s);"
```

### Paso 8: Restaurar Respaldo

**Opción A: Restaurar a BD Nueva**
```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD \
  reservaya_restore_$(date +%s) < backup_reservaya_20260605.sql
```

**Opción B: Restaurar a BD Existente (⚠️ CUIDADO)**
```bash
# SOLO si estás seguro
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD \
  reservaya < backup_reservaya_20260605.sql
```

### Paso 9: Validar Restauración

```bash
# Conectar a BD restaurada
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD reservaya_restore_xxxxx

# En la consola mysql:
> SELECT COUNT(*) FROM users;
> SELECT COUNT(*) FROM reservations;
> SELECT * FROM reservations ORDER BY created_at DESC LIMIT 1;
> EXIT;
```

### Paso 10: Cambiar Punto de Conexión (si es necesario)

Si restauraste a BD nueva, actualizar variables:

**En Render Dashboard:**
1. Ir a tu servicio web
2. Environment → Edit
3. Cambiar `DATABASE_URL` apuntando a nueva BD
4. Guardar cambios
5. Se auto-redeploy la aplicación

---

## Solución de Problemas

### ❌ Problema: "Connection timeout" al conectar BD

**Causa:** Render o AWS no está accesible

**Solución:**
```bash
# Verificar conectividad
ping mysql-xxx.render.com

# Verificar credenciales
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1;"

# Si el puerto está bloqueado
nc -zv mysql-xxx.render.com 3306
```

### ❌ Problema: "Disk full" durante restauración

**Causa:** No hay espacio suficiente

**Solución:**
```bash
# Ver espacio disponible
df -h

# Limpiar archivos temporales
rm -rf /tmp/*
rm *.sql

# Comprimir respaldo si es muy grande
gzip backup_reservaya_20260605.sql
mysql ... < backup_reservaya_20260605.sql.gz
```

### ❌ Problema: "Access denied" para usuario de BD

**Causa:** Credenciales incorrectas o usuario sin permisos

**Solución:**
```bash
# Verificar usuario correcto
# Usuario Render generalmente es 'defaultuser'
# Contraseña está en DATABASE_URL

# Formato DATABASE_URL:
# mysql://defaultuser:PASSWORD@host:3306/defaultdb

# Extraer password
PASSWORD=$(echo $DATABASE_URL | sed -E 's/.*:(.*)@.*/\1/')
echo $PASSWORD
```

### ❌ Problema: "InnoDB table corrupt" después de restauración

**Causa:** Corrupción en tablas

**Solución:**
```bash
# En cliente mysql:
> REPAIR TABLE table_name;
> CHECK TABLE table_name;

# O para todas las tablas:
mysqlcheck -h $DB_HOST -u $DB_USER -p$DB_PASSWORD \
  --all-databases --repair --optimize
```

---

## Validación Post-Restauración

### ✅ Checklist Rápido (5 minutos)

```bash
#!/bin/bash
# Script de validación rápida

echo "🔍 Validando restauración..."

DB_HOST=$1
DB_USER=$2
DB_PASS=$3
DB_NAME=$4

# 1. Conectividad
echo -n "✓ Conectividad: "
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -e "SELECT 1;" 2>/dev/null && echo "OK" || echo "FALLO"

# 2. Tablas principales
echo -n "✓ Tabla users: "
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "FALLO"

echo -n "✓ Tabla restaurants: "
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "SELECT COUNT(*) FROM restaurants;" 2>/dev/null || echo "FALLO"

echo -n "✓ Tabla reservations: "
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "SELECT COUNT(*) FROM reservations;" 2>/dev/null || echo "FALLO"

# 3. Aplicación
echo -n "✓ Aplicación web: "
curl -s https://reservaya.onrender.com | grep -q "ReservaYa" && echo "OK" || echo "FALLO"

echo "✅ Validación completada"
```

### ✅ Pruebas Funcionales Manuales

1. **Login:** Ingresar con usuario de prueba
2. **Búsqueda:** Buscar restaurante con fecha/hora
3. **Disponibilidad:** Ver mesas disponibles
4. **Reserva:** Intentar crear reserva (cancelar después)
5. **Admin:** Acceder a panel de propietario

---

## Contactos de Emergencia

Si experimentas problemas durante la restauración:

### Soporte Render
- **Sitio Web:** https://support.render.com
- **Email:** support@render.com
- **Estado:** https://renderstatus.com

### Soporte AWS S3
- **Sitio Web:** https://console.aws.amazon.com
- **Email:** support@aws.amazon.com
- **Chat:** En AWS Console

### Equipo Interno ReservaYa
- **Admin Infra:** [Nombre - Teléfono - Email]
- **DBA:** [Nombre - Teléfono - Email]
- **DevOps:** [Nombre - Teléfono - Email]

---

## Notas Finales

✅ **Documentar siempre:**
- Qué respaldo se restauró
- Fecha/hora de restauración
- Razón de la restauración
- Problemas encontrados
- Validaciones ejecutadas

✅ **Revisar Plan Principal** después de restauración exitosa

✅ **Programar Próxima Prueba** de restauración en 3 meses

---

**Última actualización:** 2026-06-06  
**Próxima revisión:** 2026-12-06  
**Responsable:** Equipo de Infraestructura
