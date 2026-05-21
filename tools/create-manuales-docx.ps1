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
    return "<w:p><w:pPr><w:pStyle w:val=`"ListParagraph`"/><w:ind w:left=`"720`" w:hanging=`"360`"/></w:pPr><w:r><w:t xml:space=`"preserve`">• $escaped</w:t></w:r></w:p>"
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

$fullOutputDir = Join-Path (Get-Location) $OutputDir
New-Item -ItemType Directory -Path $fullOutputDir -Force | Out-Null

$manualUsuario = @(
    @{
        Title = "1. Objetivo"
        Paragraphs = @("Este manual explica el uso de ReservaYa para clientes que desean consultar restaurantes, registrarse, iniciar sesion y gestionar reservas.")
    },
    @{
        Title = "2. Acceso al sistema"
        Bullets = @(
            "URL de desarrollo: http://localhost:3000.",
            "API de referencia: http://localhost:8000/api/health.",
            "Credencial demo cliente: client@test.app / client123.",
            "Tambien se puede usar el acceso con Google cuando VITE_GOOGLE_CLIENT_ID y las credenciales OAuth esten configuradas."
        )
    },
    @{
        Title = "3. Funciones principales"
        Table = @{
            Headers = @("Modulo", "Ruta", "Accion del usuario", "Resultado esperado")
            Rows = @(
                @("Inicio", "/", "Consultar restaurantes y aplicar filtros por categoria, zona, fecha, hora y numero de personas.", "Listado actualizado de restaurantes disponibles."),
                @("Detalle", "/restaurantes/:id", "Revisar informacion del restaurante, fotos, ubicacion, menu, reseñas y disponibilidad.", "Informacion completa del restaurante seleccionado."),
                @("Registro", "/registro", "Crear cuenta de cliente con nombre, email y clave.", "Usuario autenticado con rol client."),
                @("Login", "/login", "Iniciar sesion con email/clave o Google.", "Token guardado y acceso a funciones privadas."),
                @("Reservar", "/restaurantes/:id", "Seleccionar fecha, hora, mesa, numero de personas y notas.", "Reserva creada; si aplica Stripe, se muestra checkout."),
                @("Mis reservas", "/mis-reservas", "Ver reservas propias, estado, pago y opcion de cancelar.", "Historial actualizado del cliente."),
                @("Perfil", "/perfil", "Consultar datos de cuenta y resumen de actividad.", "Informacion del usuario y sus reservas.")
            )
        }
    },
    @{
        Title = "4. Estados de reserva y pago"
        Bullets = @(
            "Estados de reserva: pending, confirmed, cancelled y completed.",
            "Una reserva cancelada no debe presentarse como disponible para completar.",
            "Estados de pago normalizados en frontend: pagado, pendiente o sin pago requerido.",
            "Cuando Stripe confirma el pago, la reserva puede pasar de pendiente a confirmada."
        )
    },
    @{
        Title = "5. Recomendaciones de uso"
        Bullets = @(
            "Verificar fecha, hora y numero de personas antes de confirmar.",
            "Cancelar desde Mis reservas si el usuario no asistira.",
            "Conservar el codigo de reserva cuando el restaurante solicite validacion.",
            "Si el pago queda pendiente, volver a la reserva y continuar el checkout cuando este disponible."
        )
    }
)

$manualAdminOwner = @(
    @{
        Title = "1. Objetivo"
        Paragraphs = @("Este manual cubre las tareas de administradores y propietarios dentro de ReservaYa. Los accesos dependen del rol del usuario autenticado.")
    },
    @{
        Title = "2. Credenciales demo"
        Table = @{
            Headers = @("Rol", "Email", "Password", "Acceso")
            Rows = @(
                @("Administrador", "admin@reservaya.app", "admin123", "/admin"),
                @("Propietario", "owner@pizzeria.com", "owner123", "/propietario")
            )
        }
    },
    @{
        Title = "3. Administrador"
        Bullets = @(
            "Gestionar propietarios: listar, crear y eliminar cuentas con rol owner.",
            "Gestionar restaurantes: crear, editar, asignar propietario y actualizar imagen de portada.",
            "Consultar categorias disponibles para clasificar restaurantes.",
            "Revisar estadisticas globales: propietarios, clientes, restaurantes, reservas y distribucion por estado.",
            "Validar que un restaurante tenga owner_id correcto antes de delegar operacion al propietario."
        )
    },
    @{
        Title = "4. Propietario"
        Bullets = @(
            "Consultar restaurantes asignados al usuario con rol owner.",
            "Administrar menu del restaurante: crear, editar y eliminar platos.",
            "Ver reservas por restaurante y filtrar por estado.",
            "Escanear o ingresar codigo de reserva con formato RYA-000001 para validar asistencia.",
            "Actualizar estado de reserva a pending, confirmed, cancelled o completed segun corresponda.",
            "Consultar estadisticas del restaurante: reservas, ingresos estimados, horas y dias de mayor demanda."
        )
    },
    @{
        Title = "5. Reglas de seguridad"
        Bullets = @(
            "Solo el administrador puede crear propietarios y administrar restaurantes globalmente.",
            "Un propietario solo puede modificar restaurantes donde restaurant.owner_id coincide con su usuario.",
            "Los endpoints privados requieren token Sanctum.",
            "Los cambios de pago o reembolso deben ser ejecutados por admin o por propietario del restaurante asociado."
        )
    },
    @{
        Title = "6. Checklist operativo"
        Table = @{
            Headers = @("Tarea", "Frecuencia", "Responsable", "Evidencia")
            Rows = @(
                @("Revisar reservas del dia", "Diaria", "Propietario", "Listado en panel propietario."),
                @("Actualizar disponibilidad del menu", "Diaria o semanal", "Propietario", "Menu sin platos agotados."),
                @("Crear propietarios nuevos", "Segun necesidad", "Administrador", "Cuenta owner creada y comunicada."),
                @("Asignar restaurantes", "Segun necesidad", "Administrador", "owner_id asignado correctamente."),
                @("Revisar metricas", "Semanal", "Administrador/Propietario", "Panel de estadisticas consultado.")
            )
        }
    }
)

$manualTecnico = @(
    @{
        Title = "1. Objetivo"
        Paragraphs = @("Este manual describe instalacion, configuracion, arquitectura, base de datos, pruebas y despliegue tecnico de ReservaYa.")
    },
    @{
        Title = "2. Arquitectura"
        Bullets = @(
            "Frontend: React 18, Vite, Tailwind CSS, React Query, React Router, Axios y Lucide React.",
            "Backend: Laravel 11, Sanctum, Eloquent ORM, recursos JSON y controladores API.",
            "Base de datos: PostgreSQL 16 en Docker; SQLite en memoria para pruebas PHPUnit.",
            "Servicios Docker dev: db, backend y frontend definidos en docker-compose.yml.",
            "Servicios Docker prod: reservaya_db_prod, reservaya_backend_prod y reservaya_frontend_prod."
        )
    },
    @{
        Title = "3. Instalacion rapida"
        Table = @{
            Headers = @("Ambiente", "Comando", "Resultado")
            Rows = @(
                @("Windows", "start.bat", "Levanta la aplicacion completa."),
                @("Linux/Mac", "chmod +x start.sh && ./start.sh", "Levanta la aplicacion completa."),
                @("Docker manual", "docker-compose up -d", "Servicios disponibles en frontend :3000 y API :8000."),
                @("Produccion", "docker-compose -f docker-compose.prod.yml up -d", "Servicios productivos con variables .env reales.")
            )
        }
    },
    @{
        Title = "4. Variables y servicios"
        Bullets = @(
            "Backend dev: APP_ENV=local, APP_DEBUG=true, APP_URL=http://localhost:8000.",
            "DB dev: DB_CONNECTION=pgsql, DB_HOST=db, DB_PORT=5432, DB_DATABASE=reservaya, DB_USERNAME=reservaya.",
            "Frontend dev: VITE_API_URL=http://localhost:8000/api.",
            "Google OAuth requiere VITE_GOOGLE_CLIENT_ID y configuracion en backend/config/services.php.",
            "Stripe requiere llaves en servicios Laravel y webhook POST /api/payments/stripe/webhook."
        )
    },
    @{
        Title = "5. Base de datos"
        Bullets = @(
            "Tablas base: users, categories, restaurants, tables, reservations, restaurant_photos, reviews, schedules, personal_access_tokens y menu_items.",
            "Campos adicionales: google_id en users; campos Stripe, payment_intent_id, deposit_amount y deposit_refunded en reservations.",
            "Indices relevantes: reservas por usuario, restaurante, mesa, estado, fecha y compuesto para anti-solapamiento.",
            "Seeder principal: backend/database/seeders/DatabaseSeeder.php crea usuarios demo, categorias, restaurantes, mesas, menus, reseñas y reservas."
        )
    },
    @{
        Title = "6. Endpoints principales"
        Table = @{
            Headers = @("Metodo", "Ruta", "Auth", "Uso")
            Rows = @(
                @("POST", "/api/auth/register", "No", "Registro de cliente."),
                @("POST", "/api/auth/login", "No", "Inicio de sesion."),
                @("GET", "/api/restaurants", "No", "Listado y filtros."),
                @("GET", "/api/restaurants/{id}", "No", "Detalle del restaurante."),
                @("POST", "/api/reservations", "Si", "Crear reserva."),
                @("GET", "/api/my/reservations", "Si", "Reservas del usuario."),
                @("GET/POST/PATCH/DELETE", "/api/owner/*", "Si owner", "Gestion de propietario."),
                @("GET/POST/PATCH/DELETE", "/api/admin/*", "Si admin", "Gestion administrativa.")
            )
        }
    },
    @{
        Title = "7. Pruebas y mantenimiento"
        Bullets = @(
            "Backend: php artisan test usa SQLite en memoria segun backend/phpunit.xml.",
            "Frontend: npm test ejecuta pruebas con Vitest y Testing Library.",
            "Build frontend: npm run build.",
            "Logs dev: docker-compose logs -f backend frontend.",
            "Reset DB dev: docker-compose down -v y luego docker-compose up -d.",
            "Rollback documentado en docs/checklists/procedimiento_rollback.xlsx."
        )
    }
)

New-Docx -Path (Join-Path $fullOutputDir "Manual de Usuario - ReservaYa.docx") -Title "Manual de Usuario - ReservaYa" -Sections $manualUsuario
New-Docx -Path (Join-Path $fullOutputDir "Manual Administrador y Propietario - ReservaYa.docx") -Title "Manual Administrador y Propietario - ReservaYa" -Sections $manualAdminOwner
New-Docx -Path (Join-Path $fullOutputDir "Manual Tecnico - ReservaYa.docx") -Title "Manual Tecnico - ReservaYa" -Sections $manualTecnico

Write-Host "Manuales generados en $fullOutputDir"
