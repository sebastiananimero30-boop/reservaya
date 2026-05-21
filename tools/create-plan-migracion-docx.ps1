param(
    [string]$OutputDir = "docs/manuales"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Escape-XmlText {
    param([string]$Text)
    if ($null -eq $Text) { return "" }
    return [System.Security.SecurityElement]::Escape($Text)
}

function New-Paragraph {
    param(
        [string]$Text,
        [string]$Style = "",
        [bool]$Bold = $false
    )

    $escaped = Escape-XmlText $Text
    $styleXml = if ($Style) { "<w:pPr><w:pStyle w:val=`"$Style`"/></w:pPr>" } else { "" }
    $boldXml = if ($Bold) { "<w:rPr><w:b/></w:rPr>" } else { "" }
    return "<w:p>$styleXml<w:r>$boldXml<w:t xml:space=`"preserve`">$escaped</w:t></w:r></w:p>"
}

function New-Bullet {
    param([string]$Text)
    $escaped = Escape-XmlText $Text
    return "<w:p><w:pPr><w:pStyle w:val=`"ListParagraph`"/><w:ind w:left=`"720`" w:hanging=`"360`"/></w:pPr><w:r><w:t xml:space=`"preserve`">- $escaped</w:t></w:r></w:p>"
}

function New-SimpleTable {
    param([array]$Headers, [array]$Rows)

    $xml = "<w:tbl><w:tblPr><w:tblStyle w:val=`"TableGrid`"/><w:tblW w:w=`"0`" w:type=`"auto`"/></w:tblPr>"
    $xml += "<w:tr>"
    foreach ($header in $Headers) {
        $xml += "<w:tc><w:tcPr><w:shd w:fill=`"D9EAF7`"/></w:tcPr>$(New-Paragraph -Text $header -Bold $true)</w:tc>"
    }
    $xml += "</w:tr>"

    foreach ($row in $Rows) {
        $xml += "<w:tr>"
        foreach ($cell in $row) {
            $xml += "<w:tc>$(New-Paragraph -Text $cell)</w:tc>"
        }
        $xml += "</w:tr>"
    }

    $xml += "</w:tbl>"
    return $xml
}

function Add-ZipEntry {
    param(
        [System.IO.Compression.ZipArchive]$Zip,
        [string]$EntryName,
        [string]$Content
    )

    $entry = $Zip.CreateEntry($EntryName)
    $stream = $entry.Open()
    $writer = New-Object System.IO.StreamWriter($stream, (New-Object System.Text.UTF8Encoding($false)))
    $writer.Write($Content)
    $writer.Dispose()
    $stream.Dispose()
}

function New-Docx {
    param(
        [string]$Path,
        [string]$Title,
        [array]$Sections
    )

    if (Test-Path $Path) {
        Remove-Item -LiteralPath $Path -Force
    }

    $body = New-Paragraph -Text $Title -Style "Title"
    $body += New-Paragraph -Text "Proyecto: ReservaYa | Laravel 11, React 18, PostgreSQL 16 y Docker Compose"
    $body += New-Paragraph -Text "Fecha de elaboracion: 2026-05-17"

    foreach ($section in $Sections) {
        $body += New-Paragraph -Text $section.Title -Style "Heading1"
        if ($section.ContainsKey("Paragraphs")) {
            foreach ($paragraph in $section.Paragraphs) {
                $body += New-Paragraph -Text $paragraph
            }
        }
        if ($section.ContainsKey("Bullets")) {
            foreach ($bullet in $section.Bullets) {
                $body += New-Bullet -Text $bullet
            }
        }
        if ($section.ContainsKey("Table")) {
            $body += New-SimpleTable -Headers $section.Table.Headers -Rows $section.Table.Rows
        }
    }

    $contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>
'@

    $rootRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
'@

    $documentRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
'@

    $styles = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:sz w:val="34"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="26"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr>
  </w:style>
</w:styles>
'@

    $document = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    $body
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>
  </w:body>
</w:document>
"@

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::Open($Path, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        Add-ZipEntry -Zip $zip -EntryName "[Content_Types].xml" -Content $contentTypes
        Add-ZipEntry -Zip $zip -EntryName "_rels/.rels" -Content $rootRels
        Add-ZipEntry -Zip $zip -EntryName "word/document.xml" -Content $document
        Add-ZipEntry -Zip $zip -EntryName "word/styles.xml" -Content $styles
        Add-ZipEntry -Zip $zip -EntryName "word/_rels/document.xml.rels" -Content $documentRels
    }
    finally {
        $zip.Dispose()
    }
}

$sections = @(
    @{
        Title = "1. Objetivo"
        Paragraphs = @(
            "Definir el plan para ejecutar la migracion de base de datos y despliegue asociado de ReservaYa de forma controlada, trazable y reversible.",
            "El plan cubre preparacion, respaldo, ejecucion de migraciones Laravel, ejecucion de seeders cuando aplique, validacion funcional, monitoreo y cierre."
        )
    },
    @{
        Title = "2. Alcance"
        Bullets = @(
            "Base de datos PostgreSQL 16 del servicio ReservaYa.",
            "Migraciones Laravel ubicadas en backend/database/migrations.",
            "Datos semilla definidos en backend/database/seeders/DatabaseSeeder.php.",
            "Backend Laravel, frontend React/Vite y contenedores Docker Compose.",
            "Integraciones relacionadas: autenticacion Google OAuth y pagos Stripe."
        )
    },
    @{
        Title = "3. Ambientes"
        Table = @{
            Headers = @("Ambiente", "URL / Servicio", "Base de datos", "Uso")
            Rows = @(
                @("Desarrollo", "Frontend http://localhost:3000, API http://localhost:8000/api", "PostgreSQL docker: reservaya", "Pruebas locales y validacion tecnica."),
                @("Pruebas", "URL definida por el equipo", "Copia controlada de datos o seed demo", "Ensayo de migracion y pruebas funcionales."),
                @("Produccion", "APP_URL y FRONTEND_URL reales", "PostgreSQL docker: reservaya_db_prod", "Ejecucion final con ventana aprobada.")
            )
        }
    },
    @{
        Title = "4. Migraciones incluidas"
        Table = @{
            Headers = @("Tipo", "Migraciones / cambios", "Impacto")
            Rows = @(
                @("Tablas base", "users, categories, restaurants, tables, reservations", "Estructura principal de autenticacion, catalogo y reservas."),
                @("Tablas complementarias", "restaurant_photos, reviews, schedules, personal_access_tokens, menu_items", "Fotos, reseñas, horarios, tokens y menus."),
                @("Google OAuth", "add_google_id_to_users_table", "Permite vincular usuarios con Google y password nullable."),
                @("Pagos Stripe", "add_stripe_payment_fields_to_reservations_table y add_payment_fields_to_reservations_table", "Registra proveedor, estado, monto, moneda, sesiones e intents de pago."),
                @("Rendimiento", "add_performance_indexes", "Indices para reservas, restaurantes, mesas, reseñas y menus.")
            )
        }
    },
    @{
        Title = "5. Estrategia de migracion"
        Bullets = @(
            "Ejecutar primero en ambiente de pruebas con copia representativa o datos seed.",
            "Tomar backup previo antes de tocar produccion.",
            "Usar php artisan migrate --force para aplicar cambios de esquema.",
            "Ejecutar php artisan db:seed --force solo cuando el ambiente requiera datos demo o parametrizacion inicial.",
            "Validar estructura, conteos, endpoints criticos y flujos de usuario antes de liberar.",
            "Mantener disponible el procedimiento de rollback documentado en docs/checklists/procedimiento_rollback.xlsx."
        )
    },
    @{
        Title = "6. Cronograma de ejecucion"
        Table = @{
            Headers = @("Fase", "Actividad", "Duracion estimada", "Responsable", "Evidencia")
            Rows = @(
                @("Preparacion", "Confirmar version, rama, variables .env, credenciales y ventana de cambio.", "30 min", "Lider tecnico", "Checklist PRE diligenciado."),
                @("Backup", "Generar backup previo de PostgreSQL y verificar archivo.", "20 min", "DBA/DevOps", "Archivo .sql validado."),
                @("Despliegue", "Actualizar backend/frontend o contenedores segun release aprobado.", "30 min", "DevOps", "Servicios levantados."),
                @("Migracion", "Ejecutar php artisan migrate --force.", "10 min", "Backend/DevOps", "migrate:status sin pendientes inesperados."),
                @("Seed opcional", "Ejecutar php artisan db:seed --force si aplica.", "10 min", "Backend", "Datos base creados o seed omitido por idempotencia."),
                @("Validacion", "Probar DB, API, frontend, reservas, roles y pagos.", "60 min", "QA/Equipo tecnico", "Checklist POST diligenciado."),
                @("Monitoreo", "Revisar logs y comportamiento inicial.", "60 min", "DevOps/Soporte", "Sin errores criticos."),
                @("Cierre", "Comunicar resultado y guardar evidencias.", "15 min", "Lider tecnico", "Acta o mensaje de cierre.")
            )
        }
    },
    @{
        Title = "7. Actividades tecnicas"
        Table = @{
            Headers = @("Orden", "Actividad", "Comando sugerido", "Resultado esperado")
            Rows = @(
                @("1", "Verificar estado de servicios", "docker-compose ps", "db, backend y frontend activos o listos para actualizar."),
                @("2", "Tomar backup previo", "docker exec reservaya_db_prod pg_dump -U reservaya reservaya > backup_pre_migracion.sql", "Backup generado."),
                @("3", "Aplicar migraciones", "docker exec reservaya_backend_prod php artisan migrate --force", "Migraciones aplicadas sin error."),
                @("4", "Validar estado de migraciones", "docker exec reservaya_backend_prod php artisan migrate:status", "Migraciones requeridas en estado Ran."),
                @("5", "Ejecutar seed si aplica", "docker exec reservaya_backend_prod php artisan db:seed --force", "Datos iniciales creados o seed omitido si ya existian."),
                @("6", "Limpiar caches si hubo cambios", "php artisan config:clear && php artisan route:clear && php artisan config:cache", "Configuracion consistente."),
                @("7", "Revisar logs", "docker-compose -f docker-compose.prod.yml logs --tail=200 backend db", "Sin excepciones criticas."),
                @("8", "Validar healthcheck", "GET /api/health", "Respuesta status ok.")
            )
        }
    },
    @{
        Title = "8. Validaciones funcionales"
        Bullets = @(
            "Autenticacion: registro, login, /api/auth/me y logout.",
            "Catalogo: GET /api/categories, GET /api/restaurants, detalle de restaurante y disponibilidad de mesas.",
            "Reservas: crear reserva, consultar mis reservas, cancelar reserva y validar estados.",
            "Propietario: listar restaurantes asignados, administrar menu, consultar reservas y escanear codigo RYA.",
            "Administrador: crear propietarios, crear/editar restaurantes, asignar owner y consultar estadisticas.",
            "Pagos: crear checkout session, consultar sesion Stripe, validar webhook o flujo de confirmacion segun configuracion."
        )
    },
    @{
        Title = "9. Riesgos y mitigacion"
        Table = @{
            Headers = @("Riesgo", "Impacto", "Mitigacion")
            Rows = @(
                @("Fallo de migracion por constraint o columna existente", "Interrupcion del despliegue", "Probar en staging, revisar migrate:status y tener rollback listo."),
                @("Perdida o inconsistencia de datos", "Afectacion de reservas y pagos", "Backup previo obligatorio y validacion de conteos."),
                @("Codigo incompatible con esquema revertido", "Errores 500 en API", "Desplegar release compatible o revertir codigo junto con DB."),
                @("Variables de entorno incompletas", "Falla en Google, Stripe o CORS", "Validar .env antes de migrar."),
                @("Seed ejecutado en ambiente no adecuado", "Datos demo en produccion", "Autorizar explicitamente db:seed y limitarlo a parametrizacion requerida."),
                @("Indices duplicados o migracion vacia", "Errores o falsa confianza", "Revisar migraciones 2026_05_11_200000 y 2026_05_11_204140 antes de ejecutar.")
            )
        }
    },
    @{
        Title = "10. Plan de rollback"
        Bullets = @(
            "Activar rollback si hay errores criticos de migracion, API 500 persistentes, perdida de datos, pagos inconsistentes o imposibilidad de reservar.",
            "Restaurar backup previo cuando existan cambios de datos o riesgo de inconsistencia.",
            "Usar migrate:rollback --step=1 --force solo si el lote aplicado es claro y no se comprometieron datos nuevos.",
            "Revertir codigo al release estable si la aplicacion nueva depende del esquema fallido.",
            "Seguir el documento docs/checklists/procedimiento_rollback.xlsx como guia operativa."
        )
    },
    @{
        Title = "11. Criterios de aprobacion"
        Bullets = @(
            "Todas las migraciones esperadas aparecen como ejecutadas.",
            "La API /api/health responde correctamente.",
            "Los flujos de cliente, propietario y administrador funcionan sin errores criticos.",
            "Los logs de backend y base de datos no muestran excepciones persistentes.",
            "Los conteos y relaciones principales de usuarios, restaurantes, mesas y reservas son consistentes.",
            "El responsable funcional aprueba la liberacion posterior a la validacion."
        )
    },
    @{
        Title = "12. Evidencias de cierre"
        Table = @{
            Headers = @("Evidencia", "Ubicacion / formato", "Responsable")
            Rows = @(
                @("Backup previo", "Archivo .sql con fecha y ambiente", "DBA/DevOps"),
                @("Resultado de migraciones", "Salida de php artisan migrate:status", "Backend"),
                @("Checklist PRE", "Lista de Chequeo - PRE-MIGRACION - DB", "Lider tecnico"),
                @("Checklist POST", "Lista de Chequeo - POST - MIGRACION - DB", "QA/Equipo tecnico"),
                @("Logs de validacion", "docker-compose logs o herramienta de monitoreo", "DevOps"),
                @("Aprobacion final", "Acta, correo o mensaje de cierre", "Responsable funcional")
            )
        }
    }
)

$fullOutputDir = Join-Path (Get-Location) $OutputDir
New-Item -ItemType Directory -Path $fullOutputDir -Force | Out-Null

$migrationWord = "Migraci$([char]0x00F3)n"
$outputPath = Join-Path $fullOutputDir "Plan de $migrationWord - ReservaYa.docx"
New-Docx -Path $outputPath -Title "Plan de $migrationWord - ReservaYa" -Sections $sections

Write-Host "Documento generado en $outputPath"
