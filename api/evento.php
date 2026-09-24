<?php
// api/evento.php
// Configuración del evento: nombre, textos, estado, acento visual y
// fecha/hora objetivo del cronómetro.
require_once __DIR__ . '/config.php';

const ESTADOS_EVENTO = ['preparacion', 'en_vivo', 'finalizado'];
const ACENTOS = ['aurora', 'oceano', 'magenta', 'solar'];

$method = $_SERVER['REQUEST_METHOD'];

$default = [
    'titulo' => 'Subasta 360',
    'subtitulo' => 'Reconociendo la excelencia integral',
    'bienvenida' => 'Prepárate para participar',
    'estado' => 'preparacion',
    'acento' => 'aurora',
    'objetivo' => date('c', strtotime('+2 hours')),
];

// Los config.json anteriores no traen los campos nuevos: se completan con defaults.
function evento_actual(array $default): array {
    $guardado = read_json_file(CONFIG_FILE, []);
    return array_merge($default, is_array($guardado) ? $guardado : []);
}

if ($method === 'GET') {
    json_response(['status' => 'ok', 'evento' => evento_actual($default)]);
}

if ($method === 'POST') {
    require_admin();
    $body = read_json_body();
    $actual = evento_actual($default);

    foreach (['titulo' => 80, 'subtitulo' => 120, 'bienvenida' => 120] as $campo => $max) {
        if (isset($body[$campo])) {
            $actual[$campo] = clean_text($body[$campo], $max);
        }
    }
    if ($actual['titulo'] === '') {
        json_response(['status' => 'error', 'message' => 'El evento necesita un nombre.'], 422);
    }
    if (isset($body['estado']) && in_array($body['estado'], ESTADOS_EVENTO, true)) {
        $actual['estado'] = $body['estado'];
    }
    if (isset($body['acento']) && in_array($body['acento'], ACENTOS, true)) {
        $actual['acento'] = $body['acento'];
    }
    if (!empty($body['objetivo'])) {
        $ts = strtotime((string)$body['objetivo']);
        if ($ts === false) {
            json_response(['status' => 'error', 'message' => 'La fecha/hora del evento no es válida.'], 422);
        }
        $actual['objetivo'] = date('c', $ts);
    }

    write_json_file(CONFIG_FILE, $actual);
    json_response(['status' => 'ok', 'evento' => $actual]);
}

json_response(['status' => 'error', 'message' => 'Método no soportado.'], 405);
