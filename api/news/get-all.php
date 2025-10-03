<?php
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Obtener noticias con conteo de comentarios
    $query = "SELECT n.*, 
                     (SELECT COUNT(*) FROM comments c WHERE c.news_id = n.id AND c.is_deleted = 0) as comment_count,
                     (SELECT COUNT(*) FROM news_likes nl WHERE nl.news_id = n.id) as like_count
              FROM news n 
              ORDER BY n.is_pinned DESC, n.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();

    $news = [];
    while ($row = $stmt->fetch()) {
        // Obtener comentarios
        $commentsQuery = "SELECT c.*, u.username, u.avatar 
                         FROM comments c 
                         JOIN users u ON c.user_id = u.id 
                         WHERE c.news_id = :news_id AND c.is_deleted = 0 
                         ORDER BY c.created_at ASC";
        $commentsStmt = $db->prepare($commentsQuery);
        $commentsStmt->bindParam(':news_id', $row['id']);
        $commentsStmt->execute();

        $comments = [];
        while ($comment = $commentsStmt->fetch()) {
            $comments[] = [
                'id' => $comment['id'],
                'author' => $comment['username'],
                'content' => $comment['content'],
                'date' => $comment['created_at'],
                'avatar' => $comment['avatar']
            ];
        }

        // Obtener usuarios que dieron like
        $likesQuery = "SELECT user_id FROM news_likes WHERE news_id = :news_id";
        $likesStmt = $db->prepare($likesQuery);
        $likesStmt->bindParam(':news_id', $row['id']);
        $likesStmt->execute();

        $likedBy = [];
        while ($like = $likesStmt->fetch()) {
            $likedBy[] = $like['user_id'];
        }

        $news[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'content' => $row['content'],
            'image' => $row['image'],
            'author' => $row['author'],
            'date' => $row['created_at'],
            'isPinned' => (bool)$row['is_pinned'],
            'views' => (int)$row['views'],
            'likes' => (int)$row['like_count'],
            'likedBy' => $likedBy,
            'comments' => $comments
        ];
    }

    jsonResponse([
        'success' => true,
        'news' => $news
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>