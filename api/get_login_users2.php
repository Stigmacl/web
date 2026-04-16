<?php
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

function normalizarTexto($texto) {
    $texto = trim((string)$texto);
    if ($texto === '') {
        return '';
    }

    $sinAcentos = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $texto);
    if ($sinAcentos !== false) {
        $texto = $sinAcentos;
    }

    return mb_strtoupper($texto, 'UTF-8');
}

function esEstadoVigente($estado) {
    $estadoNormalizado = normalizarTexto($estado);

    return in_array($estadoNormalizado, ['VIGENTE', 'ACTIVO', ''], true);
}

try {
    $db = Database::conectar();

    // Consultar la tabla tbl_dotacion_jefatura que contiene supervisores y jefaturas
    $stmt = $db->query("
        SELECT 
            supervisor, 
            jefatura, 
            estado,
            rut_supervisor,
            rut_administrador
        FROM tbl_dotacion_jefatura
        WHERE (supervisor IS NOT NULL AND TRIM(supervisor) <> '')
           OR (jefatura IS NOT NULL AND TRIM(jefatura) <> '')
        ORDER BY jefatura ASC, supervisor ASC
    ");

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $supervisores = [];      // Array de supervisores únicos
    $admins = [];            // Array de jefaturas/administradores únicos
    $jefaturas = [];         // Mapa: jefatura => [supervisores]
    $rowsFiltradas = [];     // Rows procesadas

    foreach ($rows as $row) {
        $estado = $row['estado'] ?? '';
        
        // Filtrar solo registros vigentes/activos
        if (!esEstadoVigente($estado)) {
            continue;
        }

        $supervisor = trim((string)($row['supervisor'] ?? ''));
        $jefatura = trim((string)($row['jefatura'] ?? ''));

        // Guardar row filtrada
        $rowsFiltradas[] = [
            'supervisor' => $supervisor,
            'jefatura' => $jefatura,
            'estado' => $estado,
            'rut_supervisor' => $row['rut_supervisor'] ?? null,
            'rut_administrador' => $row['rut_administrador'] ?? null
        ];

        // Agregar supervisor a lista única
        if ($supervisor !== '') {
            $claveSupervisor = normalizarTexto($supervisor);
            $supervisores[$claveSupervisor] = $supervisor;
        }

        // Agregar jefatura a lista de admins y crear mapeo jefatura => supervisores
        if ($jefatura !== '') {
            $claveJefatura = normalizarTexto($jefatura);
            $admins[$claveJefatura] = $jefatura;

            // Crear mapeo de jefatura a sus supervisores
            if (!isset($jefaturas[$claveJefatura])) {
                $jefaturas[$claveJefatura] = [];
            }

            // Agregar supervisor a la lista de supervisores de esta jefatura
            if ($supervisor !== '' && !in_array($supervisor, $jefaturas[$claveJefatura], true)) {
                $jefaturas[$claveJefatura][] = $supervisor;
            }
        }
    }

    // Respuesta JSON con estructura clara
    echo json_encode([
        'status' => 'success',
        'supervisors' => array_values($supervisores),  // Array de supervisores únicos
        'admins' => array_values($admins),              // Array de jefaturas/administradores únicos
        'jefaturas' => $jefaturas,                      // Mapa: jefatura => [supervisores]
        'rows' => $rowsFiltradas,                       // Rows procesadas con estado vigente
        'total_supervisors' => count($supervisores),
        'total_admins' => count($admins)
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error al obtener usuarios del login',
        'detail' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
