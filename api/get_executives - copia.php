<?php
require_once 'config.php';
header('Content-Type: application/json');

function normalizar_estado_dotacion_api($estadoRaw) {
    $estado = strtoupper(trim((string)($estadoRaw ?? '')));

    if ($estado === '' || str_contains($estado, 'ACTIVO') || str_contains($estado, 'ACTUAL') || str_contains($estado, 'VIGENTE')) {
        return 'Activo';
    }
    if (str_contains($estado, 'FALTA')) {
        return 'Fuera Falta Grave';
    }
    if (str_contains($estado, 'RENUNC') || str_contains($estado, 'TER')) {
        return 'Renuncia/Termino';
    }
    if (str_contains($estado, 'APOYO') || str_contains($estado, 'LICEN') || str_contains($estado, 'SINDICAL')) {
        return 'Licencia/Apoyo';
    }
    if (str_contains($estado, 'INACT')) {
        return 'Inactivo';
    }

    return $estadoRaw ?: 'Activo';
}

try {
    $db = Database::conectar();
    
    // 1. Obtener dotación base
    $stmt = $db->query("
        SELECT
            rut,
            nombre_completo,
            usuario_login,
            supervisor_asignado,
            estado_dotacion,
            contrato_desde,
            contrato_hasta,
            tipo_contrato,
            jornada,
            modalidad,
            call_center,
            servicio,
            jefatura,
            hoja_origen
        FROM tbl_dotacion
        ORDER BY nombre_completo ASC
    ");
    $dotacion = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 2. Obtener relación oficial de jefaturas/supervisores
    $stmtJef = $db->query("SELECT supervisor, jefatura FROM tbl_dotacion_jefatura WHERE estado = 'Activo' OR estado IS NULL");
    $jefaturaData = $stmtJef->fetchAll(PDO::FETCH_ASSOC);
    
    $jefaturaMap = [];
    foreach ($jefaturaData as $row) {
        $jef = trim($row['jefatura']);
        $sup = trim($row['supervisor']);
        if ($jef && $sup) {
            if (!isset($jefaturaMap[$jef])) {
                $jefaturaMap[$jef] = [];
            }
            if (!in_array($sup, $jefaturaMap[$jef])) {
                $jefaturaMap[$jef][] = $sup;
            }
        }
    }

    // Mapearemos las columnas de la BD a las llaves que el frontend y JS esperan
    $mapped = array_map(function($row) {
        $estadoNormalizado = normalizar_estado_dotacion_api($row['estado_dotacion'] ?? 'Activo');

        return [
            "nombre" => $row['nombre_completo'],
            "rut" => $row['rut'],
            "usuario" => $row['usuario_login'],
            "supervisor" => $row['supervisor_asignado'],
            "jefatura" => $row['jefatura'] ?? '',
            "estadoDotacion" => $estadoNormalizado,
            "detalleEstado" => $row['estado_dotacion'] ?? $estadoNormalizado,
            "isActivo" => $estadoNormalizado === 'Activo',
            "contratoDesde" => $row['contrato_desde'] ?? '',
            "contratoHasta" => $row['contrato_hasta'] ?? '',
            "tipoContrato" => $row['tipo_contrato'] ?? '',
            "jornada" => $row['jornada'] ?? '',
            "modalidad" => $row['modalidad'] ?? '',
            "call" => $row['call_center'] ?? '',
            "servicio" => $row['servicio'] ?? '',
            "hojaOrigen" => $row['hoja_origen'] ?? '',
            "fechaTermino" => $row['contrato_hasta'] ?? ''
        ];
    }, $dotacion);
    
    $supervisors = [];
    foreach ($mapped as $row) {
        if (!empty($row['supervisor'])) {
            $supervisors[$row['supervisor']] = true;
        }
        
        // Si no tenemos este supervisor en el mapa de jefaturas oficial, 
        // lo agregamos según lo que dice la tabla de dotación (fallback)
        if (!empty($row['jefatura']) && !empty($row['supervisor'])) {
            if (!isset($jefaturaMap[$row['jefatura']])) {
                $jefaturaMap[$row['jefatura']] = [];
            }
            if (!in_array($row['supervisor'], $jefaturaMap[$row['jefatura']], true)) {
                $jefaturaMap[$row['jefatura']][] = $row['supervisor'];
            }
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => $mapped,
        "supervisors" => array_values(array_keys($supervisors)),
        "jefaturas" => $jefaturaMap
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
