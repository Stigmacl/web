<?php
// api/historial.php
// Historial de giros. Solo admin.
// GET: lista (más reciente primero). PUT: asigna el nombre del ganador a un giro.
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
require_admin();

if ($method === 'GET') {
    $historial = read_json_file(HISTORIAL_FILE, []);
    json_response(['status' => 'ok', 'historial' => array_reverse($historial)]);
}

if ($method === 'PUT') {
    $body = read_json_body();
    $id = $body['id'] ?? '';
    $participante = clean_text($body['participante'] ?? '', 60);

    $historial = read_json_file(HISTORIAL_FILE, []);
    foreach ($historial as &$giro) {
        if ($giro['id'] === $id) {
            $giro['participante'] = $participante;
            unset($giro);
            write_json_file(HISTORIAL_FILE, $historial);
            json_response(['status' => 'ok', 'participante' => $participante]);
        }
    }
    unset($giro);
    json_response(['status' => 'error', 'message' => 'Giro no encontrado.'], 404);
}

json_response(['status' => 'error', 'message' => 'Método no soportado.'], 405);
