<?php
// Deshabilitar la visualización de errores para evitar HTML en la respuesta JSON
error_reporting(0);
ini_set('display_errors', 0);

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

if (!isset($data['title']) || !isset($data['content']) || !isset($data['category'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Título, contenido y categoría son requeridos'
    ], 400);
}

if (trim($data['title']) === '' || trim($data['content']) === '') {
    jsonResponse([
        'success' => false,
        'message' => 'El título y contenido no pueden estar vacíos'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que la tabla forum_topics existe, si no, crearla
    $checkTable = "SHOW TABLES LIKE 'forum_topics'";
    $tableExists = $db->query($checkTable);
    
    if ($tableExists->rowCount() == 0) {
        // Crear la tabla de temas del foro
        $createTable = "
        CREATE TABLE `forum_topics` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `user_id` int(11) NOT NULL,
          `title` varchar(255) NOT NULL,
          `content` text NOT NULL,
          `category` varchar(100) NOT NULL,
          `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
          `is_locked` tinyint(1) NOT NULL DEFAULT 0,
          `views` int(11) NOT NULL DEFAULT 0,
          `replies_count` int(11) NOT NULL DEFAULT 0,
          `last_reply_at` timestamp NULL DEFAULT NULL,
          `last_reply_by` int(11) DEFAULT NULL,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`),
          KEY `fk_forum_topics_user` (`user_id`),
          KEY `fk_forum_topics_last_reply_by` (`last_reply_by`),
          KEY `idx_category` (`category`),
          KEY `idx_created_at` (`created_at`),
          KEY `idx_is_pinned` (`is_pinned`),
          CONSTRAINT `fk_forum_topics_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_forum_topics_last_reply_by` FOREIGN KEY (`last_reply_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $db->exec($createTable);
    }

    // Verificar que la tabla forum_replies existe, si no, crearla
    $checkRepliesTable = "SHOW TABLES LIKE 'forum_replies'";
    $repliesTableExists = $db->query($checkRepliesTable);
    
    if ($repliesTableExists->rowCount() == 0) {
        // Crear la tabla de respuestas del foro
        $createRepliesTable = "
        CREATE TABLE `forum_replies` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `topic_id` int(11) NOT NULL,
          `user_id` int(11) NOT NULL,
          `content` text NOT NULL,
          `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
          `deleted_by` int(11) DEFAULT NULL,
          `deleted_at` timestamp NULL DEFAULT NULL,
          `deletion_reason` text DEFAULT NULL,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`),
          KEY `fk_forum_replies_topic` (`topic_id`),
          KEY `fk_forum_replies_user` (`user_id`),
          KEY `fk_forum_replies_deleted_by` (`deleted_by`),
          KEY `idx_created_at` (`created_at`),
          CONSTRAINT `fk_forum_replies_topic` FOREIGN KEY (`topic_id`) REFERENCES `forum_topics` (`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_forum_replies_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_forum_replies_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $db->exec($createRepliesTable);
    }

    $query = "INSERT INTO forum_topics (user_id, title, content, category) 
              VALUES (:user_id, :title, :content, :category)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->bindParam(':title', trim($data['title']));
    $stmt->bindParam(':content', trim($data['content']));
    $stmt->bindParam(':category', $data['category']);
    
    if ($stmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Tema creado exitosamente',
            'id' => $db->lastInsertId()
        ]);
    } else {
        $errorInfo = $stmt->errorInfo();
        error_log("Error SQL en create topic: " . print_r($errorInfo, true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al crear el tema en la base de datos'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en create-topic.php: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>