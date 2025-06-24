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

    // Verificar que el torneo existe
    $checkQuery = "SELECT id FROM tournaments WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $tournamentId);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
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

    // Obtener matches con información de participantes
    $query = "
        SELECT tm.*, 
               p1.participant_type as p1_type,
               p1.participant_id as p1_participant_id,
               CASE 
                   WHEN p1.participant_type = 'user' THEN u1.username
                   WHEN p1.participant_type = 'clan' THEN c1.name
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

        $matches[] = [
            'id' => $row['id'],
            'round' => (int)$row['round'],
            'matchNumber' => (int)$row['match_number'],
            'participant1' => $participant1,
            'participant2' => $participant2,
            'winnerId' => $row['winner_id'],
            'score1' => (int)$row['score1'],
            'score2' => (int)$row['score2'],
            'mapPlayed' => $row['map_played'],
            'status' => $row['status'],
            'scheduledAt' => $row['scheduled_at'],
            'completedAt' => $row['completed_at'],
            'notes' => $row['notes']
        ];
    }

    jsonResponse([
        'success' => true,
        'matches' => $matches
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