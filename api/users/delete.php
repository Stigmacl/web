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
        errorResponse('No tienes permisos para eliminar usuarios', 403);
    }

    // No permitir eliminar al usuario root (ID 1)
    if ($data['id'] == '1') {
        errorResponse('No se puede eliminar al administrador principal');
    }

    // Verificar que el usuario existe
    $checkQuery = "SELECT id FROM users WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data['id']);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        errorResponse('Usuario no encontrado', 404);
    }

    // Eliminar el usuario (esto también eliminará automáticamente sus mensajes, comentarios, etc. por CASCADE)
    $deleteQuery = "DELETE FROM users WHERE id = :id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':id', $data['id']);
    $deleteStmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Usuario eliminado exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>