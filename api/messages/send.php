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

if (!isset($data['toUserId']) || !isset($data['content'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Usuario destinatario y contenido son requeridos'
    ], 400);
}

if (trim($data['content']) === '') {
    jsonResponse([
        'success' => false,
        'message' => 'El mensaje no puede estar vacío'
    ], 400);
}

if ($data['toUserId'] == $_SESSION['user_id']) {
    jsonResponse([
        'success' => false,
        'message' => 'No puedes enviarte un mensaje a ti mismo'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el usuario destinatario existe y está activo
    $checkUserQuery = "SELECT id FROM users WHERE id = :id AND is_active = 1";
    $checkUserStmt = $db->prepare($checkUserQuery);
    $checkUserStmt->bindParam(':id', $data['toUserId']);
    $checkUserStmt->execute();

    if (!$checkUserStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Usuario destinatario no encontrado o inactivo'
        ], 404);
    }

    $query = "INSERT INTO messages (from_user_id, to_user_id, content) 
              VALUES (:from_user_id, :to_user_id, :content)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':from_user_id', $_SESSION['user_id']);
    $stmt->bindParam(':to_user_id', $data['toUserId']);
    $stmt->bindParam(':content', trim($data['content']));
    
    if ($stmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Mensaje enviado exitosamente',
            'id' => $db->lastInsertId()
        ]);
    } else {
        $errorInfo = $stmt->errorInfo();
        error_log("Error SQL en send message: " . print_r($errorInfo, true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al enviar el mensaje'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en send-message.php: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>