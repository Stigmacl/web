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