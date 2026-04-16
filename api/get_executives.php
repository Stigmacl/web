<?php
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

function normalizar_estado_dotacion_api($estadoRaw, $tablaOrigen = '') {
    $estado = strtoupper(trim((string)($estadoRaw ?? '')));

    // Si viene de una tabla específica, ya sabemos su estado base
    if ($tablaOrigen === 'tbl_dotacion_fusion') return 'Activo';
    if ($tablaOrigen === 'tbl_dotacion_fuera_falta_grave') return 'Fuera Falta Grave';
    if ($tablaOrigen === 'tbl_dotacion_renuncias_termino') return 'Renuncia/Termino';
    if ($tablaOrigen === 'tbl_dotacion_apoyos_licencias') return 'Licencia/Apoyo';

    if (
        $estado === '' ||
        str_contains($estado, 'ACTIVO') ||
        str_contains($estado, 'ACTUAL') ||
        str_contains($estado, 'VIGENTE')
    ) {
        return 'Activo';
    }

    if (str_contains($estado, 'FALTA')) {
        return 'Fuera Falta Grave';
    }

    if (
        str_contains($estado, 'RENUNC') ||
        str_contains($estado, 'TER')
    ) {
        return 'Renuncia/Termino';
    }

    if (
        $estado === 'APOYO' ||
        str_contains($estado, 'LICEN') ||
        str_contains($estado, 'SINDICAL')
    ) {
        return 'Licencia/Apoyo';
    }

    if (str_contains($estado, 'INACT')) {
        return 'Inactivo';
    }

    return $estadoRaw ?: 'Activo';
}

try {

    $db = Database::conectar();
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $allData = [];
    $supervisors = [];
    $jefaturaMap = [];

    /*
    ======================================================
    1) MAPEO OFICIAL JEFATURA -> SUPERVISORES (VIGENTES)
    ======================================================
    */
    try {
        $stmtJef = $db->query("
            SELECT supervisor, jefatura
            FROM tbl_dotacion_jefatura
            WHERE (estado = 'Activo' OR estado IS NULL OR estado = '' OR estado = 'VIGENTE')
        ");

        $jefaturaData = $stmtJef->fetchAll(PDO::FETCH_ASSOC);

        foreach ($jefaturaData as $row) {
            $jef = trim($row['jefatura'] ?? '');
            $sup = trim($row['supervisor'] ?? '');

            if ($jef !== '' && $sup !== '') {
                if (!isset($jefaturaMap[$jef])) {
                    $jefaturaMap[$jef] = [];
                }
                if (!in_array($sup, $jefaturaMap[$jef], true)) {
                    $jefaturaMap[$jef][] = $sup;
                }
            }
        }
    } catch (Exception $e) {
        // No crítico
    }

    /*
    ======================================================
    2) CONSULTAR TODAS LAS TABLAS DE DOTACIÓN
    ======================================================
    */
    $tablas = [
        'tbl_dotacion_fusion' => 'Activo',
        'tbl_dotacion_fuera_falta_grave' => 'Fuera Falta Grave',
        'tbl_dotacion_renuncias_termino' => 'Renuncia/Termino',
        'tbl_dotacion_apoyos_licencias' => 'Licencia/Apoyo'
    ];

    foreach ($tablas as $tabla => $estadoBase) {
        // Verificar si la tabla existe antes de consultar
        $checkTable = $db->query("SHOW TABLES LIKE '$tabla'");
        if ($checkTable->rowCount() == 0) continue;

        $query = "SELECT * FROM $tabla";
        $stmt = $db->query($query);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as $row) {
            $nombre = $row['nombre'] ?? $row['nombre_completo'] ?? '';
            $usuario = $row['usuario'] ?? $row['usuario_login'] ?? '';
            $supervisor = trim($row['supervisor'] ?? $row['supervisor_asignado'] ?? '');
            $jefatura = trim($row['jefatura'] ?? '');
            $estadoExcel = $row['estado_excel'] ?? $row['estado_dotacion'] ?? '';
            
            $estadoNormalizado = normalizar_estado_dotacion_api($estadoExcel, $tabla);

            $allData[] = [
                "nombre"         => $nombre,
                "rut"            => $row['rut'],
                "usuario"        => $usuario,
                "supervisor"     => $supervisor,
                "jefatura"       => $jefatura,
                "estadoDotacion" => $estadoNormalizado,
                "detalleEstado"  => $estadoExcel ?: $estadoNormalizado,
                "isActivo"       => ($estadoNormalizado === 'Activo'),
                "contratoDesde"  => $row['contrato_desde'] ?? '',
                "contratoHasta"  => $row['contrato_hasta'] ?? '',
                "tipoContrato"   => $row['tipo_contrato'] ?? '',
                "jornada"        => $row['jornada'] ?? '',
                "modalidad"      => $row['modalidad'] ?? '',
                "call"           => $row['call_center'] ?? '',
                "servicio"       => $row['servicio'] ?? '',
                "hojaOrigen"     => strtoupper(str_replace('tbl_dotacion_', '', $tabla)),
                "fechaTermino"   => $row['contrato_hasta'] ?? ''
            ];

            // Solo agregamos supervisores que tengan dotación activa
            if ($supervisor !== '' && $estadoNormalizado === 'Activo') {
                $supervisors[$supervisor] = true;
            }
        }
    }

    echo json_encode([
        "status"       => "success",
        "data"         => $allData,
        "supervisors"  => array_values(array_keys($supervisors)),
        "jefaturas"    => $jefaturaMap,
        "total"        => count($allData)
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => $e->getMessage(),
        "data"    => [],
        "supervisors" => [],
        "jefaturas" => []
    ], JSON_UNESCAPED_UNICODE);
}
?>
