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

if (!isset($data['topicId']) || !isset($data['content'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID del tema y contenido son requeridos'
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

    // Verificar que el tema existe y no está bloqueado
    $topicQuery = "SELECT id, is_locked FROM forum_topics WHERE id = :id";
    $topicStmt = $db->prepare($topicQuery);
    $topicStmt->bindParam(':id', $data['topicId']);
    $topicStmt->execute();
    $topic = $topicStmt->fetch();

    if (!$topic) {
        jsonResponse([
            'success' => false,
            'message' => 'Tema no encontrado'
        ], 404);
    }

    if ($topic['is_locked']) {
        jsonResponse([
            'success' => false,
            'message' => 'Este tema está bloqueado para nuevas respuestas'
        ], 403);
    }

    // Insertar respuesta
    $query = "INSERT INTO forum_replies (topic_id, user_id, content) 
              VALUES (:topic_id, :user_id, :content)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':topic_id', $data['topicId']);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->bindParam(':content', trim($data['content']));
    
    if ($stmt->execute()) {
        $replyId = $db->lastInsertId();

        // Actualizar contador de respuestas y última respuesta del tema
        $updateTopic = "UPDATE forum_topics
                       SET replies_count = replies_count + 1,
                           last_reply_at = NOW(),
                           last_reply_by = :user_id
                       WHERE id = :topic_id";
        $updateStmt = $db->prepare($updateTopic);
        $updateStmt->bindParam(':user_id', $_SESSION['user_id']);
        $updateStmt->bindParam(':topic_id', $data['topicId']);
        $updateStmt->execute();

        // Obtener información del usuario que responde
        $userQuery = "SELECT username FROM users WHERE id = :id";
        $userStmt = $db->prepare($userQuery);
        $userStmt->bindParam(':id', $_SESSION['user_id']);
        $userStmt->execute();
        $currentUser = $userStmt->fetch();

        // Obtener título del tema para la notificación
        $topicInfoQuery = "SELECT title, user_id FROM forum_topics WHERE id = :id";
        $topicInfoStmt = $db->prepare($topicInfoQuery);
        $topicInfoStmt->bindParam(':id', $data['topicId']);
        $topicInfoStmt->execute();
        $topicInfo = $topicInfoStmt->fetch();

        // Crear notificación para el autor del tema si no es el mismo usuario
        if ($topicInfo['user_id'] !== $_SESSION['user_id']) {
            // Generar UUID para MySQL
            $uuid1 = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );

            $notifQuery = "INSERT INTO notifications
                          (id, user_id, type, reference_id, reference_type, from_user_id, from_username, title, message)
                          VALUES
                          (:id, :user_id, 'forum_reply', :reference_id, 'forum_topic', :from_user_id, :from_username, :title, :message)";

            $notifStmt = $db->prepare($notifQuery);
            $notifStmt->bindParam(':id', $uuid1);
            $notifStmt->bindParam(':user_id', $topicInfo['user_id']);
            $notifStmt->bindParam(':reference_id', $data['topicId']);
            $notifStmt->bindParam(':from_user_id', $_SESSION['user_id']);
            $notifStmt->bindParam(':from_username', $currentUser['username']);
            $notifTitle = "Nueva respuesta en: " . $topicInfo['title'];
            $notifMessage = $currentUser['username'] . " respondió a tu tema";
            $notifStmt->bindParam(':title', $notifTitle);
            $notifStmt->bindParam(':message', $notifMessage);
            $notifStmt->execute();
        }

        // Si es una cita, crear notificación adicional
        if (isset($data['quotedReplyId']) && $data['quotedReplyId']) {
            $quotedReplyQuery = "SELECT user_id FROM forum_replies WHERE id = :id";
            $quotedReplyStmt = $db->prepare($quotedReplyQuery);
            $quotedReplyStmt->bindParam(':id', $data['quotedReplyId']);
            $quotedReplyStmt->execute();
            $quotedReply = $quotedReplyStmt->fetch();

            if ($quotedReply && $quotedReply['user_id'] !== $_SESSION['user_id']) {
                // Generar UUID para MySQL
                $uuid2 = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                    mt_rand(0, 0xffff),
                    mt_rand(0, 0x0fff) | 0x4000,
                    mt_rand(0, 0x3fff) | 0x8000,
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
                );

                $quoteNotifQuery = "INSERT INTO notifications
                                   (id, user_id, type, reference_id, reference_type, from_user_id, from_username, title, message)
                                   VALUES
                                   (:id, :user_id, 'forum_quote', :reference_id, 'forum_topic', :from_user_id, :from_username, :title, :message)";

                $quoteNotifStmt = $db->prepare($quoteNotifQuery);
                $quoteNotifStmt->bindParam(':id', $uuid2);
                $quoteNotifStmt->bindParam(':user_id', $quotedReply['user_id']);
                $quoteNotifStmt->bindParam(':reference_id', $data['topicId']);
                $quoteNotifStmt->bindParam(':from_user_id', $_SESSION['user_id']);
                $quoteNotifStmt->bindParam(':from_username', $currentUser['username']);
                $quoteTitle = "Te citaron en: " . $topicInfo['title'];
                $quoteMessage = $currentUser['username'] . " citó tu respuesta";
                $quoteNotifStmt->bindParam(':title', $quoteTitle);
                $quoteNotifStmt->bindParam(':message', $quoteMessage);
                $quoteNotifStmt->execute();
            }
        }

        jsonResponse([
            'success' => true,
            'message' => 'Respuesta agregada exitosamente',
            'id' => $replyId
        ]);
    } else {
        $errorInfo = $stmt->errorInfo();
        error_log("Error SQL en reply topic: " . print_r($errorInfo, true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al agregar la respuesta'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en reply-topic.php: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>