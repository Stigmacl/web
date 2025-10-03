<?php
require_once '../config/database.php';

if (!isset($_GET['id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de tema requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Incrementar vistas del tema
    $updateViews = "UPDATE forum_topics SET views = views + 1 WHERE id = :id";
    $updateStmt = $db->prepare($updateViews);
    $updateStmt->bindParam(':id', $_GET['id']);
    $updateStmt->execute();

    // Obtener tema con información del autor
    $query = "SELECT ft.*, 
                     u.username as author_username,
                     u.avatar as author_avatar,
                     u.role as author_role
              FROM forum_topics ft
              JOIN users u ON ft.user_id = u.id
              WHERE ft.id = :id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $_GET['id']);
    $stmt->execute();

    $topic = $stmt->fetch();

    if (!$topic) {
        jsonResponse([
            'success' => false,
            'message' => 'Tema no encontrado'
        ], 404);
    }

    // Verificar si existen las columnas de edición
    $checkColumns = "SHOW COLUMNS FROM forum_replies LIKE 'edit_count'";
    $hasEditColumns = $db->query($checkColumns)->rowCount() > 0;

    // Obtener respuestas del tema
    if ($hasEditColumns) {
        $repliesQuery = "SELECT fr.*,
                                u.username,
                                u.avatar,
                                u.role,
                                u.clan
                         FROM forum_replies fr
                         JOIN users u ON fr.user_id = u.id
                         WHERE fr.topic_id = :topic_id AND fr.is_deleted = 0
                         ORDER BY fr.created_at ASC";
    } else {
        $repliesQuery = "SELECT fr.id, fr.user_id, fr.content, fr.created_at, fr.updated_at,
                                u.username,
                                u.avatar,
                                u.role,
                                u.clan
                         FROM forum_replies fr
                         JOIN users u ON fr.user_id = u.id
                         WHERE fr.topic_id = :topic_id AND fr.is_deleted = 0
                         ORDER BY fr.created_at ASC";
    }

    $repliesStmt = $db->prepare($repliesQuery);
    $repliesStmt->bindParam(':topic_id', $_GET['id']);
    $repliesStmt->execute();

    $replies = [];
    while ($reply = $repliesStmt->fetch()) {
        $replyData = [
            'id' => $reply['id'],
            'content' => $reply['content'],
            'author' => [
                'id' => $reply['user_id'],
                'username' => $reply['username'],
                'avatar' => $reply['avatar'],
                'role' => $reply['role'],
                'clan' => $reply['clan']
            ],
            'createdAt' => $reply['created_at'],
            'updatedAt' => $reply['updated_at']
        ];

        // Agregar información de edición si existe
        if ($hasEditColumns) {
            $replyData['editCount'] = isset($reply['edit_count']) ? (int)$reply['edit_count'] : 0;
            $replyData['lastEditedAt'] = $reply['last_edited_at'] ?? null;
            $replyData['quotedReplyId'] = $reply['quoted_reply_id'] ?? null;
        }

        $replies[] = $replyData;
    }

    $topicData = [
        'id' => $topic['id'],
        'title' => $topic['title'],
        'content' => $topic['content'],
        'category' => $topic['category'],
        'isPinned' => (bool)$topic['is_pinned'],
        'isLocked' => (bool)$topic['is_locked'],
        'views' => (int)$topic['views'],
        'repliesCount' => (int)$topic['replies_count'],
        'author' => [
            'id' => $topic['user_id'],
            'username' => $topic['author_username'],
            'avatar' => $topic['author_avatar'],
            'role' => $topic['author_role']
        ],
        'replies' => $replies,
        'createdAt' => $topic['created_at'],
        'updatedAt' => $topic['updated_at']
    ];

    jsonResponse([
        'success' => true,
        'topic' => $topicData
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>