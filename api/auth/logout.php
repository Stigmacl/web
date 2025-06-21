<?php
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    errorResponse('No hay sesión activa', 401);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Actualizar estado offline
    $query = "UPDATE users SET is_online = 0 WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $_SESSION['user_id']);
    $stmt->execute();

    // Destruir sesión
    session_destroy();

    jsonResponse([
        'success' => true,
        'message' => 'Logout exitoso'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>