# Plan de Respaldo y Recuperación ante Desastres
## ReservaYa - Sistema de Reservas para Restaurantes

**Versión:** 1.0  
**Fecha de Creación:** 2026-06-06  
**Última Actualización:** 2026-06-06  
**Responsable:** Equipo de Infraestructura  

---

## 1. Objetivos del Plan

1.1. Proteger la información que se almacena en la base de datos MySQL de ReservaYa
1.2. Establecer un respaldo automático diario sin requerir intervención manual
1.3. Garantizar la disponibilidad de archivos subidos (fotos de restaurantes, menús, etc.)
1.4. Definir pasos claros y sencillos para restaurar la base de datos y archivos
1.5. Garantizar la continuidad operativa del sistema web de ReservaYa
1.6. Cumplir con normativas de protección de datos
1.7. Reducir tiempos de recuperación ante incidentes o pérdida de datos

---

## 2. Clasificación de Datos

| Categoría | Tipo de Datos | Nivel de Criticidad | Frecuencia de Respaldo | Retención Requerida |
|-----------|---------------|-------------------|----------------------|-------------------|
| Base de Datos MySQL | Datos transaccionales (reservas, usuarios, restaurantes, reseñas) | **Crítico** | Diario | 90 días |
| Almacenamiento de Archivos | Fotos de restaurantes, menús, documentos | Alto | Diario | 90 días |
| Configuraciones | Archivos de entorno (.env, configuraciones de servidor) | Alto | Semanal | 180 días |
| Código de Aplicación | Código fuente del backend y frontend | Medio | Semanal (mediante Git) | Indefinido |

---

## 3. Estrategia de Respaldo

### 3.1 Herramientas y Servicios

**Plataforma Principal:** Render.com  
**Base de Datos:** Render PostgreSQL / MySQL managed service  
**Almacenamiento:** Render Disk Storage / AWS S3 (opcional)  
**Respaldos en Nube:** AWS S3 o similar servicio en la nube

### 3.2 Frecuencia de Respaldos

- **Respaldos Completos:** Diariamente a las 2:00 AM (zona horaria del servidor)
- **Retención:** Últimos 90 días de respaldos
- **Rotación:** Automática mediante políticas de ciclo de vida en almacenamiento en nube

### 3.3 Componentes a Respaldar

#### Base de Datos MySQL
```sql
-- Respaldo automático diario
mysqldump --all-databases \
  --single-transaction \
  --quick \
  --lock-tables=false \
  > backup_reservaya_$(date +\%Y\%m\%d).sql
```

#### Almacenamiento de Archivos
- Directorio: `/uploads/restaurants/photos/`
- Directorio: `/uploads/menus/`
- Método: Sincronización diaria a AWS S3 o similar

---

## 4. Almacenamiento y Rotación

### 4.1 Ubicación de Respaldos

| Tipo | Ubicación | Acceso | Redundancia |
|------|-----------|--------|------------|
| Respaldos Automáticos BD | Render Backups (managed) | Portal Render.com | Automática |
| Respaldos Manual BD | AWS S3 `reservaya-backups/` | AWS Console | Cross-region replication |
| Archivos Subidos | Render Disk Storage | Terminal SSH | Snapshots semanales |
| Archivos Respaldados | AWS S3 `reservaya-files/` | AWS Console | Cross-region replication |

### 4.2 Política de Rotación

**Automática en Render:**
- Render mantiene 7 respaldos automáticos (últimos 7 días)
- Se puede cambiar a 30 respaldos si es necesario (verificar en dashboard)

**Manual en AWS S3:**
- Respaldos archivados en buckets separados
- Eliminar respaldos mayores a 90 días mediante Lifecycle Policies
- Ejemplo de política:
  ```json
  {
    "Rules": [
      {
        "Id": "DeleteOldBackups",
        "Status": "Enabled",
        "Expiration": {
          "Days": 90
        },
        "Prefix": "daily-backups/"
      }
    ]
  }
  ```

---

## 5. Procedimiento de Restauración

### 5.1 Restauración desde Render (Recomendado - Rápido)

**Tiempo Estimado:** 15-30 minutos

1. Acceder a Dashboard de Render.com
2. Ir a PostgreSQL/MySQL service → Backups
3. Seleccionar el respaldo deseado
4. Hacer clic en "Restore"
5. Confirmar la acción (Se creará una nueva instancia temporal)
6. Verificar integridad de datos
7. Cambiar punto de entrada de aplicación a nueva BD si es necesario

### 5.2 Restauración desde AWS S3 (Backup Externo)

**Tiempo Estimado:** 30-45 minutos

```bash
# 1. Descargar respaldo desde S3
aws s3 cp s3://reservaya-backups/backup_reservaya_20260606.sql ./

# 2. Restaurar en nueva instancia MySQL
mysql -h <DB_HOST> -u <DB_USER> -p < backup_reservaya_20260606.sql

# 3. Validar datos
mysql -h <DB_HOST> -u <DB_USER> -p -e "SELECT COUNT(*) FROM reservations;"
```

### 5.3 Restauración de Archivos

```bash
# 1. Sincronizar desde S3
aws s3 sync s3://reservaya-files/uploads/ ./storage/uploads/

# 2. Ajustar permisos
chmod -R 755 storage/uploads/
```

### 5.4 Prueba de Restauración (Trimestral)

- Ejecutar al menos una restauración de prueba cada 3 meses
- Documentar tiempo de recuperación (RTO)
- Verificar que todos los datos se restauren correctamente
- Actualizar procedimientos según sea necesario

---

## 6. Pruebas y Verificación

### 6.1 Validación de Respaldos

**Semanal:**
- Verificar que los respaldos automáticos se ejecuten sin errores
- Revisar logs de Render.com
- Confirmar tamaño de archivos de respaldo (deben ser similares día a día)

**Trimestral (Cada 3 meses):**
- Restaurar en ambiente de prueba
- Ejecutar suite de pruebas automatizadas
- Validar integridad de datos con checklist (Ver Anexo 1)
- Documentar tiempo de restauración

### 6.2 Checklist de Validación Post-Restauración

```
□ Conectarse a BD restaurada sin errores
□ SELECT COUNT(*) en todas las tablas principales (usuarios, restaurantes, reservas)
□ Verificar últimas 10 reservas registradas
□ Confirmar que archivos de fotos se restauraron
□ Probar inicio de sesión de usuario de prueba
□ Verificar que cálculos de disponibilidad funcionan
□ Validar integridad de relaciones entre tablas
□ Confirmar que registros de auditoría se restauraron
```

### 6.3 Métricas de Recuperación

| Métrica | Target | Actual |
|---------|--------|--------|
| RPO (Recovery Point Objective) | Máximo 1 día de datos | 24 horas |
| RTO (Recovery Time Objective) | Máximo 2 horas | Verificar en pruebas |
| Tiempo de Verificación | Máximo 30 min | Documentar |

---

## 7. Roles y Responsabilidades

### 7.1 Administrador de Infraestructura

**Responsabilidades:**
- Configurar respaldos automáticos en Render.com
- Monitorear ejecución de respaldos diarios
- Mantener credenciales de acceso seguras
- Realizar pruebas trimestrales de restauración
- Actualizar la política de retención según se requiera

**Tareas Diarias:**
- Revisar alertas de Render.com
- Confirmar que respaldos se ejecutaron exitosamente
- Monitorear espacio de almacenamiento

### 7.2 Administrador de Base de Datos

**Responsabilidades:**
- Verificar integridad de respaldos
- Validar que BD restaurada está funcional
- Optimizar queries para respaldos rápidos
- Documentar cambios en esquema que afecten respaldos
- Mantener procedimientos de restauración actualizados

**Tareas Trimestrales:**
- Ejecutar restauración de prueba
- Verificar checklist de validación
- Documentar tiempos de recuperación

### 7.3 Desarrollador Backend

**Responsabilidades:**
- Alertar cambios en estructura de BD que requieran ajustes en respaldos
- Probar restauraciones en ambiente local durante desarrollo
- Validar migraciones de BD no rompan respaldos anteriores

### 7.4 Gerente de Proyectos / TI

**Responsabilidades:**
- Aprobar recursos para infraestructura de respaldos
- Supervisar cumplimiento del plan
- Autorizar cambios en política de retención
- Escalar incidentes de pérdida de datos
- Revisar plan semestralmente

---

## 8. Documentación Adjunta

### Anexo 1: Checklist de Validación Post-Restauración
- Lista de verificación completa (Ver sección 6.2)
- Queries SQL para validar integridad

### Anexo 2: Guía Paso a Paso Restauración en Render
- Instrucciones detalladas con screenshots
- Solución de problemas comunes

### Anexo 3: Scripts de Respaldo Automático
- Script bash para respaldos manuales
- Configuración de cron jobs

### Anexo 4: Procedimiento de Escalamiento en Incidentes
- Pasos a seguir en caso de pérdida de datos
- Contactos de emergencia
- Comunicación a usuarios

---

## 9. Procedimiento en Caso de Incidente

### Paso 1: Evaluar Severidad (5 minutos)
- ¿Afecta a datos críticos? (Reservas, usuarios)
- ¿Cuántos datos se perdieron?
- ¿Cuál fue la causa? (Corrupción, eliminación accidental, etc.)

### Paso 2: Notificar (10 minutos)
- Informar al Gerente de TI
- Comunicar a stakeholders si es necesario
- Registrar incidente

### Paso 3: Ejecutar Restauración (Ver sección 5)
- Elegir respaldo más reciente funcional
- Ejecutar restauración en paralelo (crear nueva instancia)
- Validar datos restaurados

### Paso 4: Cambiar Punto de Entrada (5 minutos)
- Si es necesario, redirigir aplicación a nueva BD
- Actualizar variables de entorno
- Redeploy de aplicación

### Paso 5: Validación y Comunicación (30 minutos)
- Ejecutar checklist de validación (Anexo 1)
- Comunicar normalización a usuarios si fue necesario
- Documentar causa raíz y acciones preventivas

---

## 10. Revisión y Actualización

**Frecuencia:** Semestralmente o tras eventos importantes

### Próxima Revisión Programada
- **Fecha:** Diciembre 2026
- **Responsable:** [Nombre del Administrador de Infraestructura]

### Trigger de Revisión Extraordinaria
- Cambios significativos en infraestructura
- Incidente de pérdida de datos
- Cambios en normativa de protección de datos
- Renovación de servicio con Render.com
- Cambio de tamaño de BD significativo (>50%)

### Historial de Revisiones

| Versión | Fecha | Cambios | Responsable |
|---------|-------|---------|------------|
| 1.0 | 2026-06-06 | Creación inicial del plan | Equipo Infraestructura |
| | | | |

---

## Contactos de Emergencia

| Rol | Nombre | Teléfono | Email |
|-----|--------|----------|-------|
| Administrador Infraestructura | [Nombre] | [Teléfono] | [Email] |
| DBA | [Nombre] | [Teléfono] | [Email] |
| Gerente de TI | [Nombre] | [Teléfono] | [Email] |

---

**Nota:** Este documento debe ser accesible a todo el equipo de TI pero protegido del acceso público. Revisar y actualizar anualmente como mínimo.
