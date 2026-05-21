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

function Get-CellRef {
    param(
        [int]$Column,
        [int]$Row
    )

    $name = ""
    while ($Column -gt 0) {
        $mod = ($Column - 1) % 26
        $name = [char](65 + $mod) + $name
        $Column = [math]::Floor(($Column - $mod) / 26)
    }

    return "$name$Row"
}

function New-CellXml {
    param(
        [int]$Column,
        [int]$Row,
        [string]$Value,
        [int]$Style = 0
    )

    $cellRef = Get-CellRef -Column $Column -Row $Row
    $escaped = Escape-XmlText $Value
    return "<c r=`"$cellRef`" t=`"inlineStr`" s=`"$Style`"><is><t xml:space=`"preserve`">$escaped</t></is></c>"
}

function New-RowXml {
    param(
        [int]$RowNumber,
        [array]$Values,
        [int]$Style = 0
    )

    $xml = "<row r=`"$RowNumber`">"
    for ($i = 0; $i -lt $Values.Count; $i++) {
        $xml += New-CellXml -Column ($i + 1) -Row $RowNumber -Value $Values[$i] -Style $Style
    }
    $xml += "</row>"
    return $xml
}

function Add-XlsxEntry {
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

function New-Xlsx {
    param(
        [string]$Path,
        [array]$Rows
    )

    if (Test-Path $Path) {
        Remove-Item -LiteralPath $Path -Force
    }

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    $sheetData = ""
    for ($r = 0; $r -lt $Rows.Count; $r++) {
        $style = if ($r -eq 0) { 1 } elseif ($r -eq 3) { 2 } else { 0 }
        $sheetData += New-RowXml -RowNumber ($r + 1) -Values $Rows[$r] -Style $style
    }

    $contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
'@

    $rootRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
'@

    $workbook = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="procedimiento_rollback" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>
'@

    $workbookRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
'@

    $styles = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF5B9BD5"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
  </cellXfs>
</styleSheet>
'@

    $worksheet = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>
    <col min="1" max="1" width="10" customWidth="1"/>
    <col min="2" max="2" width="22" customWidth="1"/>
    <col min="3" max="3" width="48" customWidth="1"/>
    <col min="4" max="4" width="55" customWidth="1"/>
    <col min="5" max="5" width="32" customWidth="1"/>
    <col min="6" max="6" width="22" customWidth="1"/>
    <col min="7" max="7" width="30" customWidth="1"/>
  </cols>
  <sheetData>$sheetData</sheetData>
  <autoFilter ref="A4:G18"/>
</worksheet>
"@

    $core = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>procedimiento_rollback</dc:title>
  <dc:subject>Rollback de base de datos ReservaYa</dc:subject>
  <dc:creator>Codex</dc:creator>
</cp:coreProperties>
'@

    $app = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Excel</Application>
</Properties>
'@

    $zip = [System.IO.Compression.ZipFile]::Open($Path, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        Add-XlsxEntry -Zip $zip -EntryName "[Content_Types].xml" -Content $contentTypes
        Add-XlsxEntry -Zip $zip -EntryName "_rels/.rels" -Content $rootRels
        Add-XlsxEntry -Zip $zip -EntryName "xl/workbook.xml" -Content $workbook
        Add-XlsxEntry -Zip $zip -EntryName "xl/_rels/workbook.xml.rels" -Content $workbookRels
        Add-XlsxEntry -Zip $zip -EntryName "xl/styles.xml" -Content $styles
        Add-XlsxEntry -Zip $zip -EntryName "xl/worksheets/sheet1.xml" -Content $worksheet
        Add-XlsxEntry -Zip $zip -EntryName "docProps/core.xml" -Content $core
        Add-XlsxEntry -Zip $zip -EntryName "docProps/app.xml" -Content $app
    }
    finally {
        $zip.Dispose()
    }
}

$fullOutputDir = Join-Path (Get-Location) $OutputDir
New-Item -ItemType Directory -Path $fullOutputDir -Force | Out-Null

$rows = @(
    @("procedimiento_rollback", "Proyecto ReservaYa", "Stack: Laravel 11 + PostgreSQL 16 + Docker Compose", "Fecha elaboracion: 2026-05-17", "", "", ""),
    @("Objetivo", "Restaurar el servicio y la base de datos a un estado estable si la migracion falla o genera regresiones criticas.", "", "", "", "", ""),
    @("Alcance", "Aplica a migraciones Laravel, seeders, datos de PostgreSQL, contenedores Docker y validacion funcional posterior.", "", "", "", "", ""),
    @("Paso", "Fase", "Actividad", "Comando / evidencia", "Criterio de exito", "Responsable", "Observaciones"),
    @("1", "Activacion", "Declarar incidente de migracion y pausar nuevos despliegues.", "Registrar hora, ambiente, commit/branch y sintomas.", "Equipo alineado y cambios congelados.", "Lider tecnico", ""),
    @("2", "Diagnostico", "Revisar logs de backend y base de datos para confirmar causa.", "docker-compose -f docker-compose.prod.yml logs --tail=200 backend db", "Error identificado: SQL, constraint, migracion, seed o arranque.", "Backend/DevOps", ""),
    @("3", "Proteccion", "Tomar respaldo del estado fallido antes de revertir para analisis forense.", "docker exec reservaya_db_prod pg_dump -U reservaya reservaya > backup_fallido.sql", "Archivo de respaldo generado y almacenado.", "DBA/DevOps", ""),
    @("4", "Restauracion preferida", "Restaurar backup previo a la migracion si hubo cambios de datos o riesgo de perdida.", "docker exec -i reservaya_db_prod psql -U reservaya -d reservaya < backup_pre_migracion.sql", "Base restaurada al punto aprobado.", "DBA/DevOps", ""),
    @("5", "Rollback alterno", "Si no hubo cambios de datos relevantes, revertir el ultimo lote de migraciones Laravel.", "docker exec reservaya_backend_prod php artisan migrate:rollback --step=1 --force", "php artisan migrate:status muestra la migracion revertida.", "Backend", ""),
    @("6", "Migraciones criticas", "Validar rollback de campos Google, Stripe, depositos e indices de rendimiento si pertenecen al lote fallido.", "Migraciones: add_google_id_to_users, add_stripe_payment_fields, add_payment_fields, add_performance_indexes.", "Columnas/indices quedan consistentes con el codigo desplegado.", "Backend/DBA", ""),
    @("7", "Codigo", "Revertir aplicacion al release estable si el codigo nuevo depende del esquema fallido.", "git checkout/tag estable o redeploy del artefacto anterior.", "Backend y frontend arrancan con version compatible.", "DevOps", ""),
    @("8", "Contenedores", "Reiniciar servicios para limpiar cache de configuracion y conexiones.", "docker-compose -f docker-compose.prod.yml up -d --build backend frontend", "Contenedores healthy y sin reinicios continuos.", "DevOps", ""),
    @("9", "Cache Laravel", "Limpiar y reconstruir cache de Laravel cuando cambian variables o codigo.", "docker exec reservaya_backend_prod php artisan config:clear && php artisan route:clear && php artisan config:cache", "No hay errores de cache/configuracion.", "Backend", ""),
    @("10", "Validacion DB", "Verificar tablas principales y conteos minimos esperados.", "users, categories, restaurants, tables, reservations, menu_items, reviews, schedules.", "Tablas consultables y relaciones sin errores.", "DBA/Backend", ""),
    @("11", "Validacion API", "Probar endpoints criticos.", "GET /api/health, POST /api/auth/login, GET /api/restaurants, GET /api/categories, GET /api/my/reservations.", "Respuestas 2xx/401 esperadas, sin 500.", "QA/Backend", ""),
    @("12", "Validacion frontend", "Confirmar que VITE_API_URL apunta al backend estable y que flujos principales cargan.", "Login, listado restaurantes, detalle, crear/cancelar reserva, panel owner/admin.", "Flujos principales operativos.", "QA/Frontend", ""),
    @("13", "Pagos", "Si hubo impacto en pagos, validar que reservas existentes conservan estado y referencias Stripe.", "Revisar payment_status, stripe_checkout_session_id, stripe_payment_intent_id, payment_paid_at.", "No hay cobros/reservas inconsistentes.", "Backend/Negocio", ""),
    @("14", "Comunicacion", "Informar resultado del rollback y estado del servicio.", "Mensaje a stakeholders con causa, accion tomada, hora de recuperacion y riesgos residuales.", "Servicio liberado o plan de contingencia activo.", "Lider tecnico", ""),
    @("15", "Cierre", "Documentar lecciones aprendidas y crear tareas de correccion.", "Adjuntar logs, backups, commit estable, pruebas ejecutadas y responsables.", "Incidente cerrado con acciones preventivas.", "Equipo tecnico", "")
)

$outputPath = Join-Path $fullOutputDir "procedimiento_rollback.xlsx"
New-Xlsx -Path $outputPath -Rows $rows

Write-Host "Archivo generado en $outputPath"
