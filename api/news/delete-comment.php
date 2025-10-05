<?php
// Deshabilitar la visualización de errores para evitar HTML en la respuesta JSON
error_reporting(0);
ini_set('display_errors', 0);

require_once '../config/database.php';

startSecureSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'No autorizado'
    ], 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse([
        'success' => false,
        'message' => 'Método no permitido'
    ], 405);
}

$data = getJsonInput();

if (!isset($data['commentId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de comentario requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el usuario sea admin
    $userQuery = "SELECT role FROM users WHERE id = :id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindValue(':id', $_SESSION['user_id']);
    $userStmt->execute();
    $user = $userStmt->fetch();

    if (!$user || $user['role'] !== 'admin') {
        jsonResponse([
            'success' => false,
            'message' => 'No tienes permisos para moderar comentarios'
        ], 403);
    }

    // Verificar que el comentario existe y no está ya eliminado
    $checkQuery = "SELECT id, content, user_id FROM comments WHERE id = :id AND is_deleted = 0";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindValue(':id', $data['commentId']);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Comentario no encontrado o ya está eliminado'
        ], 404);
    }

    // Marcar comentario como eliminado
    $deleteQuery = "UPDATE comments 
                    SET is_deleted = 1, 
                        deleted_by = :deleted_by, 
                        deleted_at = NOW(), 
                        deletion_reason = :reason 
                    WHERE id = :id";

    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindValue(':id', $data['commentId']);
    $deleteStmt->bindValue(':deleted_by', $_SESSION['user_id']);
    $deleteStmt->bindValue(':reason', $data['reason'] ?? 'Moderación administrativa');

    if ($deleteStmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Comentario eliminado exitosamente'
        ]);
    } else {
        $errorInfo = $deleteStmt->errorInfo();
        error_log("Error SQL en delete comment: " . print_r($errorInfo, true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al eliminar el comentario'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en delete-comment.php: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>
