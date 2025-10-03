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

if (!isset($data['tournamentId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de torneo requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el torneo existe y está en registro
    $tournamentQuery = "SELECT * FROM tournaments WHERE id = :id";
    $tournamentStmt = $db->prepare($tournamentQuery);
    $tournamentStmt->bindParam(':id', $data['tournamentId']);
    $tournamentStmt->execute();
    $tournament = $tournamentStmt->fetch();

    if (!$tournament) {
        jsonResponse([
            'success' => false,
            'message' => 'Torneo no encontrado'
        ], 404);
    }

    if ($tournament['status'] !== 'registration') {
        jsonResponse([
            'success' => false,
            'message' => 'El torneo no está abierto para registro'
        ], 400);
    }

    // Verificar si ya está registrado
    $checkQuery = "SELECT id FROM tournament_participants WHERE tournament_id = :tournament_id AND participant_type = 'user' AND participant_id = :user_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':tournament_id', $data['tournamentId']);
    $checkStmt->bindParam(':user_id', $_SESSION['user_id']);
    $checkStmt->execute();

    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Ya estás registrado en este torneo'
        ], 400);
    }

    // Verificar límite de participantes
    $countQuery = "SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = :tournament_id";
    $countStmt = $db->prepare($countQuery);
    $countStmt->bindParam(':tournament_id', $data['tournamentId']);
    $countStmt->execute();
    $count = $countStmt->fetch()['count'];

    if ($count >= $tournament['max_participants']) {
        jsonResponse([
            'success' => false,
            'message' => 'El torneo está lleno'
        ], 400);
    }

    // Obtener información del usuario
    $userQuery = "SELECT username, avatar, clan FROM users WHERE id = :id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':id', $_SESSION['user_id']);
    $userStmt->execute();
    $user = $userStmt->fetch();

    // Registrar al usuario
    $insertQuery = "INSERT INTO tournament_participants (tournament_id, participant_type, participant_id, team_name) VALUES (:tournament_id, 'user', :user_id, :team_name)";
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->bindParam(':tournament_id', $data['tournamentId']);
    $insertStmt->bindParam(':user_id', $_SESSION['user_id']);
    $insertStmt->bindParam(':team_name', $data['teamName'] ?? $user['username']);
    $insertStmt->execute();

    // Actualizar contador de participantes en el torneo
    $updateQuery = "UPDATE tournaments SET participant_count = participant_count + 1 WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':id', $data['tournamentId']);
    $updateStmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Te has registrado exitosamente en el torneo'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>