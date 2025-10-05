<?php
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

if (!isset($data['postId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de publicación requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el usuario sea el propietario de la publicación o admin
    $checkQuery = "SELECT user_id FROM user_posts WHERE id = :post_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':post_id', $data['postId']);
    $checkStmt->execute();
    $post = $checkStmt->fetch();

    if (!$post) {
        jsonResponse([
            'success' => false,
            'message' => 'Publicación no encontrada'
        ], 404);
    }

    // Verificar permisos
    $userQuery = "SELECT role FROM users WHERE id = :user_id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':user_id', $_SESSION['user_id']);
    $userStmt->execute();
    $currentUser = $userStmt->fetch();

    if ($post['user_id'] != $_SESSION['user_id'] && $currentUser['role'] !== 'admin') {
        jsonResponse([
            'success' => false,
            'message' => 'No tienes permisos para eliminar esta publicación'
        ], 403);
    }

    // Eliminar la publicación (los likes se eliminan automáticamente por CASCADE)
    $deleteQuery = "DELETE FROM user_posts WHERE id = :post_id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':post_id', $data['postId']);
    $deleteStmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Publicación eliminada exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>