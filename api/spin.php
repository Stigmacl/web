<?php
// api/spin.php
// Elige un premio al azar (ponderado por "peso"), descuenta stock y
// deja registro en el historial. Requiere sesión admin (la pantalla
// principal se abre en el navegador donde el operador ya inició sesión).
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['status' => 'error', 'message' => 'Método no soportado.'], 405);
}

require_admin();

$premios = read_json_file(PREMIOS_FILE, []);
$candidatos = array_values(array_filter($premios, fn($p) => ($p['stock'] ?? -1) !== 0));

if (empty($candidatos)) {
    json_response(['status' => 'error', 'message' => 'No hay premios disponibles para girar.'], 422);
}

$totalPeso = array_sum(array_map(fn($p) => max(1, (int)$p['peso']), $candidatos));
$tirada = mt_rand(1, $totalPeso);
$acumulado = 0;
$ganador = $candidatos[0];

foreach ($candidatos as $p) {
    $acumulado += max(1, (int)$p['peso']);
    if ($tirada <= $acumulado) {
        $ganador = $p;
        break;
    }
}

// Descontar stock si es finito.
foreach ($premios as &$p) {
    if ($p['id'] === $ganador['id'] && (int)$p['stock'] > 0) {
        $p['stock'] = (int)$p['stock'] - 1;
        break;
    }
}
unset($p);
write_json_file(PREMIOS_FILE, $premios);

$historial = read_json_file(HISTORIAL_FILE, []);
$entrada = [
    'id' => uniqid('giro_', true),
    'premio_id' => $ganador['id'],
    'premio_nombre' => $ganador['nombre'],
    'icono' => $ganador['icono'] ?? '🎁',
    'timestamp' => date('c'),
];
$historial[] = $entrada;
write_json_file(HISTORIAL_FILE, $historial);

json_response(['status' => 'ok', 'ganador' => $ganador, 'orden_ruleta' => array_column($candidatos, 'id')]);
