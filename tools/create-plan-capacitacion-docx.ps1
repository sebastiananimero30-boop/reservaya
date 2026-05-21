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
    $body += New-Paragraph -Text "Proyecto: ReservaYa | Plataforma de reservas de restaurantes"
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
        Title = "1. Objetivo general"
        Paragraphs = @(
            "Definir las actividades de capacitacion necesarias para que usuarios finales, propietarios, administradores y equipo tecnico adopten correctamente la plataforma ReservaYa.",
            "La capacitacion busca reducir errores operativos, asegurar el uso correcto de reservas y pagos, y preparar al equipo para soporte, mantenimiento y continuidad del servicio."
        )
    },
    @{
        Title = "2. Alcance"
        Bullets = @(
            "Usuarios clientes: busqueda de restaurantes, registro, inicio de sesion, creacion y cancelacion de reservas.",
            "Propietarios: administracion de menus, revision de reservas, validacion de codigos y consulta de estadisticas.",
            "Administradores: gestion de propietarios, restaurantes, asignaciones, categorias y metricas globales.",
            "Equipo tecnico: instalacion, despliegue, base de datos, pruebas, monitoreo, backups y rollback."
        )
    },
    @{
        Title = "3. Publico objetivo y requisitos"
        Table = @{
            Headers = @("Grupo", "Perfil", "Requisito previo", "Credencial demo")
            Rows = @(
                @("Clientes", "Personas que reservan restaurantes desde la web.", "Conocer navegacion basica en navegador.", "client@test.app / client123"),
                @("Propietarios", "Responsables de restaurantes asignados.", "Tener cuenta con rol owner y restaurante asociado.", "owner@pizzeria.com / owner123"),
                @("Administradores", "Equipo encargado de parametrizar la plataforma.", "Tener cuenta con rol admin.", "admin@reservaya.app / admin123"),
                @("Equipo tecnico", "Desarrollo, soporte o DevOps.", "Conocer Docker, Laravel, React y PostgreSQL.", "Acceso al repositorio y entorno local")
            )
        }
    },
    @{
        Title = "4. Cronograma sugerido"
        Table = @{
            Headers = @("Sesion", "Duracion", "Audiencia", "Contenido", "Resultado esperado")
            Rows = @(
                @("1. Induccion general", "45 min", "Todos", "Objetivo de ReservaYa, roles, flujo completo y normas de uso.", "Participantes entienden el proceso de reserva de punta a punta."),
                @("2. Uso cliente", "60 min", "Clientes / QA", "Registro, login, filtros, detalle de restaurante, reserva, pagos y cancelacion.", "Usuario crea y gestiona reservas sin asistencia."),
                @("3. Operacion propietario", "90 min", "Propietarios", "Panel propietario, menus, reservas, codigo RYA, estados y estadisticas.", "Propietario opera su restaurante diariamente."),
                @("4. Administracion", "90 min", "Administradores", "Propietarios, restaurantes, asignacion, portada, categorias y metricas.", "Admin parametriza la plataforma y resuelve solicitudes comunes."),
                @("5. Soporte tecnico", "120 min", "Equipo tecnico", "Docker, variables, migraciones, seeders, pruebas, logs, backups y rollback.", "Equipo puede instalar, diagnosticar y recuperar el servicio."),
                @("6. Evaluacion y cierre", "45 min", "Todos", "Ejercicios practicos, dudas, checklist y acta de asistencia.", "Capacitacion aprobada y pendientes documentados.")
            )
        }
    },
    @{
        Title = "5. Temario por modulo"
        Bullets = @(
            "Modulo cliente: navegacion en /, /restaurantes/:id, /registro, /login, /mis-reservas y /perfil.",
            "Modulo reservas: seleccion de mesa, fecha, hora, numero de personas, notas, estados pending/confirmed/cancelled/completed.",
            "Modulo pagos: flujo Stripe, pago pendiente, pago confirmado y consulta de estado desde Mis reservas.",
            "Modulo propietario: rutas /propietario y endpoints /api/owner para menus, reservas, escaneo y estadisticas.",
            "Modulo administrador: ruta /admin y endpoints /api/admin para usuarios owner, restaurantes y reportes.",
            "Modulo tecnico: docker-compose, backend Laravel, frontend Vite, PostgreSQL, php artisan migrate, php artisan db:seed y pruebas."
        )
    },
    @{
        Title = "6. Metodologia"
        Bullets = @(
            "Demostracion guiada con el ambiente local en http://localhost:3000.",
            "Practica individual con credenciales demo por rol.",
            "Ejercicios por escenario: crear reserva, cancelarla, cambiar estado, crear propietario y asignar restaurante.",
            "Revision de errores frecuentes y forma correcta de reportarlos.",
            "Cierre con preguntas, evaluacion corta y registro de asistencia."
        )
    },
    @{
        Title = "7. Recursos necesarios"
        Table = @{
            Headers = @("Recurso", "Detalle", "Responsable")
            Rows = @(
                @("Ambiente de practica", "ReservaYa levantado con docker-compose up -d.", "Equipo tecnico"),
                @("Navegador", "Chrome, Edge o Firefox actualizado.", "Participante"),
                @("Credenciales demo", "client@test.app, owner@pizzeria.com y admin@reservaya.app.", "Instructor"),
                @("Manuales", "Manual de Usuario, Manual Administrador y Propietario, Manual Tecnico.", "Instructor"),
                @("Datos semilla", "Categorias, restaurantes, mesas, menus, reservas y reseñas creadas con db:seed.", "Equipo tecnico")
            )
        }
    },
    @{
        Title = "8. Evaluacion"
        Table = @{
            Headers = @("Rol", "Ejercicio", "Criterio de aprobacion")
            Rows = @(
                @("Cliente", "Registrarse, iniciar sesion, filtrar restaurante, crear reserva y cancelarla.", "Completa el flujo sin errores criticos."),
                @("Propietario", "Crear/editar plato, consultar reserva, validar codigo y cambiar estado.", "Gestiona operacion diaria correctamente."),
                @("Administrador", "Crear owner, crear restaurante y asignarlo.", "Parametriza datos principales sin inconsistencias."),
                @("Tecnico", "Levantar entorno, revisar logs, ejecutar pruebas y explicar rollback.", "Diagnostica y recupera el servicio en escenario controlado.")
            )
        }
    },
    @{
        Title = "9. Indicadores de exito"
        Bullets = @(
            "Al menos 90% de participantes aprueban los ejercicios practicos.",
            "Los usuarios identifican su rol y las funciones que les corresponden.",
            "Los propietarios pueden operar reservas y menus sin asistencia tecnica.",
            "Los administradores pueden crear y asignar restaurantes correctamente.",
            "El equipo tecnico puede ejecutar instalacion, pruebas, backup y rollback documentado."
        )
    },
    @{
        Title = "10. Plan de soporte posterior"
        Bullets = @(
            "Primer nivel: resolver dudas de uso con los manuales y checklist de capacitacion.",
            "Segundo nivel: revisar errores de datos, roles, asignaciones o estados de reserva.",
            "Tercer nivel: equipo tecnico revisa logs, API, base de datos, integraciones Google/Stripe y despliegue.",
            "Registrar cada incidencia con fecha, usuario, rol, descripcion, evidencia y solucion aplicada."
        )
    }
)

$fullOutputDir = Join-Path (Get-Location) $OutputDir
New-Item -ItemType Directory -Path $fullOutputDir -Force | Out-Null

$outputPath = Join-Path $fullOutputDir "Plan de Capacitacion - ReservaYa.docx"
New-Docx -Path $outputPath -Title "Plan de Capacitacion - ReservaYa" -Sections $sections

Write-Host "Documento generado en $outputPath"
