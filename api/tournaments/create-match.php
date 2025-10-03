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

    // Verificar que el torneo existe y obtener información
    $tournamentQuery = "SELECT id, team_size, type FROM tournaments WHERE id = :id";
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

    // Crear tabla de matches si no existe
    $createMatchesTable = "
        CREATE TABLE IF NOT EXISTS `tournament_matches` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `tournament_id` int(11) NOT NULL,
          `round` int(11) NOT NULL,
          `match_number` int(11) NOT NULL,
          `team1_participants` text DEFAULT NULL,
          `team2_participants` text DEFAULT NULL,
          `participant1_id` int(11) DEFAULT NULL,
          `participant2_id` int(11) DEFAULT NULL,
          `winner_team` int(11) DEFAULT NULL,
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

    // Agregar columnas para equipos si no existen
    $checkColumns = "SHOW COLUMNS FROM tournament_matches";
    $columnsResult = $db->query($checkColumns);
    $existingColumns = [];
    while ($column = $columnsResult->fetch()) {
        $existingColumns[] = $column['Field'];
    }

    if (!in_array('team1_participants', $existingColumns)) {
        $db->exec("ALTER TABLE tournament_matches ADD COLUMN team1_participants text DEFAULT NULL AFTER participant2_id");
    }
    if (!in_array('team2_participants', $existingColumns)) {
        $db->exec("ALTER TABLE tournament_matches ADD COLUMN team2_participants text DEFAULT NULL AFTER team1_participants");
    }
    if (!in_array('winner_team', $existingColumns)) {
        $db->exec("ALTER TABLE tournament_matches ADD COLUMN winner_team int(11) DEFAULT NULL AFTER team2_participants");
    }

    // Preparar los datos para insertar
    $insertData = [
        'tournament_id' => $data['tournamentId'],
        'round' => $data['round'],
        'match_number' => $data['matchNumber'],
        'map_played' => isset($data['mapPlayed']) && !empty($data['mapPlayed']) ? $data['mapPlayed'] : null,
        'scheduled_at' => isset($data['scheduledAt']) && !empty($data['scheduledAt']) ? $data['scheduledAt'] : null,
        'notes' => isset($data['notes']) && !empty($data['notes']) ? $data['notes'] : null,
        'status' => 'pending'
    ];

    // Manejar participantes según el tamaño del equipo
    if ($tournament['team_size'] > 1) {
        // Para equipos múltiples, usar las nuevas columnas
        $team1Participants = isset($data['team1Participants']) && is_array($data['team1Participants']) 
            ? json_encode($data['team1Participants']) : null;
        $team2Participants = isset($data['team2Participants']) && is_array($data['team2Participants']) 
            ? json_encode($data['team2Participants']) : null;
        
        $insertData['team1_participants'] = $team1Participants;
        $insertData['team2_participants'] = $team2Participants;
        $insertData['participant1_id'] = null;
        $insertData['participant2_id'] = null;
    } else {
        // Para 1v1, usar el sistema original
        $insertData['participant1_id'] = isset($data['participant1Id']) && !empty($data['participant1Id']) ? $data['participant1Id'] : null;
        $insertData['participant2_id'] = isset($data['participant2Id']) && !empty($data['participant2Id']) ? $data['participant2Id'] : null;
        $insertData['team1_participants'] = null;
        $insertData['team2_participants'] = null;
    }

    // Verificar que los participantes existen si se especificaron
    if ($tournament['team_size'] == 1) {
        // Para 1v1, verificar participantes individuales
        if ($insertData['participant1_id']) {
            $checkP1 = "SELECT id FROM tournament_participants WHERE id = :id AND tournament_id = :tournament_id";
            $checkP1Stmt = $db->prepare($checkP1);
            $checkP1Stmt->bindParam(':id', $insertData['participant1_id']);
            $checkP1Stmt->bindParam(':tournament_id', $data['tournamentId']);
            $checkP1Stmt->execute();
            if (!$checkP1Stmt->fetch()) {
                jsonResponse([
                    'success' => false,
                    'message' => 'Participante 1 no válido para este torneo'
                ], 400);
            }
        }
        
        if ($insertData['participant2_id']) {
            $checkP2 = "SELECT id FROM tournament_participants WHERE id = :id AND tournament_id = :tournament_id";
            $checkP2Stmt = $db->prepare($checkP2);
            $checkP2Stmt->bindParam(':id', $insertData['participant2_id']);
            $checkP2Stmt->bindParam(':tournament_id', $data['tournamentId']);
            $checkP2Stmt->execute();
            if (!$checkP2Stmt->fetch()) {
                jsonResponse([
                    'success' => false,
                    'message' => 'Participante 2 no válido para este torneo'
                ], 400);
            }
        }
    } else {
        // Para equipos múltiples, verificar que los participantes existen
        if ($insertData['team1_participants']) {
            $team1Ids = json_decode($insertData['team1_participants'], true);
            if (is_array($team1Ids)) {
                foreach ($team1Ids as $participantId) {
                    $checkP = "SELECT id FROM tournament_participants WHERE id = :id AND tournament_id = :tournament_id";
                    $checkPStmt = $db->prepare($checkP);
                    $checkPStmt->bindParam(':id', $participantId);
                    $checkPStmt->bindParam(':tournament_id', $data['tournamentId']);
                    $checkPStmt->execute();
                    if (!$checkPStmt->fetch()) {
                        jsonResponse([
                            'success' => false,
                            'message' => "Participante del equipo 1 (ID: $participantId) no válido para este torneo"
                        ], 400);
                    }
                }
            }
        }
        
        if ($insertData['team2_participants']) {
            $team2Ids = json_decode($insertData['team2_participants'], true);
            if (is_array($team2Ids)) {
                foreach ($team2Ids as $participantId) {
                    $checkP = "SELECT id FROM tournament_participants WHERE id = :id AND tournament_id = :tournament_id";
                    $checkPStmt = $db->prepare($checkP);
                    $checkPStmt->bindParam(':id', $participantId);
                    $checkPStmt->bindParam(':tournament_id', $data['tournamentId']);
                    $checkPStmt->execute();
                    if (!$checkPStmt->fetch()) {
                        jsonResponse([
                            'success' => false,
                            'message' => "Participante del equipo 2 (ID: $participantId) no válido para este torneo"
                        ], 400);
                    }
                }
            }
        }
    }

    // Crear la partida
    $insertQuery = "
        INSERT INTO tournament_matches (
            tournament_id, round, match_number, participant1_id, participant2_id, 
            team1_participants, team2_participants, map_played, scheduled_at, notes, status
        ) VALUES (
            :tournament_id, :round, :match_number, :participant1_id, :participant2_id, 
            :team1_participants, :team2_participants, :map_played, :scheduled_at, :notes, :status
        )
    ";
    
    $insertStmt = $db->prepare($insertQuery);
    
    // Bind de todos los parámetros
    $insertStmt->bindParam(':tournament_id', $insertData['tournament_id']);
    $insertStmt->bindParam(':round', $insertData['round']);
    $insertStmt->bindParam(':match_number', $insertData['match_number']);
    $insertStmt->bindParam(':participant1_id', $insertData['participant1_id']);
    $insertStmt->bindParam(':participant2_id', $insertData['participant2_id']);
    $insertStmt->bindParam(':team1_participants', $insertData['team1_participants']);
    $insertStmt->bindParam(':team2_participants', $insertData['team2_participants']);
    $insertStmt->bindParam(':map_played', $insertData['map_played']);
    $insertStmt->bindParam(':scheduled_at', $insertData['scheduled_at']);
    $insertStmt->bindParam(':notes', $insertData['notes']);
    $insertStmt->bindParam(':status', $insertData['status']);
    
    if (!$insertStmt->execute()) {
        error_log("Error SQL al crear partida: " . print_r($insertStmt->errorInfo(), true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al crear la partida en la base de datos'
        ], 500);
    }

    $matchId = $db->lastInsertId();

    jsonResponse([
        'success' => true,
        'message' => 'Partida creada exitosamente',
        'matchId' => $matchId,
        'teamSize' => $tournament['team_size']
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