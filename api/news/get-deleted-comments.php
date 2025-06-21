<?php
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    errorResponse('No autorizado', 401);
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
        errorResponse('No tienes permisos para ver comentarios eliminados', 403);
    }

    // Obtener comentarios eliminados
    $query = "SELECT c.*, 
                     u.username as author_username,
                     u.avatar as author_avatar,
                     admin.username as deleted_by_username,
                     n.title as news_title
              FROM comments c 
              JOIN users u ON c.user_id = u.id 
              LEFT JOIN users admin ON c.deleted_by = admin.id
              JOIN news n ON c.news_id = n.id
              WHERE c.is_deleted = 1 
              ORDER BY c.deleted_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();

    $deletedComments = [];
    while ($row = $stmt->fetch()) {
        $deletedComments[] = [
            'id' => $row['id'],
            'newsId' => $row['news_id'],
            'newsTitle' => $row['news_title'],
            'content' => $row['content'],
            'author' => $row['author_username'],
            'authorAvatar' => $row['author_avatar'],
            'createdAt' => $row['created_at'],
            'deletedBy' => $row['deleted_by_username'],
            'deletedAt' => $row['deleted_at'],
            'deletionReason' => $row['deletion_reason']
        ];
    }

    jsonResponse([
        'success' => true,
        'deletedComments' => $deletedComments
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>