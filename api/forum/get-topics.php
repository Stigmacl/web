<?php
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que las tablas existen
    $checkTable = "SHOW TABLES LIKE 'forum_topics'";
    $tableExists = $db->query($checkTable);
    
    if ($tableExists->rowCount() == 0) {
        jsonResponse([
            'success' => true,
            'topics' => []
        ]);
        return;
    }

    $category = $_GET['category'] ?? 'all';
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;

    // Construir query base
    $whereClause = '';
    $params = [];

    if ($category !== 'all' && !empty($category)) {
        $whereClause = 'WHERE ft.category = :category';
        $params[':category'] = $category;
    }

    // Obtener temas con información del autor y última respuesta
    $baseQuery = "SELECT ft.*,
                     u.username as author_username,
                     u.avatar as author_avatar,
                     lr.username as last_reply_username,
                     lr.avatar as last_reply_avatar
              FROM forum_topics ft
              INNER JOIN users u ON ft.user_id = u.id
              LEFT JOIN users lr ON ft.last_reply_by = lr.id";

    $query = $baseQuery . " " . $whereClause . "
              ORDER BY ft.is_pinned DESC,
                       COALESCE(ft.last_reply_at, ft.created_at) DESC
              LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();

    $topics = [];
    while ($row = $stmt->fetch()) {
        $topics[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'content' => $row['content'],
            'category' => $row['category'],
            'isPinned' => (bool)$row['is_pinned'],
            'isLocked' => (bool)$row['is_locked'],
            'views' => (int)$row['views'],
            'repliesCount' => (int)$row['replies_count'],
            'author' => [
                'id' => $row['user_id'],
                'username' => $row['author_username'],
                'avatar' => $row['author_avatar']
            ],
            'lastReply' => $row['last_reply_by'] ? [
                'username' => $row['last_reply_username'],
                'avatar' => $row['last_reply_avatar'],
                'at' => $row['last_reply_at']
            ] : null,
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }

    // Obtener total de temas para paginación
    $countQuery = "SELECT COUNT(*) as total FROM forum_topics ft $whereClause";
    $countStmt = $db->prepare($countQuery);
    
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $totalTopics = $countStmt->fetch()['total'];

    jsonResponse([
        'success' => true,
        'topics' => $topics,
        'pagination' => [
            'currentPage' => $page,
            'totalPages' => ceil($totalTopics / $limit),
            'totalTopics' => (int)$totalTopics,
            'hasNext' => $page < ceil($totalTopics / $limit),
            'hasPrev' => $page > 1
        ]
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>