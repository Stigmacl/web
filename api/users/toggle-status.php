<?php
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    errorResponse('No autorizado', 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Método no permitido', 405);
}

$data = getJsonInput();

if (!isset($data['id'])) {
    errorResponse('ID de usuario requerido');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el usuario sea admin
    $userQuery = "SELECT role FROM users WHERE id = :id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':id', $_SESSION['user_id']);
    $userStmt->execute();
    $currentUser = $userStmt->fetch();

    if (!$currentUser || $currentUser['role'] !== 'admin') {
        errorResponse('No tienes permisos para cambiar el estado de usuarios', 403);
    }

    // No permitir desactivar al usuario root (ID 1)
    if ($data['id'] == '1') {
        errorResponse('No se puede cambiar el estado del administrador principal');
    }

    // Obtener estado actual del usuario
    $getUserQuery = "SELECT is_active FROM users WHERE id = :id";
    $getUserStmt = $db->prepare($getUserQuery);
    $getUserStmt->bindParam(':id', $data['id']);
    $getUserStmt->execute();
    $targetUser = $getUserStmt->fetch();

    if (!$targetUser) {
        errorResponse('Usuario no encontrado', 404);
    }

    // Cambiar el estado
    $newStatus = $targetUser['is_active'] ? 0 : 1;
    
    $updateQuery = "UPDATE users SET is_active = :is_active WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':is_active', $newStatus);
    $updateStmt->bindParam(':id', $data['id']);
    $updateStmt->execute();

    jsonResponse([
        'success' => true,
        'message' => $newStatus ? 'Usuario activado exitosamente' : 'Usuario suspendido exitosamente',
        'newStatus' => (bool)$newStatus
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>