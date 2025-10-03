<?php
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

if (!isset($data['topicId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID del tema es requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el usuario es administrador
    $userQuery = "SELECT role FROM users WHERE id = :user_id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':user_id', $_SESSION['user_id']);
    $userStmt->execute();
    $user = $userStmt->fetch();

    if ($user['role'] !== 'admin') {
        jsonResponse([
            'success' => false,
            'message' => 'Solo los administradores pueden bloquear/desbloquear temas'
        ], 403);
    }

    // Verificar que el tema existe
    $checkQuery = "SELECT is_locked FROM forum_topics WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data['topicId']);
    $checkStmt->execute();
    $topic = $checkStmt->fetch();

    if (!$topic) {
        jsonResponse([
            'success' => false,
            'message' => 'Tema no encontrado'
        ], 404);
    }

    // Alternar el estado de bloqueo
    $newLockState = !$topic['is_locked'];
    $query = "UPDATE forum_topics SET is_locked = :is_locked WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':is_locked', $newLockState, PDO::PARAM_BOOL);
    $stmt->bindParam(':id', $data['topicId']);

    if ($stmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => $newLockState ? 'Tema bloqueado' : 'Tema desbloqueado',
            'isLocked' => $newLockState
        ]);
    } else {
        jsonResponse([
            'success' => false,
            'message' => 'Error al actualizar el tema'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en toggle-lock.php: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>
