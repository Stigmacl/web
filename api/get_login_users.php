<?php
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

function norm($t) {
    return strtoupper(trim((string)$t));
}

try {
    $db = Database::conectar();

    // Obtenemos todos los registros para armar las listas
    $stmt = $db->query("SELECT supervisor, jefatura, estado FROM tbl_dotacion_jefatura");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $supervisores = [];
    $admins = [];
    $jefaturasMap = [];

    foreach ($rows as $row) {
        $sup = trim((string)$row['supervisor']);
        $jef = trim((string)$row['jefatura']);
        $est = norm($row['estado']);

        // Solo procesar si está vigente/activo o vacío
        if ($est !== 'VIGENTE' && $est !== 'ACTIVO' && $est !== '') {
            continue;
        }

        if ($sup !== '') {
            $supervisores[norm($sup)] = $sup;
        }

        if ($jef !== '') {
            $admins[norm($jef)] = $jef;
            
            if (!isset($jefaturasMap[norm($jef)])) {
                $jefaturasMap[norm($jef)] = [];
            }
            if ($sup !== '' && !in_array($sup, $jefaturasMap[norm($jef)])) {
                $jefaturasMap[norm($jef)][] = $sup;
            }
        }
    }

    echo json_encode([
        'status' => 'success',
        'supervisors' => array_values($supervisores),
        'admins' => array_values($admins),
        'jefaturas' => $jefaturasMap
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
