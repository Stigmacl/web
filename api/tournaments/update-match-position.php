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

if (!isset($data['matchId']) || !isset($data['position'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de partida y posición son requeridos'
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
            'message' => 'No tienes permisos para actualizar posiciones de partidas'
        ], 403);
    }

    // Verificar que la partida existe
    $checkQuery = "SELECT id FROM tournament_matches WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data['matchId']);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Partida no encontrada'
        ], 404);
    }

    // Verificar si las columnas existen, si no, crearlas
    $checkColumns = "SHOW COLUMNS FROM tournament_matches";
    $columnsResult = $db->query($checkColumns);
    $existingColumns = [];
    while ($column = $columnsResult->fetch()) {
        $existingColumns[] = $column['Field'];
    }

    if (!in_array('position_x', $existingColumns)) {
        $db->exec("ALTER TABLE tournament_matches ADD COLUMN position_x INT DEFAULT 0 AFTER notes");
    }
    if (!in_array('position_y', $existingColumns)) {
        $db->exec("ALTER TABLE tournament_matches ADD COLUMN position_y INT DEFAULT 0 AFTER position_x");
    }
    if (!in_array('is_position_locked', $existingColumns)) {
        $db->exec("ALTER TABLE tournament_matches ADD COLUMN is_position_locked TINYINT(1) DEFAULT 0 AFTER position_y");
    }

    // Actualizar la posición de la partida
    $updateQuery = "
        UPDATE tournament_matches 
        SET position_x = :position_x, 
            position_y = :position_y,
            is_position_locked = :is_locked
        WHERE id = :id
    ";
    
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':position_x', $data['position']['x'], PDO::PARAM_INT);
    $updateStmt->bindParam(':position_y', $data['position']['y'], PDO::PARAM_INT);
    $updateStmt->bindParam(':is_locked', isset($data['isLocked']) ? ($data['isLocked'] ? 1 : 0) : 0, PDO::PARAM_INT);
    $updateStmt->bindParam(':id', $data['matchId']);
    
    if (!$updateStmt->execute()) {
        error_log("Error SQL al actualizar posición de partida: " . print_r($updateStmt->errorInfo(), true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al actualizar la posición en la base de datos'
        ], 500);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Posición de partida actualizada exitosamente'
    ]);

} catch (Exception $e) {
    error_log('Error en update-match-position.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>