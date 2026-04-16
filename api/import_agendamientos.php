<?php
/**
 * import_agendamientos.php
 * API para importar agendamientos desde Excel
 * - Procesa el archivo Excel
 * - Cruza RUT con tbl_dotacion para obtener supervisor
 * - Inserta en tbl_agendamientos
 * - Retorna resumen de importación
 */

header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

// Validar que sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Validar que exista archivo
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No se recibió archivo válido']);
    exit;
}

// Validar extensión
$filename = $_FILES['file']['name'];
$ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
if ($ext !== 'xlsx' && $ext !== 'xls') {
    http_response_code(400);
    echo json_encode(['error' => 'El archivo debe ser Excel (.xlsx o .xls)']);
    exit;
}

try {
    // Cargar librería de Excel
    require_once __DIR__ . '/../vendor/autoload.php';
    
    $pdo = Database::conectar();
    $tmpFile = $_FILES['file']['tmp_name'];
    
    // Leer Excel
    $reader = new \PhpOffice\PhpSpreadsheet\Reader\Xlsx();
    $spreadsheet = $reader->load($tmpFile);
    $sheet = $spreadsheet->getActiveSheet();
    $rows = $sheet->toArray();
    
    if (count($rows) < 2) {
        echo json_encode(['error' => 'El archivo está vacío o no tiene datos']);
        exit;
    }

    // Mapeo de columnas (según el Excel)
    $headers = array_map('trim', $rows[0]);
    $colMap = [];
    foreach ($headers as $idx => $header) {
        $colMap[strtoupper(trim($header))] = $idx;
    }

    // Validar columnas críticas
    $requiredCols = ['ID AGENDAMIENTO', 'FECHA CREACION', 'FECHA AGENDAMIENTO', 'RUT CLIENTE', 'NOMBRE CONTACTO', 'ESTADO'];
    foreach ($requiredCols as $col) {
        if (!isset($colMap[strtoupper($col)])) {
            echo json_encode(['error' => "Columna requerida no encontrada: $col"]);
            exit;
        }
    }

    // Preparar statement de inserción
    $stmt = $pdo->prepare("
        INSERT INTO tbl_agendamientos (
            id_agendamiento, fecha_creacion, hora_creacion, fecha_agendamiento,
            rut_cliente, dv_cliente, nombre_contacto, email,
            telefono_contacto, telefono_movil, servicio, tipo,
            desbloqueo_tarjetas, reseteo_tarjetas, observaciones, estado,
            id_usuario, supervisor, usuario_crea, usuario_callback,
            comentario_callback, fecha_cierre_callback, tipo_pac,
            tarjeta_credito_pac, cuenta_cargo_pac, tipo_bloqueo_tc,
            tipo_canal_tc, tipo_reseteo_atm, modalidad_reseteo_atm,
            numero_tarjeta_bloqueo, numero_operacion, numero_cuenta,
            rut_titular_seguro, numero_atencion_denuncio, tipo_problema_seguro,
            fecha_envio_documentacion, medio_envio_documentacion, documentos_enviados
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            estado = VALUES(estado),
            observaciones = VALUES(observaciones),
            comentario_callback = VALUES(comentario_callback),
            timestamp_actualizacion = CURRENT_TIMESTAMP
    ");

    $inserted = 0;
    $updated = 0;
    $errors = [];

    // Procesar cada fila
    for ($i = 1; $i < count($rows); $i++) {
        $row = $rows[$i];
        
        // Obtener valores
        $idAgend = _getCell($row, $colMap, 'ID AGENDAMIENTO');
        $fechaCreacion = _getCell($row, $colMap, 'FECHA CREACION');
        $horaCreacion = _getCell($row, $colMap, 'HORA CREACION');
        $fechaAgend = _getCell($row, $colMap, 'FECHA AGENDAMIENTO');
        $rutCliente = _getCell($row, $colMap, 'RUT CLIENTE');
        $dvCliente = _getCell($row, $colMap, 'DV CLIENTE');
        $nombreContacto = _getCell($row, $colMap, 'NOMBRE CONTACTO');
        $email = _getCell($row, $colMap, 'EMAIL');
        $telContacto = _getCell($row, $colMap, 'TELEFONO CONTACTO');
        $telMovil = _getCell($row, $colMap, 'TELEFONO MOVIL');
        $servicio = _getCell($row, $colMap, 'SERVICIO');
        $tipo = _getCell($row, $colMap, 'TIPO');
        $desbloqueo = _getCell($row, $colMap, 'DESBLOQUEO TARJETAS PRODUCTO');
        $reseteo = _getCell($row, $colMap, 'RESETEO TARJETAS PRODUCTO');
        $observaciones = _getCell($row, $colMap, 'OBSERVACIONES');
        $estado = strtoupper(trim(_getCell($row, $colMap, 'ESTADO') ?? ''));
        $idUsuario = _getCell($row, $colMap, 'ID USUARIO');
        $usuarioCrea = _getCell($row, $colMap, 'USUARIO CREA');
        $usuarioCallback = _getCell($row, $colMap, 'USUARIO CALLBACK');
        $comentarioCallback = _getCell($row, $colMap, 'COMENTARIO CALLBACK');
        $fechaCierre = _getCell($row, $colMap, 'FECHA DE CIERRE AGENDAMIENTO CALLBACK');
        $tipoPac = _getCell($row, $colMap, 'TIPO PAC');
        $tarjetaPac = _getCell($row, $colMap, 'TARJETA CREDITO PAC');
        $cuentaPac = _getCell($row, $colMap, 'CUENTA CARGO PAC');
        $tipoBloqueo = _getCell($row, $colMap, 'TIPO BLOQUEO TC');
        $tipoCanal = _getCell($row, $colMap, 'TIPO CANAL TC');
        $tipoReseteo = _getCell($row, $colMap, 'TIPO RESETEO ATM');
        $modalidadReseteo = _getCell($row, $colMap, 'MODALIDAD RESETEO ATM');
        $numTarjeta = _getCell($row, $colMap, 'N° TARJETA BLOQUEO TCR');
        $numOperacion = _getCell($row, $colMap, 'N° OPERACION');
        $numCuenta = _getCell($row, $colMap, 'N° CUENTA');
        $rutTitular = _getCell($row, $colMap, 'RUT TITULAR SEGURO');
        $numAtencion = _getCell($row, $colMap, 'N° ATENCION DENUNCIO');
        $tipoProblema = _getCell($row, $colMap, 'TIPO PROBLEMA SEGURO');
        $fechaEnvio = _getCell($row, $colMap, 'FECHA ENVIO DOCUMENTACION');
        $medioEnvio = _getCell($row, $colMap, 'MEDIO ENVIO DOCUMENTACION');
        $docsEnviados = _getCell($row, $colMap, 'DOCUMENTOS ENVIADOS');

        // Validar datos críticos
        if (!$idAgend || !$rutCliente) {
            $errors[] = "Fila " . ($i + 1) . ": Faltan ID Agendamiento o RUT Cliente";
            continue;
        }

        // Normalizar RUT (quitar puntos y guiones)
        $rutNorm = preg_replace('/[^0-9kK]/', '', $rutCliente);

        // Buscar supervisor por RUT en tbl_dotacion
        $stmtSup = $pdo->prepare("
            SELECT DISTINCT supervisor_asignado FROM tbl_dotacion
            WHERE rut = ? OR REPLACE(rut, '.', '') = ? OR REPLACE(rut, '-', '') = ?
            LIMIT 1
        ");
        $stmtSup->execute([$rutCliente, $rutNorm, $rutNorm]);
        $supervisor = $stmtSup->fetchColumn() ?: null;

        // Validar estado
        if (!in_array($estado, ['RECHAZADO', 'EJECUTADO', 'EJECUTADOCONLLAMADO'])) {
            $estado = 'RECHAZADO'; // Default
        }

        // Convertir fechas a formato SQL
        $fechaCreacion = _formatDate($fechaCreacion);
        $fechaAgend = _formatDate($fechaAgend);
        $fechaCierre = _formatDateTime($fechaCierre);
        $fechaEnvio = _formatDateTime($fechaEnvio);

        try {
            $stmt->execute([
                $idAgend, $fechaCreacion, $horaCreacion, $fechaAgend,
                $rutNorm, $dvCliente, $nombreContacto, $email,
                $telContacto, $telMovil, $servicio, $tipo,
                $desbloqueo, $reseteo, $observaciones, $estado,
                $idUsuario, $supervisor, $usuarioCrea, $usuarioCallback,
                $comentarioCallback, $fechaCierre, $tipoPac,
                $tarjetaPac, $cuentaPac, $tipoBloqueo,
                $tipoCanal, $tipoReseteo, $modalidadReseteo,
                $numTarjeta, $numOperacion, $numCuenta,
                $rutTitular, $numAtencion, $tipoProblema,
                $fechaEnvio, $medioEnvio, $docsEnviados
            ]);

            // Verificar si fue INSERT o UPDATE
            if ($stmt->rowCount() > 0) {
                // Comprobar si es INSERT o UPDATE (simple heurística)
                $inserted++;
            }
        } catch (PDOException $e) {
            $errors[] = "Fila " . ($i + 1) . ": " . $e->getMessage();
        }
    }

    echo json_encode([
        'success' => true,
        'mensaje' => "Importación completada",
        'registros_procesados' => count($rows) - 1,
        'registros_insertados' => $inserted,
        'errores' => $errors,
        'total_errores' => count($errors)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function _getCell($row, $colMap, $colName) {
    $key = strtoupper(trim($colName));
    if (!isset($colMap[$key])) return null;
    $idx = $colMap[$key];
    return isset($row[$idx]) ? trim($row[$idx] ?? '') : null;
}

function _formatDate($dateStr) {
    if (!$dateStr) return null;
    try {
        $date = new DateTime($dateStr);
        return $date->format('Y-m-d');
    } catch (Exception $e) {
        return null;
    }
}

function _formatDateTime($dateStr) {
    if (!$dateStr) return null;
    try {
        $date = new DateTime($dateStr);
        return $date->format('Y-m-d H:i:s');
    } catch (Exception $e) {
        return null;
    }
}
?>
