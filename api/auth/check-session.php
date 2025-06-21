<?php
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'No hay sesión activa'
    ], 401);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Obtener datos del usuario actual
    $query = "SELECT id, username, email, role, avatar, status, clan, is_active 
              FROM users 
              WHERE id = :id AND is_active = 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $_SESSION['user_id']);
    $stmt->execute();

    $user = $stmt->fetch();

    if (!$user) {
        // Usuario no encontrado o inactivo, destruir sesión
        session_destroy();
        jsonResponse([
            'success' => false,
            'message' => 'Usuario no válido'
        ], 401);
    }

    // Actualizar último acceso
    $updateQuery = "UPDATE users SET last_login = NOW() WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':id', $_SESSION['user_id']);
    $updateStmt->execute();

    // Remover password del response
    $user['isOnline'] = true;
    $user['isActive'] = (bool)$user['is_active'];
    $user['lastLogin'] = date('c');
    $user['createdAt'] = date('c');

    jsonResponse([
        'success' => true,
        'user' => $user,
        'sessionTime' => time(),
        'message' => 'Sesión válida'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>