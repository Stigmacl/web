<?php
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

if (!isset($data['userId']) || !isset($data['type']) || !isset($data['title']) || !isset($data['message'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Datos incompletos'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $getUserQuery = "SELECT username FROM users WHERE id = :id";
    $userStmt = $db->prepare($getUserQuery);
    $userStmt->bindParam(':id', $_SESSION['user_id']);
    $userStmt->execute();
    $user = $userStmt->fetch();

    // Generar UUID para MySQL
    $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );

    $query = "INSERT INTO notifications
              (id, user_id, type, reference_id, reference_type, from_user_id, from_username, title, message)
              VALUES
              (:id, :user_id, :type, :reference_id, :reference_type, :from_user_id, :from_username, :title, :message)";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $uuid);
    $stmt->bindParam(':user_id', $data['userId']);
    $stmt->bindParam(':type', $data['type']);
    $stmt->bindParam(':reference_id', $data['referenceId']);
    $stmt->bindParam(':reference_type', $data['referenceType']);
    $stmt->bindParam(':from_user_id', $_SESSION['user_id']);
    $stmt->bindParam(':from_username', $user['username']);
    $stmt->bindParam(':title', $data['title']);
    $stmt->bindParam(':message', $data['message']);

    if ($stmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Notificación creada exitosamente'
        ]);
    } else {
        jsonResponse([
            'success' => false,
            'message' => 'Error al crear la notificación'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en create notification: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>
