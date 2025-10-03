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

if (!isset($data['commentId'])) {
    errorResponse('ID de comentario requerido');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el usuario sea admin
    $userQuery = "SELECT role FROM users WHERE id = :id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':id', $_SESSION['user_id']);
    $userStmt->execute();
    $user = $userStmt->fetch();

    if (!$user || $user['role'] !== 'admin') {
        errorResponse('No tienes permisos para moderar comentarios', 403);
    }

    // Verificar que el comentario existe y está eliminado
    $checkQuery = "SELECT id FROM comments WHERE id = :id AND is_deleted = 1";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data['commentId']);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        errorResponse('Comentario eliminado no encontrado', 404);
    }

    // Restaurar comentario
    $restoreQuery = "UPDATE comments 
                    SET is_deleted = 0, 
                        deleted_by = NULL, 
                        deleted_at = NULL, 
                        deletion_reason = NULL 
                    WHERE id = :id";
    
    $restoreStmt = $db->prepare($restoreQuery);
    $restoreStmt->bindParam(':id', $data['commentId']);
    $restoreStmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Comentario restaurado exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>