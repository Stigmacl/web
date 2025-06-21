<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Método no permitido', 405);
}

$data = getJsonInput();

if (!isset($data['username']) || !isset($data['password'])) {
    errorResponse('Usuario y contraseña son requeridos');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Buscar usuario
    $query = "SELECT id, username, email, password, role, avatar, status, clan, is_active 
              FROM users 
              WHERE username = :username AND is_active = 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $data['username']);
    $stmt->execute();

    $user = $stmt->fetch();

    if (!$user || !password_verify($data['password'], $user['password'])) {
        errorResponse('Credenciales incorrectas', 401);
    }

    // Actualizar estado online y último login
    $updateQuery = "UPDATE users SET is_online = 1, last_login = NOW() WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':id', $user['id']);
    $updateStmt->execute();

    // Remover password del response
    unset($user['password']);
    $user['isOnline'] = true;
    $user['isActive'] = (bool)$user['is_active'];
    $user['lastLogin'] = date('c');
    $user['createdAt'] = date('c');

    // Generar token simple (en producción usar JWT)
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];

    jsonResponse([
        'success' => true,
        'user' => $user,
        'message' => 'Login exitoso'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>