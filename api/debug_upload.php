<?php
// api/debug_upload.php — SOLO PARA DEBUG, ELIMINAR DESPUÉS
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

$rawData = file_get_contents("php://input");
$payload = json_decode($rawData, true);

if (!$payload) {
    echo json_encode(['error' => 'No payload received', 'raw' => substr($rawData, 0, 500)]);
    exit;
}

$type = $payload['type'] ?? 'NO TYPE';
$data = $payload['data'] ?? [];

$firstRows = array_slice($data, 0, 3);
$nullRows  = count(array_filter($data, fn($r) => empty($r['rut']) || empty($r['nombre'])));
$validRows = count($data) - $nullRows;

echo json_encode([
    'type'           => $type,
    'total_received' => count($data),
    'valid_rows'     => $validRows,
    'null_rows'      => $nullRows,
    'first_3_rows'   => $firstRows,
    'keys_in_row_0'  => count($data) > 0 ? array_keys($data[0]) : []
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
