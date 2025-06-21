<?php
require_once '../config/database.php';

session_start();

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

    // Verificar si ya dio like
    $checkQuery = "SELECT id FROM post_likes WHERE post_id = :post_id AND user_id = :user_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':post_id', $data['postId']);
    $checkStmt->bindParam(':user_id', $_SESSION['user_id']);
    $checkStmt->execute();

    if ($checkStmt->fetch()) {
        // Quitar like
        $deleteQuery = "DELETE FROM post_likes WHERE post_id = :post_id AND user_id = :user_id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(':post_id', $data['postId']);
        $deleteStmt->bindParam(':user_id', $_SESSION['user_id']);
        $deleteStmt->execute();

        $action = 'unliked';
    } else {
        // Dar like
        $insertQuery = "INSERT INTO post_likes (post_id, user_id) VALUES (:post_id, :user_id)";
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->bindParam(':post_id', $data['postId']);
        $insertStmt->bindParam(':user_id', $_SESSION['user_id']);
        $insertStmt->execute();

        $action = 'liked';
    }

    // Obtener conteo actualizado
    $countQuery = "SELECT COUNT(*) as count FROM post_likes WHERE post_id = :post_id";
    $countStmt = $db->prepare($countQuery);
    $countStmt->bindParam(':post_id', $data['postId']);
    $countStmt->execute();
    $count = $countStmt->fetch();

    jsonResponse([
        'success' => true,
        'action' => $action,
        'likes' => (int)$count['count']
    ]);

} catch (Exception $e) {
    error_log("Error en like post: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>