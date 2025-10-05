<?php
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

if (!isset($data['replyId']) || !isset($data['content'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de la respuesta y contenido son requeridos'
    ], 400);
}

if (trim($data['content']) === '') {
    jsonResponse([
        'success' => false,
        'message' => 'El contenido no puede estar vacío'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que la tabla forum_reply_edit_history existe
    $checkTable = "SHOW TABLES LIKE 'forum_reply_edit_history'";
    $tableExists = $db->query($checkTable);

    if ($tableExists->rowCount() == 0) {
        // Crear tabla de historial de edición
        $createTable = "
        CREATE TABLE `forum_reply_edit_history` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `reply_id` int(11) NOT NULL,
          `user_id` int(11) NOT NULL,
          `old_content` text NOT NULL,
          `new_content` text NOT NULL,
          `edited_at` timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (`id`),
          KEY `fk_edit_history_reply` (`reply_id`),
          KEY `fk_edit_history_user` (`user_id`),
          KEY `idx_edited_at` (`edited_at`),
          CONSTRAINT `fk_edit_history_reply` FOREIGN KEY (`reply_id`) REFERENCES `forum_replies` (`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_edit_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

        $db->exec($createTable);

        // Agregar columnas a forum_replies
        $alterTable = "
        ALTER TABLE forum_replies
        ADD COLUMN edit_count INT DEFAULT 0,
        ADD COLUMN last_edited_at TIMESTAMP NULL,
        ADD COLUMN quoted_reply_id INT NULL,
        ADD KEY `fk_quoted_reply` (`quoted_reply_id`),
        ADD CONSTRAINT `fk_quoted_reply` FOREIGN KEY (`quoted_reply_id`) REFERENCES `forum_replies` (`id`) ON DELETE SET NULL";

        $db->exec($alterTable);
    }

    // Verificar que el usuario es el autor de la respuesta
    $checkQuery = "SELECT user_id, content, topic_id FROM forum_replies WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data['replyId']);
    $checkStmt->execute();
    $reply = $checkStmt->fetch();

    if (!$reply) {
        jsonResponse([
            'success' => false,
            'message' => 'Respuesta no encontrada'
        ], 404);
    }

    if ($reply['user_id'] != $_SESSION['user_id']) {
        jsonResponse([
            'success' => false,
            'message' => 'Solo el autor puede editar la respuesta'
        ], 403);
    }

    // Verificar que el tema no está bloqueado
    $topicQuery = "SELECT is_locked FROM forum_topics WHERE id = :id";
    $topicStmt = $db->prepare($topicQuery);
    $topicStmt->bindParam(':id', $reply['topic_id']);
    $topicStmt->execute();
    $topic = $topicStmt->fetch();

    if ($topic && $topic['is_locked']) {
        jsonResponse([
            'success' => false,
            'message' => 'No se puede editar en un tema bloqueado'
        ], 403);
    }

    // Guardar en el historial
    $historyQuery = "INSERT INTO forum_reply_edit_history (reply_id, user_id, old_content, new_content)
                     VALUES (:reply_id, :user_id, :old_content, :new_content)";
    $historyStmt = $db->prepare($historyQuery);
    $historyStmt->bindParam(':reply_id', $data['replyId']);
    $historyStmt->bindParam(':user_id', $_SESSION['user_id']);
    $historyStmt->bindParam(':old_content', $reply['content']);
    $historyStmt->bindParam(':new_content', trim($data['content']));
    $historyStmt->execute();

    // Actualizar la respuesta
    $updateQuery = "UPDATE forum_replies
                    SET content = :content,
                        edit_count = edit_count + 1,
                        last_edited_at = NOW()
                    WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':content', trim($data['content']));
    $updateStmt->bindParam(':id', $data['replyId']);

    if ($updateStmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Respuesta editada exitosamente'
        ]);
    } else {
        jsonResponse([
            'success' => false,
            'message' => 'Error al editar la respuesta'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en edit-reply.php: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>
