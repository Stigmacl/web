<?php
require_once '../config/database.php';

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

startSecureSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'No autorizado'
    ], 401);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT * FROM notifications
              WHERE user_id = :user_id
              ORDER BY created_at DESC
              LIMIT 50";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->execute();

    $notifications = [];
    while ($row = $stmt->fetch()) {
        $notifications[] = [
            'id' => $row['id'],
            'userId' => $row['user_id'],
            'type' => $row['type'],
            'referenceId' => $row['reference_id'],
            'referenceType' => $row['reference_type'],
            'fromUserId' => $row['from_user_id'],
            'fromUsername' => $row['from_username'],
            'title' => $row['title'],
            'message' => $row['message'],
            'isRead' => (bool)$row['is_read'],
            'createdAt' => $row['created_at'],
            'readAt' => $row['read_at']
        ];
    }

    jsonResponse([
        'success' => true,
        'notifications' => $notifications
    ]);

} catch (Exception $e) {
    error_log("Error en get-all notifications: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>
