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

if (!isset($data['userId']) || !isset($data['newPassword'])) {
    errorResponse('ID de usuario y nueva contraseña son requeridos');
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
        errorResponse('No tienes permisos para cambiar contraseñas', 403);
    }

    // Validar la nueva contraseña
    if (strlen($data['newPassword']) < 6) {
        errorResponse('La contraseña debe tener al menos 6 caracteres');
    }

    // Verificar que el usuario objetivo existe
    $checkQuery = "SELECT id FROM users WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data['userId']);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        errorResponse('Usuario no encontrado', 404);
    }

    // Encriptar la nueva contraseña
    $hashedPassword = password_hash($data['newPassword'], PASSWORD_DEFAULT);

    // Actualizar la contraseña
    $updateQuery = "UPDATE users SET password = :password WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':password', $hashedPassword);
    $updateStmt->bindParam(':id', $data['userId']);
    $updateStmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Contraseña actualizada exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>