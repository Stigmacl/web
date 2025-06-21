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

    // Verificar que el usuario sigue siendo válido
    $query = "SELECT id, username FROM users WHERE id = :id AND is_active = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $_SESSION['user_id']);
    $stmt->execute();

    $user = $stmt->fetch();

    if (!$user) {
        session_destroy();
        jsonResponse([
            'success' => false,
            'message' => 'Usuario no válido'
        ], 401);
    }

    // Actualizar último acceso para extender la sesión
    $updateQuery = "UPDATE users SET last_login = NOW() WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':id', $_SESSION['user_id']);
    $updateStmt->execute();

    // Regenerar ID de sesión por seguridad
    session_regenerate_id(true);

    jsonResponse([
        'success' => true,
        'message' => 'Sesión extendida exitosamente',
        'sessionTime' => time(),
        'extendedUntil' => date('H:i:s', time() + (20 * 60)) // 20 minutos más
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>