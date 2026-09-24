<?php
// api/premios.php
// CRUD de premios. Lectura pública (la pantalla principal la necesita
// para dibujar la ruleta); escritura solo para el admin logueado.
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

function all_premios(): array {
    return read_json_file(PREMIOS_FILE, []);
}

function save_premios(array $premios): void {
    write_json_file(PREMIOS_FILE, $premios);
}

switch ($method) {
    case 'GET':
        json_response(['status' => 'ok', 'premios' => all_premios()]);
        break;

    case 'POST':
        require_admin();
        $body = read_json_body();
        $nombre = trim($body['nombre'] ?? '');
        if ($nombre === '') {
            json_response(['status' => 'error', 'message' => 'El premio necesita un nombre.'], 422);
        }

        $premios = all_premios();
        $nuevo = [
            'id' => uniqid('premio_', true),
            'nombre' => $nombre,
            'descripcion' => trim($body['descripcion'] ?? ''),
            'color' => $body['color'] ?? '#0b3d91',
            'icono' => trim($body['icono'] ?? '🎁'),
            'peso' => max(1, (int)($body['peso'] ?? 1)),
            'stock' => (int)($body['stock'] ?? -1), // -1 = ilimitado
        ];
        $premios[] = $nuevo;
        save_premios($premios);
        json_response(['status' => 'ok', 'premio' => $nuevo], 201);
        break;

    case 'PUT':
        require_admin();
        $body = read_json_body();
        $id = $body['id'] ?? '';
        $premios = all_premios();
        $found = false;
        foreach ($premios as &$p) {
            if ($p['id'] === $id) {
                $p['nombre'] = trim($body['nombre'] ?? $p['nombre']);
                $p['descripcion'] = trim($body['descripcion'] ?? $p['descripcion']);
                $p['color'] = $body['color'] ?? $p['color'];
                $p['icono'] = trim($body['icono'] ?? $p['icono']);
                $p['peso'] = max(1, (int)($body['peso'] ?? $p['peso']));
                $p['stock'] = isset($body['stock']) ? (int)$body['stock'] : $p['stock'];
                $found = true;
                break;
            }
        }
        unset($p);
        if (!$found) {
            json_response(['status' => 'error', 'message' => 'Premio no encontrado.'], 404);
        }
        save_premios($premios);
        json_response(['status' => 'ok']);
        break;

    case 'DELETE':
        require_admin();
        $id = $_GET['id'] ?? '';
        $premios = all_premios();
        $filtrados = array_values(array_filter($premios, fn($p) => $p['id'] !== $id));
        if (count($filtrados) === count($premios)) {
            json_response(['status' => 'error', 'message' => 'Premio no encontrado.'], 404);
        }
        save_premios($filtrados);
        json_response(['status' => 'ok']);
        break;

    default:
        json_response(['status' => 'error', 'message' => 'Método no soportado.'], 405);
}
