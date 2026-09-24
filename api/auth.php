<?php
// api/auth.php
// Login / logout / estado de sesión del panel admin.
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'login') {
    $body = read_json_body();
    $password = $body['password'] ?? '';

    if ($password !== '' && password_verify($password, ADMIN_PASSWORD_HASH)) {
        session_regenerate_id(true);
        $_SESSION['is_admin'] = true;
        json_response(['status' => 'ok']);
    }

    json_response(['status' => 'error', 'message' => 'Contraseña incorrecta.'], 401);
}

if ($method === 'POST' && $action === 'logout') {
    $_SESSION = [];
    session_destroy();
    json_response(['status' => 'ok']);
}

if ($method === 'GET' && $action === 'status') {
    json_response(['status' => 'ok', 'is_admin' => !empty($_SESSION['is_admin'])]);
}

json_response(['status' => 'error', 'message' => 'Acción no soportada.'], 400);
