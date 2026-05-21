param(
    [string]$OutputDir = "docs/checklists"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Escape-XmlText {
    param([string]$Text)

    if ($null -eq $Text) {
        return ""
    }

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

function New-ChecklistTable {
    param([array]$Rows)

    $xml = @"
<w:tbl>
  <w:tblPr>
    <w:tblStyle w:val="TableGrid"/>
    <w:tblW w:w="0" w:type="auto"/>
  </w:tblPr>
"@

    $headers = @("OK", "Validacion", "Dato / comando esperado", "Observaciones")
    $xml += "<w:tr>"
    foreach ($header in $headers) {
        $xml += "<w:tc><w:tcPr><w:shd w:fill=`"D9EAF7`"/></w:tcPr>$(New-Paragraph -Text $header -Bold $true)</w:tc>"
    }
    $xml += "</w:tr>"

    foreach ($row in $Rows) {
        $xml += "<w:tr>"
        $xml += "<w:tc>$(New-Paragraph -Text "☐")</w:tc>"
        $xml += "<w:tc>$(New-Paragraph -Text $row[0])</w:tc>"
        $xml += "<w:tc>$(New-Paragraph -Text $row[1])</w:tc>"
        $xml += "<w:tc>$(New-Paragraph -Text '')</w:tc>"
        $xml += "</w:tr>"
    }

    $xml += "</w:tbl>"
    return $xml
}

function New-Docx {
    param(
        [string]$Path,
        [string]$Title,
        [array]$Sections
    )

    $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $tempDir "_rels") | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $tempDir "word") | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $tempDir "word/_rels") | Out-Null

    $contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>
'@

    $rels = @'
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
    <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="26"/></w:rPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr>
  </w:style>
</w:styles>
'@

    $body = New-Paragraph -Text $Title -Style "Title"
    $body += New-Paragraph -Text "Proyecto: ReservaYa | Stack: Laravel 11, React 18, PostgreSQL 16, Docker Compose"
    $body += New-Paragraph -Text "Fecha de elaboracion: 2026-05-17"

    foreach ($section in $Sections) {
        $body += New-Paragraph -Text $section.Title -Style "Heading1"
        if ($section.ContainsKey("Paragraphs")) {
            foreach ($paragraph in $section.Paragraphs) {
                $body += New-Paragraph -Text $paragraph
            }
        }
        if ($section.ContainsKey("Rows")) {
            $body += New-ChecklistTable -Rows $section.Rows
        }
    }

    $document = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    $body
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>
  </w:body>
</w:document>
"@

    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText((Join-Path $tempDir "[Content_Types].xml"), $contentTypes, $utf8)
    [System.IO.File]::WriteAllText((Join-Path $tempDir "_rels/.rels"), $rels, $utf8)
    [System.IO.File]::WriteAllText((Join-Path $tempDir "word/_rels/document.xml.rels"), $documentRels, $utf8)
    [System.IO.File]::WriteAllText((Join-Path $tempDir "word/styles.xml"), $styles, $utf8)
    [System.IO.File]::WriteAllText((Join-Path $tempDir "word/document.xml"), $document, $utf8)

    if (Test-Path $Path) {
        Remove-Item -LiteralPath $Path -Force
    }

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::Open($Path, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        $entries = @(
            @("[Content_Types].xml", (Join-Path $tempDir "[Content_Types].xml")),
            @("_rels/.rels", (Join-Path $tempDir "_rels/.rels")),
            @("word/document.xml", (Join-Path $tempDir "word/document.xml")),
            @("word/styles.xml", (Join-Path $tempDir "word/styles.xml")),
            @("word/_rels/document.xml.rels", (Join-Path $tempDir "word/_rels/document.xml.rels"))
        )

        foreach ($entry in $entries) {
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $entry[1], $entry[0]) | Out-Null
        }
    }
    finally {
        $zip.Dispose()
    }

    Remove-Item -LiteralPath $tempDir -Recurse -Force
}

$fullOutputDir = Join-Path (Get-Location) $OutputDir
New-Item -ItemType Directory -Path $fullOutputDir -Force | Out-Null

$preSections = @(
    @{
        Title = "1. Alcance previo"
        Paragraphs = @(
            "Checklist para preparar la migracion de base de datos de ReservaYa antes de ejecutar cambios en PostgreSQL.",
            "Entorno objetivo: servicio db con imagen postgres:16-alpine, base de datos reservaya, usuario reservaya y host interno db:5432."
        )
        Rows = @(
            @("Repositorio actualizado", "Confirmar rama correcta y sin cambios pendientes criticos antes de migrar."),
            @("Servicios Docker definidos", "docker-compose.yml contiene db, backend y frontend; backend depende del healthcheck de db."),
            @("Variables de conexion", "DB_CONNECTION=pgsql, DB_HOST=db, DB_PORT=5432, DB_DATABASE=reservaya, DB_USERNAME=reservaya."),
            @("Backup previo", "Generar respaldo con pg_dump antes de aplicar migraciones en ambientes con datos reales."),
            @("Mantenimiento comunicado", "Ventana aprobada y usuarios informados si el ambiente es productivo.")
        )
    },
    @{
        Title = "2. Esquema esperado"
        Rows = @(
            @("Tablas base", "users, password_reset_tokens, sessions, categories, restaurants, tables, reservations."),
            @("Tablas funcionales", "restaurant_photos, reviews, schedules, personal_access_tokens, menu_items."),
            @("Relaciones principales", "restaurants.category_id, restaurants.owner_id, tables.restaurant_id, reservations.user_id, reservations.restaurant_id, reservations.table_id."),
            @("Restricciones unicas", "users.email, categories.slug, reservations(table_id,start_time), reviews(restaurant_id,user_id), schedules(restaurant_id,day_of_week)."),
            @("Campos Google OAuth", "users.google_id nullable unique y users.password nullable."),
            @("Campos de pago", "reservations incluye payment_provider, payment_status, payment_amount, payment_currency, stripe_checkout_session_id, stripe_payment_intent_id, payment_paid_at, payment_intent_id, deposit_amount, deposit_refunded."),
            @("Indices de rendimiento", "reservations por user_id, restaurant_id, table_id, status, start_time y compuesto table_id/status/start_time; restaurants por owner_id, category_id, is_active, rating.")
        )
    },
    @{
        Title = "3. Datos semilla previstos"
        Rows = @(
            @("Usuarios demo", "admin@reservaya.app/admin123, owner@pizzeria.com/owner123, client@test.app/client123."),
            @("Categorias", "6 categorias: tipica, italiana, mar-fusion, parrilla, internacional, rapida."),
            @("Restaurantes", "12 restaurantes demo en Ibague con zona, coordenadas, rating y propietario."),
            @("Mesas", "28 mesas demo generadas desde plantillas Interior, Familiar, VIP y Terraza."),
            @("Menus", "60 items de menu si todos los restaurantes son creados por el seed."),
            @("Reservas", "30 reservas demo sin solapamiento por mesa y hora."),
            @("Resenas y horarios", "36 resenas demo y 84 horarios si todos los restaurantes son creados por el seed.")
        )
    },
    @{
        Title = "4. Validaciones antes de ejecutar"
        Rows = @(
            @("Dependencias backend", "composer install disponible dentro del contenedor backend."),
            @("Migraciones revisadas", "php artisan migrate:status no debe mostrar migraciones inesperadas."),
            @("Pruebas preparadas", "php artisan test usa SQLite en memoria segun backend/phpunit.xml."),
            @("Endpoints criticos identificados", "auth, restaurants, categories, reservations, owner/admin y pagos Stripe."),
            @("Rollback conocido", "Confirmar que cada migracion critica tiene down() y que el backup puede restaurarse.")
        )
    }
)

$postSections = @(
    @{
        Title = "1. Verificacion posterior"
        Paragraphs = @(
            "Checklist para validar la migracion despues de aplicar php artisan migrate --force y php artisan db:seed --force.",
            "Objetivo: confirmar estructura, datos demo, integridad funcional y rutas principales de ReservaYa."
        )
        Rows = @(
            @("Migraciones aplicadas", "php artisan migrate:status muestra todas las migraciones necesarias como Ran."),
            @("Seed ejecutado", "El seed termina sin errores o informa que ya fue aplicado anteriormente."),
            @("API saludable", "GET http://localhost:8000/api/health responde correctamente."),
            @("Frontend conectado", "VITE_API_URL apunta a http://localhost:8000/api en desarrollo."),
            @("Logs limpios", "docker-compose logs backend no muestra errores SQL, constraint violations ni exceptions de arranque.")
        )
    },
    @{
        Title = "2. Conteos esperados"
        Rows = @(
            @("users", "14 registros esperados tras seed inicial."),
            @("categories", "6 registros esperados."),
            @("restaurants", "12 registros esperados."),
            @("tables", "28 registros esperados."),
            @("menu_items", "60 registros esperados."),
            @("restaurant_photos", "24 registros esperados."),
            @("schedules", "84 registros esperados."),
            @("reviews", "36 registros esperados."),
            @("reservations", "30 registros esperados.")
        )
    },
    @{
        Title = "3. Integridad de datos"
        Rows = @(
            @("Usuarios y roles", "Roles permitidos: admin, owner, client; credenciales demo permiten iniciar sesion."),
            @("Restaurantes activos", "Cada restaurante tiene category_id valido, owner_id cuando aplica, zona y coordenadas."),
            @("Mesas por restaurante", "Cada mesa tiene restaurant_id valido, seats > 0, price >= 0 e is_active=true."),
            @("Reservas validas", "Cada reserva referencia usuario, restaurante y mesa existentes; status en pending, confirmed, cancelled o completed."),
            @("No solapamiento exacto", "La restriccion unique_table_time evita dos reservas con la misma mesa y start_time."),
            @("Pagos", "Campos Stripe existen y los indices stripe_checkout_session_id/stripe_payment_intent_id estan creados."),
            @("OAuth", "google_id existe en users, es nullable y unico.")
        )
    },
    @{
        Title = "4. Pruebas funcionales"
        Rows = @(
            @("Autenticacion", "Registro, login, /auth/me y logout funcionan con token."),
            @("Restaurantes", "Listado, filtros por categoria/zona/fecha/hora/personas y detalle responden."),
            @("Reservas", "Crear reserva, consultar mis reservas, ver detalle y cancelar funcionan con usuario autenticado."),
            @("Owner/Admin", "Dashboards de propietario y administrador cargan datos sin errores 500."),
            @("Pagos Stripe", "Checkout y callback/webhook usan los campos nuevos de reservations."),
            @("Pruebas automatizadas", "php artisan test y npm test/build ejecutan sin regresiones criticas.")
        )
    },
    @{
        Title = "5. Cierre"
        Rows = @(
            @("Evidencia guardada", "Registrar fecha, responsable, commit/branch, logs relevantes y resultado de pruebas."),
            @("Backup posterior", "Tomar backup posterior si el ambiente queda estable."),
            @("Monitoreo", "Revisar logs y metricas durante la primera ventana de uso posterior a la migracion."),
            @("Aprobacion", "Responsable tecnico y funcional aprueban el cierre de migracion.")
        )
    }
)

$migrationWord = "MIGRACI$([char]0x00D3)N"
New-Docx -Path (Join-Path $fullOutputDir "Lista de Chequeo - PRE-$migrationWord - DB.docx") -Title "Lista de Chequeo - PRE-$migrationWord - DB" -Sections $preSections
New-Docx -Path (Join-Path $fullOutputDir "Lista de Chequeo - POST - $migrationWord - DB.docx") -Title "Lista de Chequeo - POST - $migrationWord - DB" -Sections $postSections

Write-Host "Documentos generados en $fullOutputDir"
