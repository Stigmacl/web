<?php
require_once '../config/database.php';

if (!isset($_GET['tournamentId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de torneo requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $tournamentId = $_GET['tournamentId'];

    // Verificar que el torneo existe y obtener información
    $checkQuery = "SELECT id, team_size, type FROM tournaments WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $tournamentId);
    $checkStmt->execute();
    $tournament = $checkStmt->fetch();

    if (!$tournament) {
        jsonResponse([
            'success' => false,
            'message' => 'Torneo no encontrado'
        ], 404);
    }

    // Crear tabla de matches si no existe (con las nuevas columnas)
    $createMatchesTable = "
        CREATE TABLE IF NOT EXISTS `tournament_matches` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `tournament_id` int(11) NOT NULL,
          `round` int(11) NOT NULL,
          `match_number` int(11) NOT NULL,
          `participant1_id` int(11) DEFAULT NULL,
          `participant2_id` int(11) DEFAULT NULL,
          `team1_participants` text DEFAULT NULL,
          `team2_participants` text DEFAULT NULL,
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

    // Función para obtener información de participantes por IDs
    function getParticipantsByIds($db, $participantIds) {
        if (empty($participantIds)) return [];
        
        $placeholders = str_repeat('?,', count($participantIds) - 1) . '?';
        $query = "
            SELECT tp.id, tp.participant_type, tp.participant_id, tp.team_name,
                   CASE 
                       WHEN tp.participant_type = 'user' THEN u.username
                       WHEN tp.participant_type = 'clan' THEN c.name
                       WHEN tp.participant_type = 'team' THEN tp.team_name
                   END as participant_name,
                   CASE 
                       WHEN tp.participant_type = 'user' THEN u.avatar
                       WHEN tp.participant_type = 'clan' THEN c.logo
                       ELSE NULL
                   END as participant_avatar,
                   CASE 
                       WHEN tp.participant_type = 'clan' THEN c.tag
                       ELSE NULL
                   END as clan_tag
            FROM tournament_participants tp
            LEFT JOIN users u ON tp.participant_type = 'user' AND tp.participant_id = u.id
            LEFT JOIN clans c ON tp.participant_type = 'clan' AND tp.participant_id = c.id
            WHERE tp.id IN ($placeholders)
        ";
        
        $stmt = $db->prepare($query);
        $stmt->execute($participantIds);
        
        $participants = [];
        while ($row = $stmt->fetch()) {
            $participants[] = [
                'id' => $row['id'],
                'type' => $row['participant_type'],
                'name' => $row['participant_name'],
                'teamName' => $row['team_name'],
                'avatar' => $row['participant_avatar'],
                'clanTag' => $row['clan_tag']
            ];
        }
        
        return $participants;
    }

    // Obtener matches con información de participantes
    $query = "
        SELECT tm.*, 
               p1.participant_type as p1_type,
               p1.participant_id as p1_participant_id,
               CASE 
                   WHEN p1.participant_type = 'user' THEN u1.username
                   WHEN p1.participant_type = 'clan' THEN c1.name
                   WHEN p1.participant_type = 'team' THEN p1.team_name
               END as p1_name,
               p1.team_name as p1_team_name,
               CASE 
                   WHEN p1.participant_type = 'user' THEN u1.avatar
                   WHEN p1.participant_type = 'clan' THEN c1.logo
               END as p1_avatar,
               CASE 
                   WHEN p1.participant_type = 'clan' THEN c1.tag
                   ELSE NULL
               END as p1_clan_tag,
               p2.participant_type as p2_type,
               p2.participant_id as p2_participant_id,
               CASE 
                   WHEN p2.participant_type = 'user' THEN u2.username
                   WHEN p2.participant_type = 'clan' THEN c2.name
                   WHEN p2.participant_type = 'team' THEN p2.team_name
               END as p2_name,
               p2.team_name as p2_team_name,
               CASE 
                   WHEN p2.participant_type = 'user' THEN u2.avatar
                   WHEN p2.participant_type = 'clan' THEN c2.logo
               END as p2_avatar,
               CASE 
                   WHEN p2.participant_type = 'clan' THEN c2.tag
                   ELSE NULL
               END as p2_clan_tag
        FROM tournament_matches tm
        LEFT JOIN tournament_participants p1 ON tm.participant1_id = p1.id
        LEFT JOIN tournament_participants p2 ON tm.participant2_id = p2.id
        LEFT JOIN users u1 ON p1.participant_type = 'user' AND p1.participant_id = u1.id
        LEFT JOIN clans c1 ON p1.participant_type = 'clan' AND p1.participant_id = c1.id
        LEFT JOIN users u2 ON p2.participant_type = 'user' AND p2.participant_id = u2.id
        LEFT JOIN clans c2 ON p2.participant_type = 'clan' AND p2.participant_id = c2.id
        WHERE tm.tournament_id = :tournament_id
        ORDER BY tm.round ASC, tm.match_number ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':tournament_id', $tournamentId);
    $stmt->execute();

    $matches = [];
    while ($row = $stmt->fetch()) {
        $participant1 = null;
        $participant2 = null;
        $team1Participants = [];
        $team2Participants = [];

        // Para torneos con equipos múltiples
        if ($tournament['team_size'] > 1) {
            if (!empty($row['team1_participants'])) {
                $team1Ids = json_decode($row['team1_participants'], true);
                if (is_array($team1Ids)) {
                    $team1Participants = getParticipantsByIds($db, $team1Ids);
                }
            }
            
            if (!empty($row['team2_participants'])) {
                $team2Ids = json_decode($row['team2_participants'], true);
                if (is_array($team2Ids)) {
                    $team2Participants = getParticipantsByIds($db, $team2Ids);
                }
            }
        } else {
            // Para 1v1, usar el sistema original
            if ($row['participant1_id']) {
                $participant1 = [
                    'id' => $row['participant1_id'],
                    'type' => $row['p1_type'],
                    'name' => $row['p1_name'],
                    'teamName' => $row['p1_team_name'],
                    'avatar' => $row['p1_avatar'],
                    'clanTag' => $row['p1_clan_tag']
                ];
            }

            if ($row['participant2_id']) {
                $participant2 = [
                    'id' => $row['participant2_id'],
                    'type' => $row['p2_type'],
                    'name' => $row['p2_name'],
                    'teamName' => $row['p2_team_name'],
                    'avatar' => $row['p2_avatar'],
                    'clanTag' => $row['p2_clan_tag']
                ];
            }
        }

        $matches[] = [
            'id' => $row['id'],
            'round' => (int)$row['round'],
            'matchNumber' => (int)$row['match_number'],
            'participant1' => $participant1,
            'participant2' => $participant2,
            'team1Participants' => $team1Participants,
            'team2Participants' => $team2Participants,
            'winnerId' => $row['winner_id'],
            'winnerTeam' => $row['winner_team'],
            'score1' => (int)$row['score1'],
            'score2' => (int)$row['score2'],
            'mapPlayed' => $row['map_played'],
            'status' => $row['status'],
            'scheduledAt' => $row['scheduled_at'],
            'completedAt' => $row['completed_at'],
            'notes' => $row['notes'],
            'teamSize' => $tournament['team_size']
        ];
    }

    jsonResponse([
        'success' => true,
        'matches' => $matches,
        'tournament' => $tournament
    ]);

} catch (Exception $e) {
    error_log('Error in get-matches.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>