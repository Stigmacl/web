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

if (!isset($data['topicId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID del tema requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el tema existe y obtener información del autor
    $topicQuery = "SELECT user_id FROM forum_topics WHERE id = :id";
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

    // Verificar permisos: el usuario debe ser el autor del tema o un administrador
    $userQuery = "SELECT role FROM users WHERE id = :user_id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':user_id', $_SESSION['user_id']);
    $userStmt->execute();
    $currentUser = $userStmt->fetch();

    if (!$currentUser || ($topic['user_id'] != $_SESSION['user_id'] && $currentUser['role'] !== 'admin')) {
        jsonResponse([
            'success' => false,
            'message' => 'No tienes permisos para eliminar este tema'
        ], 403);
    }

    // Eliminar el tema (las respuestas se eliminan automáticamente por CASCADE)
    $deleteQuery = "DELETE FROM forum_topics WHERE id = :id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':id', $data['topicId']);
    
    if ($deleteStmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Tema eliminado exitosamente'
        ]);
    } else {
        $errorInfo = $deleteStmt->errorInfo();
        error_log("Error SQL en delete topic: " . print_r($errorInfo, true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al eliminar el tema'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en delete-topic.php: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>