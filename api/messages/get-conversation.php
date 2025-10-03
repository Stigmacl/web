<?php
require_once '../config/database.php';

startSecureSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'No autorizado'
    ], 401);
}

if (!isset($_GET['userId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de usuario requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT m.*, 
                     u1.username as from_username,
                     u2.username as to_username
              FROM messages m
              JOIN users u1 ON m.from_user_id = u1.id
              JOIN users u2 ON m.to_user_id = u2.id
              WHERE (m.from_user_id = :user_id AND m.to_user_id = :other_user_id)
                 OR (m.from_user_id = :other_user_id AND m.to_user_id = :user_id)
              ORDER BY m.created_at ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->bindParam(':other_user_id', $_GET['userId']);
    $stmt->execute();

    $messages = [];
    while ($row = $stmt->fetch()) {
        $messages[] = [
            'id' => $row['id'],
            'fromUserId' => $row['from_user_id'],
            'toUserId' => $row['to_user_id'],
            'content' => $row['content'],
            'isRead' => (bool)$row['is_read'],
            'timestamp' => $row['created_at']
        ];
    }

    jsonResponse([
        'success' => true,
        'messages' => $messages
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>