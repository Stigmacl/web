<?php
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

try {
    $database = new Database();
    $db = $database->getConnection();

    if (isset($data['notificationId'])) {
        $query = "UPDATE notifications
                  SET is_read = 1, read_at = NOW()
                  WHERE id = :id AND user_id = :user_id";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data['notificationId']);
        $stmt->bindParam(':user_id', $_SESSION['user_id']);
        $stmt->execute();
    } elseif (isset($data['markAll']) && $data['markAll']) {
        $query = "UPDATE notifications
                  SET is_read = 1, read_at = NOW()
                  WHERE user_id = :user_id AND is_read = 0";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $_SESSION['user_id']);
        $stmt->execute();
    }

    jsonResponse([
        'success' => true,
        'message' => 'Notificación(es) marcada(s) como leída(s)'
    ]);

} catch (Exception $e) {
    error_log("Error en mark-read: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>
