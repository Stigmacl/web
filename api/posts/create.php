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

if (!isset($data['type']) || !isset($data['url'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Tipo y URL son requeridos'
    ], 400);
}

if (!in_array($data['type'], ['image', 'video'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Tipo debe ser image o video'
    ], 400);
}

// Validar URL de YouTube para videos
if ($data['type'] === 'video') {
    $regExp = '/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/';
    if (!preg_match($regExp, $data['url'])) {
        jsonResponse([
            'success' => false,
            'message' => 'URL de YouTube inválida'
        ], 400);
    }
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que la tabla user_posts existe, si no, crearla
    $checkTable = "SHOW TABLES LIKE 'user_posts'";
    $tableExists = $db->query($checkTable);
    
    if ($tableExists->rowCount() == 0) {
        $createTable = "
        CREATE TABLE `user_posts` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `user_id` int(11) NOT NULL,
          `type` enum('image','video') NOT NULL,
          `url` text NOT NULL,
          `title` varchar(255) DEFAULT NULL,
          `description` text DEFAULT NULL,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`),
          KEY `fk_user_posts_user` (`user_id`),
          CONSTRAINT `fk_user_posts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $db->exec($createTable);
    }

    // Verificar que la tabla post_likes existe, si no, crearla
    $checkLikesTable = "SHOW TABLES LIKE 'post_likes'";
    $likesTableExists = $db->query($checkLikesTable);
    
    if ($likesTableExists->rowCount() == 0) {
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

    // Preparar datos
    $userId = $_SESSION['user_id'];
    $type = $data['type'];
    $url = $data['url'];
    $title = $data['title'] ?? '';
    $description = $data['description'] ?? '';

    // Insertar publicación
    $query = "INSERT INTO user_posts (user_id, type, url, title, description) 
              VALUES (:user_id, :type, :url, :title, :description)";
    
    $stmt = $db->prepare($query);
    $stmt->bindValue(':user_id', $userId);
    $stmt->bindValue(':type', $type);
    $stmt->bindValue(':url', $url);
    $stmt->bindValue(':title', $title);
    $stmt->bindValue(':description', $description);

    if ($stmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Publicación creada exitosamente',
            'id' => $db->lastInsertId()
        ]);
    } else {
        $errorInfo = $stmt->errorInfo();
        error_log("Error SQL en create post: " . print_r($errorInfo, true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al crear la publicación en la base de datos'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en create-post.php: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>
