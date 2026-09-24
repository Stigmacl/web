<?php
// api/evento.php
// Configuración del evento: título y fecha/hora objetivo del cronómetro.
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

$default = [
    'titulo' => 'Subasta 360',
    'subtitulo' => 'Reconociendo la excelencia integral',
    'objetivo' => date('c', strtotime('+2 hours')),
];

if ($method === 'GET') {
    json_response(['status' => 'ok', 'evento' => read_json_file(CONFIG_FILE, $default)]);
}

if ($method === 'POST') {
    require_admin();
    $body = read_json_body();
    $actual = read_json_file(CONFIG_FILE, $default);

    $actual['titulo'] = trim($body['titulo'] ?? $actual['titulo']);
    $actual['subtitulo'] = trim($body['subtitulo'] ?? $actual['subtitulo']);
    if (!empty($body['objetivo'])) {
        $actual['objetivo'] = $body['objetivo'];
    }

    write_json_file(CONFIG_FILE, $actual);
    json_response(['status' => 'ok', 'evento' => $actual]);
}

json_response(['status' => 'error', 'message' => 'Método no soportado.'], 405);
