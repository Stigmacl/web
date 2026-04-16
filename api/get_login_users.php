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

    $stmt = $db->query("
        SELECT supervisor, jefatura, estado
        FROM tbl_dotacion_jefatura
        WHERE (supervisor IS NOT NULL AND TRIM(supervisor) <> '')
           OR (jefatura IS NOT NULL AND TRIM(jefatura) <> '')
        ORDER BY supervisor ASC, jefatura ASC
    ");

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $supervisores = [];
    $admins = [];
    $jefaturas = [];
    $rowsFiltradas = [];

    foreach ($rows as $row) {
        $estado = $row['estado'] ?? '';
        if (!esEstadoVigente($estado)) {
            continue;
        }

        $supervisor = trim((string)($row['supervisor'] ?? ''));
        $jefatura = trim((string)($row['jefatura'] ?? ''));

        $rowsFiltradas[] = [
            'supervisor' => $supervisor,
            'jefatura' => $jefatura,
            'estado' => $estado
        ];

        if ($supervisor !== '') {
            $claveSupervisor = normalizarTexto($supervisor);
            $supervisores[$claveSupervisor] = $supervisor;
        }

        if ($jefatura !== '') {
            $claveJefatura = normalizarTexto($jefatura);
            $admins[$claveJefatura] = $jefatura;

            if (!isset($jefaturas[$claveJefatura])) {
                $jefaturas[$claveJefatura] = [];
            }

            if ($supervisor !== '' && !in_array($supervisor, $jefaturas[$claveJefatura], true)) {
                $jefaturas[$claveJefatura][] = $supervisor;
            }
        }
    }

    echo json_encode([
        'status' => 'success',
        'supervisors' => array_values($supervisores),
        'admins' => array_values($admins),
        'jefaturas' => $jefaturas,
        'rows' => $rowsFiltradas
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
