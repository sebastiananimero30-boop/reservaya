# Anexo 3: Scripts de Respaldo Automático
## ReservaYa - Automatización de Backups

---

## 1. Script Bash - Respaldo Manual Diario

**Ubicación:** `/scripts/backup-manual.sh`  
**Uso:** Ejecutable manualmente o vía cron job  
**Frecuencia Recomendada:** Diariamente a las 2:00 AM

```bash
#!/bin/bash

#########################################
# Script de Respaldo ReservaYa
# Realiza backup de BD MySQL y archivos
# Carga a AWS S3
#########################################

set -e

# ===== CONFIGURACIÓN =====
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
S3_BUCKET="reservaya-backups"
S3_PATH="daily-backups"

# Variables de BD
DB_HOST="${DB_HOST:-mysql-xxx.render.com}"
DB_USER="${DB_USER:-defaultuser}"
DB_PASSWORD="${DB_PASSWORD}"
DB_NAME="${DB_NAME:-defaultdb}"

# Variables de archivos
UPLOAD_DIR="/app/storage/uploads"

# Logs
LOG_FILE="/var/log/reservaya-backup.log"
ERROR_LOG="/var/log/reservaya-backup-error.log"

# ===== FUNCIONES =====

log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$ERROR_LOG"
}

send_notification() {
    # Enviar notificación por email o Slack (opcional)
    # webhook_url="https://hooks.slack.com/services/YOUR/WEBHOOK"
    # curl -X POST "$webhook_url" -d "text=$1"
    :
}

# ===== VALIDACIONES INICIALES =====

log_message "Iniciando backup de ReservaYa..."

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"

# Verificar espacio disponible
SPACE_AVAILABLE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $4}')
SPACE_NEEDED=500000  # 500 MB en KB

if [ "$SPACE_AVAILABLE" -lt "$SPACE_NEEDED" ]; then
    log_error "Espacio insuficiente. Disponible: ${SPACE_AVAILABLE}KB, Requerido: ${SPACE_NEEDED}KB"
    send_notification "❌ Backup fallido: Espacio insuficiente"
    exit 1
fi

# Verificar conectividad con BD
if ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &>/dev/null; then
    log_error "No se puede conectar a la base de datos"
    send_notification "❌ Backup fallido: No se puede conectar a BD"
    exit 1
fi

log_message "Validaciones iniciales completadas"

# ===== RESPALDO DE BASE DE DATOS =====

log_message "Iniciando respaldo de base de datos..."

BACKUP_FILE="$BACKUP_DIR/backup_reservaya_${BACKUP_DATE}.sql"

mysqldump \
    -h "$DB_HOST" \
    -u "$DB_USER" \
    -p"$DB_PASSWORD" \
    "$DB_NAME" \
    --single-transaction \
    --quick \
    --lock-tables=false \
    --routines \
    --triggers \
    --events \
    > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    log_message "✅ Respaldo de BD completado: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    log_error "Falló el respaldo de base de datos"
    send_notification "❌ Backup de BD fallido"
    exit 1
fi

# ===== COMPRESIÓN =====

log_message "Comprimiendo respaldo de BD..."

gzip "$BACKUP_FILE"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

if [ -f "$BACKUP_FILE_GZ" ]; then
    log_message "✅ Compresión completada: $(du -h "$BACKUP_FILE_GZ" | cut -f1)"
    rm -f "$BACKUP_FILE"
else
    log_error "Falló la compresión del respaldo"
    exit 1
fi

# ===== RESPALDO DE ARCHIVOS =====

log_message "Iniciando respaldo de archivos..."

if [ -d "$UPLOAD_DIR" ]; then
    FILES_BACKUP="$BACKUP_DIR/files_reservaya_${BACKUP_DATE}.tar.gz"
    
    tar -czf "$FILES_BACKUP" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")" \
        2>>"$ERROR_LOG"
    
    if [ $? -eq 0 ]; then
        log_message "✅ Respaldo de archivos completado: $(du -h "$FILES_BACKUP" | cut -f1)"
    else
        log_error "Falló el respaldo de archivos"
        # Continuar de todas formas
    fi
else
    log_message "⚠️ Directorio de archivos no encontrado: $UPLOAD_DIR"
fi

# ===== CARGA A AWS S3 =====

log_message "Cargando respaldos a AWS S3..."

# Cargar BD
if aws s3 cp "$BACKUP_FILE_GZ" "s3://$S3_BUCKET/$S3_PATH/" \
    --sse AES256 \
    --storage-class STANDARD_IA \
    2>>"$ERROR_LOG"; then
    log_message "✅ BD cargada a S3"
else
    log_error "Falló la carga de BD a S3"
    send_notification "⚠️ Backup local OK pero carga a S3 falló"
fi

# Cargar archivos
if [ -f "$FILES_BACKUP" ]; then
    if aws s3 cp "$FILES_BACKUP" "s3://$S3_BUCKET/$S3_PATH/" \
        --sse AES256 \
        --storage-class STANDARD_IA \
        2>>"$ERROR_LOG"; then
        log_message "✅ Archivos cargados a S3"
    else
        log_error "Falló la carga de archivos a S3"
    fi
fi

# ===== LIMPIEZA LOCAL =====

log_message "Limpiando archivos locales..."

# Mantener solo últimos 3 backups locales
find "$BACKUP_DIR" -name "backup_reservaya_*.sql.gz" -type f -mtime +3 -delete
find "$BACKUP_DIR" -name "files_reservaya_*.tar.gz" -type f -mtime +3 -delete

log_message "✅ Limpieza completada"

# ===== VERIFICACIÓN FINAL =====

log_message "Verificando respaldo..."

# Verificar integridad del archivo comprimido
if gzip -t "$BACKUP_FILE_GZ" 2>/dev/null; then
    log_message "✅ Integridad de respaldo verificada"
else
    log_error "Fallo en integridad del respaldo"
    send_notification "❌ Respaldo corrupto"
    exit 1
fi

# ===== RESUMEN FINAL =====

BACKUP_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
log_message "✅ BACKUP COMPLETADO EXITOSAMENTE"
log_message "Archivo: $(basename "$BACKUP_FILE_GZ")"
log_message "Tamaño: $BACKUP_SIZE"
log_message "S3 Path: s3://$S3_BUCKET/$S3_PATH/"

send_notification "✅ Backup ReservaYa completado: $BACKUP_SIZE"

exit 0
```

---

## 2. Cron Job - Ejecutar Diariamente

**Configuración en crontab:**

```bash
# Abrir crontab
crontab -e

# Agregar línea (ejecutar diariamente a las 2:00 AM)
0 2 * * * /scripts/backup-manual.sh >> /var/log/reservaya-backup-cron.log 2>&1

# O cada 12 horas
0 2,14 * * * /scripts/backup-manual.sh >> /var/log/reservaya-backup-cron.log 2>&1

# Verificar que se agregó correctamente
crontab -l
```

---

## 3. Script Python - Respaldo Inteligente

**Ubicación:** `/scripts/backup-smart.py`  
**Dependencias:** `boto3`, `mysql-connector-python`

```python
#!/usr/bin/env python3

import os
import sys
import gzip
import subprocess
import boto3
import logging
from datetime import datetime, timedelta
import json
from mysql.connector import connect

# ===== CONFIGURACIÓN =====

BACKUP_DIR = "/backups"
S3_BUCKET = "reservaya-backups"
S3_PATH = "daily-backups"
RETENTION_DAYS = 90

# BD
DB_HOST = os.getenv("DB_HOST", "mysql-xxx.render.com")
DB_USER = os.getenv("DB_USER", "defaultuser")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "defaultdb")

# ===== LOGGING =====

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler('/var/log/reservaya-backup.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ===== CLASES =====

class BackupManager:
    def __init__(self):
        self.backup_date = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.s3_client = boto3.client('s3')
        
    def get_db_size(self):
        """Obtener tamaño actual de la BD"""
        try:
            conn = connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME
            )
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                  SUM(ROUND(((data_length + index_length) / 1024 / 1024), 2))
                FROM information_schema.TABLES 
                WHERE table_schema = %s
            """, (DB_NAME,))
            size_mb = cursor.fetchone()[0] or 0
            conn.close()
            return size_mb
        except Exception as e:
            logger.error(f"Error obteniendo tamaño de BD: {e}")
            return 0
    
    def backup_database(self):
        """Realizar respaldo de BD"""
        logger.info("Iniciando respaldo de base de datos...")
        
        backup_file = f"{BACKUP_DIR}/backup_reservaya_{self.backup_date}.sql"
        
        try:
            cmd = [
                "mysqldump",
                f"--host={DB_HOST}",
                f"--user={DB_USER}",
                f"--password={DB_PASSWORD}",
                "--single-transaction",
                "--quick",
                "--lock-tables=false",
                "--routines",
                "--triggers",
                "--events",
                DB_NAME
            ]
            
            with open(backup_file, 'w') as f:
                subprocess.run(cmd, stdout=f, check=True)
            
            # Comprimir
            backup_file_gz = f"{backup_file}.gz"
            with open(backup_file, 'rb') as f_in:
                with gzip.open(backup_file_gz, 'wb') as f_out:
                    f_out.writelines(f_in)
            
            os.remove(backup_file)
            
            size_mb = os.path.getsize(backup_file_gz) / (1024 * 1024)
            logger.info(f"✅ BD respaldada: {size_mb:.2f} MB")
            
            return backup_file_gz
            
        except Exception as e:
            logger.error(f"Error en respaldo de BD: {e}")
            return None
    
    def upload_to_s3(self, file_path):
        """Cargar archivo a S3"""
        try:
            file_name = os.path.basename(file_path)
            s3_key = f"{S3_PATH}/{file_name}"
            
            logger.info(f"Cargando {file_name} a S3...")
            
            self.s3_client.upload_file(
                file_path,
                S3_BUCKET,
                s3_key,
                ExtraArgs={'ServerSideEncryption': 'AES256', 'StorageClass': 'STANDARD_IA'}
            )
            
            logger.info(f"✅ Archivo cargado a s3://{S3_BUCKET}/{s3_key}")
            return True
            
        except Exception as e:
            logger.error(f"Error cargando a S3: {e}")
            return False
    
    def cleanup_old_backups(self):
        """Eliminar respaldos más antiguos que RETENTION_DAYS"""
        logger.info(f"Limpiando respaldos más antiguos que {RETENTION_DAYS} días...")
        
        try:
            cutoff_date = datetime.now() - timedelta(days=RETENTION_DAYS)
            
            response = self.s3_client.list_objects_v2(
                Bucket=S3_BUCKET,
                Prefix=S3_PATH
            )
            
            deleted_count = 0
            for obj in response.get('Contents', []):
                if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
                    self.s3_client.delete_object(Bucket=S3_BUCKET, Key=obj['Key'])
                    deleted_count += 1
            
            if deleted_count > 0:
                logger.info(f"✅ {deleted_count} respaldos antiguos eliminados")
                    
        except Exception as e:
            logger.error(f"Error limpiando respaldos: {e}")
    
    def verify_backup(self, file_path):
        """Verificar integridad del respaldo"""
        try:
            with gzip.open(file_path, 'rb') as f:
                f.read(1)
            logger.info("✅ Integridad de respaldo verificada")
            return True
        except Exception as e:
            logger.error(f"Respaldo corrupto: {e}")
            return False
    
    def run(self):
        """Ejecutar proceso completo de backup"""
        logger.info("=" * 50)
        logger.info("INICIANDO BACKUP DE RESERVAYA")
        logger.info("=" * 50)
        
        # Crear directorio si no existe
        os.makedirs(BACKUP_DIR, exist_ok=True)
        
        # Obtener info de BD
        db_size = self.get_db_size()
        logger.info(f"Tamaño actual de BD: {db_size:.2f} MB")
        
        # Backup
        backup_file = self.backup_database()
        if not backup_file:
            logger.error("❌ BACKUP FALLIDO")
            return False
        
        # Verificar
        if not self.verify_backup(backup_file):
            logger.error("❌ BACKUP CORRUPTO")
            return False
        
        # Subir a S3
        if not self.upload_to_s3(backup_file):
            logger.error("⚠️ Upload a S3 falló (respaldo local OK)")
        
        # Limpiar respaldos antiguos
        self.cleanup_old_backups()
        
        # Limpiar archivo local (opcional)
        os.remove(backup_file)
        
        logger.info("=" * 50)
        logger.info("✅ BACKUP COMPLETADO EXITOSAMENTE")
        logger.info("=" * 50)
        
        return True

# ===== MAIN =====

if __name__ == "__main__":
    manager = BackupManager()
    success = manager.run()
    sys.exit(0 if success else 1)
```

**Uso:**
```bash
chmod +x /scripts/backup-smart.py
python3 /scripts/backup-smart.py

# En crontab
0 2 * * * python3 /scripts/backup-smart.py
```

---

## 4. Script de Restauración Rápida

**Ubicación:** `/scripts/restore-from-s3.sh`

```bash
#!/bin/bash

#########################################
# Script de Restauración desde S3
# Usar en caso de emergencia
#########################################

usage() {
    echo "Uso: $0 <backup_date> [database_name]"
    echo "Ejemplo: $0 20260605_020000 reservaya"
    exit 1
}

if [ $# -lt 1 ]; then
    usage
fi

BACKUP_DATE=$1
DB_NAME=${2:-defaultdb}
S3_BUCKET="reservaya-backups"
S3_PATH="daily-backups"
BACKUP_FILE="backup_reservaya_${BACKUP_DATE}.sql.gz"

DB_HOST="${DB_HOST:-mysql-xxx.render.com}"
DB_USER="${DB_USER:-defaultuser}"
DB_PASSWORD="${DB_PASSWORD}"

echo "🔄 Restaurando desde $BACKUP_FILE..."

# Descargar
aws s3 cp "s3://$S3_BUCKET/$S3_PATH/$BACKUP_FILE" .

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ No se pudo descargar respaldo"
    exit 1
fi

# Restaurar
echo "⏳ Restaurando en base de datos..."
gunzip -c "$BACKUP_FILE" | \
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD"

if [ $? -eq 0 ]; then
    echo "✅ RESTAURACIÓN COMPLETADA"
else
    echo "❌ RESTAURACIÓN FALLIDA"
    exit 1
fi

# Limpiar
rm "$BACKUP_FILE"
echo "✅ Proceso finalizado"
```

---

## 5. Monitoreo de Backups

**Script de Verificación:** `/scripts/check-backups.sh`

```bash
#!/bin/bash

echo "📊 Estado de Respaldos ReservaYa"
echo "================================"

S3_BUCKET="reservaya-backups"
S3_PATH="daily-backups"

# Últimos 7 respaldos
echo -e "\n📦 Últimos 7 respaldos en S3:"
aws s3 ls "s3://$S3_BUCKET/$S3_PATH/" --human-readable --summarize | tail -10

# Espacio usado
echo -e "\n💾 Espacio usado en S3:"
aws s3 ls "s3://$S3_BUCKET/" --human-readable --summarize | tail -2

# Respaldos en Render (vía API)
echo -e "\n🔍 Respaldos en Render (últimos 3):"
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
    "https://api.render.com/v1/services/[SERVICE_ID]/backups?limit=3" | jq '.[]'

echo -e "\n✅ Verificación completada"
```

---

## Notas de Implementación

✅ **Configurar Variables de Entorno:**
```bash
export DB_HOST="mysql-xxx.render.com"
export DB_USER="defaultuser"
export DB_PASSWORD="your_password"
export DB_NAME="defaultdb"
export AWS_ACCESS_KEY_ID="your_key"
export AWS_SECRET_ACCESS_KEY="your_secret"
```

✅ **Dar Permisos de Ejecución:**
```bash
chmod +x /scripts/*.sh
chmod +x /scripts/*.py
```

✅ **Configurar CloudWatch (AWS):**
```bash
# Enviar logs a CloudWatch para monitoreo centralizado
tail -f /var/log/reservaya-backup.log | \
    aws logs put-log-events --log-group-name /reservaya/backups \
    --log-stream-name backup-logs
```

---

**Última actualización:** 2026-06-06  
**Mantenedor:** Equipo de Infraestructura
