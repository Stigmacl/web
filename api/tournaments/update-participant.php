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
            'message' => 'No tienes permisos para actualizar participantes'
        ], 403);
    }

    // Construir query de actualización dinámicamente
    $updateFields = [];
    $params = [':id' => $data['participantId']];

    if (isset($data['points'])) {
        $updateFields[] = "points = :points";
        $params[':points'] = $data['points'];
    }

    if (isset($data['wins'])) {
        $updateFields[] = "wins = :wins";
        $params[':wins'] = $data['wins'];
    }

    if (isset($data['losses'])) {
        $updateFields[] = "losses = :losses";
        $params[':losses'] = $data['losses'];
    }

    if (isset($data['draws'])) {
        $updateFields[] = "draws = :draws";
        $params[':draws'] = $data['draws'];
    }

    if (isset($data['status'])) {
        $updateFields[] = "status = :status";
        $params[':status'] = $data['status'];
    }

    if (empty($updateFields)) {
        jsonResponse([
            'success' => false,
            'message' => 'No hay campos para actualizar'
        ], 400);
    }

    $query = "UPDATE tournament_participants SET " . implode(', ', $updateFields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Participante actualizado exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>