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

if (!isset($data['newsId']) || !isset($data['content'])) {
    errorResponse('ID de noticia y contenido son requeridos');
}

if (trim($data['content']) === '') {
    errorResponse('El comentario no puede estar vacío');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $query = "INSERT INTO comments (news_id, user_id, content) 
              VALUES (:news_id, :user_id, :content)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':news_id', $data['newsId']);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->bindParam(':content', trim($data['content']));
    $stmt->execute();

    // Obtener datos del comentario creado
    $commentId = $db->lastInsertId();
    $getCommentQuery = "SELECT c.*, u.username, u.avatar 
                       FROM comments c 
                       JOIN users u ON c.user_id = u.id 
                       WHERE c.id = :id";
    $getCommentStmt = $db->prepare($getCommentQuery);
    $getCommentStmt->bindParam(':id', $commentId);
    $getCommentStmt->execute();
    $comment = $getCommentStmt->fetch();

    jsonResponse([
        'success' => true,
        'message' => 'Comentario agregado exitosamente',
        'comment' => [
            'id' => $comment['id'],
            'author' => $comment['username'],
            'content' => $comment['content'],
            'date' => $comment['created_at'],
            'avatar' => $comment['avatar']
        ]
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>