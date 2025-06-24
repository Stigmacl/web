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

if (!isset($data['tournamentId']) || !isset($data['round']) || !isset($data['matchNumber'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Datos requeridos: tournamentId, round, matchNumber'
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
            'message' => 'No tienes permisos para crear partidas'
        ], 403);
    }

    // Verificar que el torneo existe
    $tournamentQuery = "SELECT id FROM tournaments WHERE id = :id";
    $tournamentStmt = $db->prepare($tournamentQuery);
    $tournamentStmt->bindParam(':id', $data['tournamentId']);
    $tournamentStmt->execute();

    if (!$tournamentStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Torneo no encontrado'
        ], 404);
    }

    // Crear tabla de matches si no existe
    $createMatchesTable = "
        CREATE TABLE IF NOT EXISTS `tournament_matches` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `tournament_id` int(11) NOT NULL,
          `round` int(11) NOT NULL,
          `match_number` int(11) NOT NULL,
          `participant1_id` int(11) DEFAULT NULL,
          `participant2_id` int(11) DEFAULT NULL,
          `winner_id` int(11) DEFAULT NULL,
          `score1` int(11) DEFAULT 0,
          `score2` int(11) DEFAULT 0,
          `map_played` varchar(255) DEFAULT NULL,
          `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
          `scheduled_at` datetime DEFAULT NULL,
          `completed_at` datetime DEFAULT NULL,
          `notes` text DEFAULT NULL,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`),
          KEY `fk_tournament_matches_tournament` (`tournament_id`),
          KEY `fk_tournament_matches_participant1` (`participant1_id`),
          KEY `fk_tournament_matches_participant2` (`participant2_id`),
          KEY `fk_tournament_matches_winner` (`winner_id`),
          KEY `idx_round` (`round`),
          KEY `idx_status` (`status`),
          KEY `idx_matches_tournament_round` (`tournament_id`,`round`),
          CONSTRAINT `fk_tournament_matches_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_tournament_matches_participant1` FOREIGN KEY (`participant1_id`) REFERENCES `tournament_participants` (`id`) ON DELETE SET NULL,
          CONSTRAINT `fk_tournament_matches_participant2` FOREIGN KEY (`participant2_id`) REFERENCES `tournament_participants` (`id`) ON DELETE SET NULL,
          CONSTRAINT `fk_tournament_matches_winner` FOREIGN KEY (`winner_id`) REFERENCES `tournament_participants` (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    $db->exec($createMatchesTable);

    // Preparar los datos para insertar
    $insertData = [
        'tournament_id' => $data['tournamentId'],
        'round' => $data['round'],
        'match_number' => $data['matchNumber'],
        'participant1_id' => isset($data['participant1Id']) && !empty($data['participant1Id']) ? $data['participant1Id'] : null,
        'participant2_id' => isset($data['participant2Id']) && !empty($data['participant2Id']) ? $data['participant2Id'] : null,
        'map_played' => isset($data['mapPlayed']) && !empty($data['mapPlayed']) ? $data['mapPlayed'] : null,
        'scheduled_at' => isset($data['scheduledAt']) && !empty($data['scheduledAt']) ? $data['scheduledAt'] : null,
        'notes' => isset($data['notes']) && !empty($data['notes']) ? $data['notes'] : null,
        'status' => 'pending'
    ];

    // Crear la partida
    $insertQuery = "
        INSERT INTO tournament_matches (
            tournament_id, round, match_number, participant1_id, participant2_id, 
            map_played, scheduled_at, notes, status
        ) VALUES (
            :tournament_id, :round, :match_number, :participant1_id, :participant2_id, 
            :map_played, :scheduled_at, :notes, :status
        )
    ";
    
    $insertStmt = $db->prepare($insertQuery);
    
    // Bind de todos los parámetros
    $insertStmt->bindParam(':tournament_id', $insertData['tournament_id']);
    $insertStmt->bindParam(':round', $insertData['round']);
    $insertStmt->bindParam(':match_number', $insertData['match_number']);
    $insertStmt->bindParam(':participant1_id', $insertData['participant1_id']);
    $insertStmt->bindParam(':participant2_id', $insertData['participant2_id']);
    $insertStmt->bindParam(':map_played', $insertData['map_played']);
    $insertStmt->bindParam(':scheduled_at', $insertData['scheduled_at']);
    $insertStmt->bindParam(':notes', $insertData['notes']);
    $insertStmt->bindParam(':status', $insertData['status']);
    
    $insertStmt->execute();

    $matchId = $db->lastInsertId();

    jsonResponse([
        'success' => true,
        'message' => 'Partida creada exitosamente',
        'matchId' => $matchId
    ]);

} catch (Exception $e) {
    error_log('Error creating match: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>