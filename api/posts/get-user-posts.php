<?php
require_once '../config/database.php';

if (!isset($_GET['userId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de usuario requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que la tabla existe
    $checkTable = "SHOW TABLES LIKE 'user_posts'";
    $tableExists = $db->query($checkTable);
    
    if ($tableExists->rowCount() == 0) {
        // Si la tabla no existe, devolver array vacío
        jsonResponse([
            'success' => true,
            'posts' => []
        ]);
        return;
    }

    // Verificar que la tabla post_likes existe
    $checkLikesTable = "SHOW TABLES LIKE 'post_likes'";
    $likesTableExists = $db->query($checkLikesTable);
    
    if ($likesTableExists->rowCount() == 0) {
        // Crear la tabla de likes si no existe
        $createLikesTable = "
        CREATE TABLE `post_likes` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `post_id` int(11) NOT NULL,
          `user_id` int(11) NOT NULL,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (`id`),
          UNIQUE KEY `unique_post_like` (`post_id`, `user_id`),
          KEY `fk_post_likes_user` (`user_id`),
          CONSTRAINT `fk_post_likes_post` FOREIGN KEY (`post_id`) REFERENCES `user_posts` (`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_post_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $db->exec($createLikesTable);
    }

    $query = "SELECT p.*, u.username, u.avatar,
                     (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as like_count
              FROM user_posts p
              JOIN users u ON p.user_id = u.id
              WHERE p.user_id = :user_id AND u.is_active = 1
              ORDER BY p.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_GET['userId']);
    $stmt->execute();

    $posts = [];
    while ($row = $stmt->fetch()) {
        // Obtener usuarios que dieron like
        $likesQuery = "SELECT user_id FROM post_likes WHERE post_id = :post_id";
        $likesStmt = $db->prepare($likesQuery);
        $likesStmt->bindParam(':post_id', $row['id']);
        $likesStmt->execute();

        $likedBy = [];
        while ($like = $likesStmt->fetch()) {
            $likedBy[] = $like['user_id'];
        }

        $posts[] = [
            'id' => $row['id'],
            'type' => $row['type'],
            'url' => $row['url'],
            'title' => $row['title'],
            'description' => $row['description'],
            'username' => $row['username'],
            'userAvatar' => $row['avatar'],
            'likes' => (int)$row['like_count'],
            'likedBy' => $likedBy,
            'createdAt' => $row['created_at']
        ];
    }

    jsonResponse([
        'success' => true,
        'posts' => $posts
    ]);

} catch (Exception $e) {
    error_log("Error en get user posts: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>