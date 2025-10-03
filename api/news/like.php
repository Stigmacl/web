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

if (!isset($data['newsId'])) {
    errorResponse('ID de noticia requerido');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar si ya dio like
    $checkQuery = "SELECT id FROM news_likes WHERE news_id = :news_id AND user_id = :user_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':news_id', $data['newsId']);
    $checkStmt->bindParam(':user_id', $_SESSION['user_id']);
    $checkStmt->execute();

    if ($checkStmt->fetch()) {
        // Quitar like
        $deleteQuery = "DELETE FROM news_likes WHERE news_id = :news_id AND user_id = :user_id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(':news_id', $data['newsId']);
        $deleteStmt->bindParam(':user_id', $_SESSION['user_id']);
        $deleteStmt->execute();

        $action = 'unliked';
    } else {
        // Dar like
        $insertQuery = "INSERT INTO news_likes (news_id, user_id) VALUES (:news_id, :user_id)";
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->bindParam(':news_id', $data['newsId']);
        $insertStmt->bindParam(':user_id', $_SESSION['user_id']);
        $insertStmt->execute();

        $action = 'liked';
    }

    // Obtener conteo actualizado
    $countQuery = "SELECT COUNT(*) as count FROM news_likes WHERE news_id = :news_id";
    $countStmt = $db->prepare($countQuery);
    $countStmt->bindParam(':news_id', $data['newsId']);
    $countStmt->execute();
    $count = $countStmt->fetch();

    jsonResponse([
        'success' => true,
        'action' => $action,
        'likes' => (int)$count['count']
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>