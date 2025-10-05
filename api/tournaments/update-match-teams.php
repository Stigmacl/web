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

if (!isset($data['matchId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de partida requerido'
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
            'message' => 'No tienes permisos para actualizar nombres de equipos'
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

    if (!in_array('team1_custom_name', $existingColumns)) {
        $db->exec("ALTER TABLE tournament_matches ADD COLUMN team1_custom_name VARCHAR(255) DEFAULT NULL AFTER notes");
    }
    if (!in_array('team2_custom_name', $existingColumns)) {
        $db->exec("ALTER TABLE tournament_matches ADD COLUMN team2_custom_name VARCHAR(255) DEFAULT NULL AFTER team1_custom_name");
    }

    // Actualizar los nombres personalizados de los equipos
    $updateQuery = "
        UPDATE tournament_matches 
        SET team1_custom_name = :team1_name, 
            team2_custom_name = :team2_name
        WHERE id = :id
    ";
    
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':team1_name', $data['team1Name']);
    $updateStmt->bindParam(':team2_name', $data['team2Name']);
    $updateStmt->bindParam(':id', $data['matchId']);
    
    if (!$updateStmt->execute()) {
        error_log("Error SQL al actualizar nombres de equipos: " . print_r($updateStmt->errorInfo(), true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al actualizar los nombres en la base de datos'
        ], 500);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Nombres de equipos actualizados exitosamente'
    ]);

} catch (Exception $e) {
    error_log('Error en update-match-teams.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>