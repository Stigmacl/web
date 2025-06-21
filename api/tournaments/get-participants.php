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

    $query = "SELECT tp.*, 
                     CASE 
                         WHEN tp.participant_type = 'user' THEN u.username
                         WHEN tp.participant_type = 'clan' THEN c.name
                     END as participant_name,
                     CASE 
                         WHEN tp.participant_type = 'user' THEN u.avatar
                         WHEN tp.participant_type = 'clan' THEN c.logo
                     END as participant_avatar,
                     CASE 
                         WHEN tp.participant_type = 'clan' THEN c.tag
                         ELSE NULL
                     END as clan_tag,
                     CASE 
                         WHEN tp.participant_type = 'clan' THEN c.icon
                         ELSE NULL
                     END as clan_icon
              FROM tournament_participants tp
              LEFT JOIN users u ON tp.participant_type = 'user' AND tp.participant_id = u.id
              LEFT JOIN clans c ON tp.participant_type = 'clan' AND tp.participant_id = c.id
              WHERE tp.tournament_id = :tournament_id
              ORDER BY tp.points DESC, tp.wins DESC, tp.registered_at ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':tournament_id', $_GET['tournamentId']);
    $stmt->execute();

    $participants = [];
    while ($row = $stmt->fetch()) {
        $participants[] = [
            'id' => $row['id'],
            'participantType' => $row['participant_type'],
            'participantId' => $row['participant_id'],
            'participantName' => $row['participant_name'],
            'participantAvatar' => $row['participant_avatar'],
            'clanTag' => $row['clan_tag'],
            'clanIcon' => $row['clan_icon'],
            'teamName' => $row['team_name'],
            'teamMembers' => $row['team_members'] ? json_decode($row['team_members'], true) : [],
            'points' => (int)$row['points'],
            'wins' => (int)$row['wins'],
            'losses' => (int)$row['losses'],
            'status' => $row['status'],
            'registeredAt' => $row['registered_at']
        ];
    }

    jsonResponse([
        'success' => true,
        'participants' => $participants
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>