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

    $query = "SELECT tm.*,
                     p1.participant_type as p1_type,
                     p1.team_name as p1_team_name,
                     CASE 
                         WHEN p1.participant_type = 'user' THEN u1.username
                         WHEN p1.participant_type = 'clan' THEN c1.name
                     END as p1_name,
                     CASE 
                         WHEN p1.participant_type = 'user' THEN u1.avatar
                         WHEN p1.participant_type = 'clan' THEN c1.logo
                     END as p1_avatar,
                     CASE 
                         WHEN p1.participant_type = 'clan' THEN c1.tag
                         ELSE NULL
                     END as p1_clan_tag,
                     
                     p2.participant_type as p2_type,
                     p2.team_name as p2_team_name,
                     CASE 
                         WHEN p2.participant_type = 'user' THEN u2.username
                         WHEN p2.participant_type = 'clan' THEN c2.name
                     END as p2_name,
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
              ORDER BY tm.round ASC, tm.match_number ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':tournament_id', $_GET['tournamentId']);
    $stmt->execute();

    $matches = [];
    while ($row = $stmt->fetch()) {
        $matches[] = [
            'id' => $row['id'],
            'round' => (int)$row['round'],
            'matchNumber' => (int)$row['match_number'],
            'participant1' => $row['participant1_id'] ? [
                'id' => $row['participant1_id'],
                'type' => $row['p1_type'],
                'name' => $row['p1_name'],
                'teamName' => $row['p1_team_name'],
                'avatar' => $row['p1_avatar'],
                'clanTag' => $row['p1_clan_tag']
            ] : null,
            'participant2' => $row['participant2_id'] ? [
                'id' => $row['participant2_id'],
                'type' => $row['p2_type'],
                'name' => $row['p2_name'],
                'teamName' => $row['p2_team_name'],
                'avatar' => $row['p2_avatar'],
                'clanTag' => $row['p2_clan_tag']
            ] : null,
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
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>