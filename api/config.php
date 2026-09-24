<?php
// api/config.php
// Configuración central: sesión, rutas de datos y helpers JSON.

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

date_default_timezone_set('America/Santiago');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

define('DATA_DIR', __DIR__ . '/data');
define('PREMIOS_FILE', DATA_DIR . '/premios.json');
define('CONFIG_FILE', DATA_DIR . '/config.json');
define('HISTORIAL_FILE', DATA_DIR . '/historial.json');

// Contraseña del panel admin: "subasta360" (cambiala editando esta línea
// con el resultado de: php -r 'echo password_hash("tu_clave", PASSWORD_DEFAULT);')
define('ADMIN_PASSWORD_HASH', '$2y$12$orwYZgWlQjP6n84D6pmYRu9pT5qvGqsuCZPxOKvLlAKoK3An93lZe');

function json_response($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_file(string $path, $default) {
    if (!file_exists($path)) {
        return $default;
    }
    $raw = file_get_contents($path);
    if ($raw === false || trim($raw) === '') {
        return $default;
    }
    $decoded = json_decode($raw, true);
    return $decoded === null ? $default : $decoded;
}

function write_json_file(string $path, $data): void {
    if (!is_dir(dirname($path))) {
        mkdir(dirname($path), 0775, true);
    }
    $fp = fopen($path, 'c+');
    if ($fp === false) {
        json_response(['status' => 'error', 'message' => 'No se pudo escribir el archivo de datos.'], 500);
    }
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

function require_admin(): void {
    if (empty($_SESSION['is_admin'])) {
        json_response(['status' => 'error', 'message' => 'No autorizado. Iniciá sesión como admin.'], 401);
    }
}

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

// Recorta por caracteres (no bytes) sin depender de la extensión mbstring.
function clean_text($value, int $max): string {
    $text = trim((string)$value);
    return preg_match('/^.{0,' . $max . '}/us', $text, $m) ? $m[0] : '';
}

function valid_hex_color($value, string $fallback): string {
    return is_string($value) && preg_match('/^#[0-9a-fA-F]{6}$/', $value) ? $value : $fallback;
}
