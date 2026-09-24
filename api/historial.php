<?php
// api/historial.php
// Historial de giros. Solo admin.
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['status' => 'error', 'message' => 'Método no soportado.'], 405);
}

require_admin();
$historial = read_json_file(HISTORIAL_FILE, []);
json_response(['status' => 'ok', 'historial' => array_reverse($historial)]);
