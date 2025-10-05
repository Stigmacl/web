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

if (!isset($data['participantId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de participante requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el usuario sea admin
    $userQuery = "SELECT role FROM users WHERE id = :id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':id', $_SESSION['user_id']);
    $userStmt->execute();
    $user = $userStmt->fetch();

    if (!$user || $user['role'] !== 'admin') {
        jsonResponse([
            'success' => false,
            'message' => 'No tienes permisos para remover participantes'
        ], 403);
    }

    // Obtener información del participante
    $participantQuery = "SELECT tournament_id FROM tournament_participants WHERE id = :id";
    $participantStmt = $db->prepare($participantQuery);
    $participantStmt->bindParam(':id', $data['participantId']);
    $participantStmt->execute();
    $participant = $participantStmt->fetch();

    if (!$participant) {
        jsonResponse([
            'success' => false,
            'message' => 'Participante no encontrado'
        ], 404);
    }

    // Eliminar participante
    $deleteQuery = "DELETE FROM tournament_participants WHERE id = :id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':id', $data['participantId']);
    $deleteStmt->execute();

    // Actualizar contador de participantes
    $updateCountQuery = "UPDATE tournaments SET participant_count = participant_count - 1 WHERE id = :id";
    $updateCountStmt = $db->prepare($updateCountQuery);
    $updateCountStmt->bindParam(':id', $participant['tournament_id']);
    $updateCountStmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Participante removido exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>