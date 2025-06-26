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

    // Crear tabla de participantes si no existe
    $createParticipantsTable = "
        CREATE TABLE IF NOT EXISTS `tournament_participants` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `tournament_id` int(11) NOT NULL,
          `participant_type` enum('user','clan','team') NOT NULL,
          `participant_id` varchar(50) NOT NULL,
          `team_name` varchar(255) DEFAULT NULL,
          `team_members` text DEFAULT NULL,
          `points` int(11) DEFAULT 0,
          `wins` int(11) DEFAULT 0,
          `losses` int(11) DEFAULT 0,
          `status` enum('registered','active','eliminated','winner') DEFAULT 'registered',
          `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (`id`),
          UNIQUE KEY `unique_participant` (`tournament_id`, `participant_type`, `participant_id`),
          KEY `fk_tournament_participants_tournament` (`tournament_id`),
          KEY `idx_participants_tournament_status` (`tournament_id`,`status`),
          CONSTRAINT `fk_tournament_participants_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    $db->exec($createParticipantsTable);

    // Obtener participantes
    $query = "
        SELECT tp.*, 
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
               END as clan_tag,
               CASE 
                   WHEN tp.participant_type = 'clan' THEN c.icon
                   ELSE NULL
               END as clan_icon
        FROM tournament_participants tp
        LEFT JOIN users u ON tp.participant_type = 'user' AND tp.participant_id = u.id
        LEFT JOIN clans c ON tp.participant_type = 'clan' AND tp.participant_id = c.id
        WHERE tp.tournament_id = :tournament_id
        ORDER BY tp.points DESC, tp.wins DESC, tp.registered_at ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':tournament_id', $tournamentId);
    $stmt->execute();

    $participants = [];
    while ($row = $stmt->fetch()) {
        // Decodificar team_members desde JSON
        $teamMembers = [];
        if (!empty($row['team_members'])) {
            $decodedMembers = json_decode($row['team_members'], true);
            if (is_array($decodedMembers)) {
                // Si los miembros están guardados como objetos con id y username
                if (isset($decodedMembers[0]) && is_array($decodedMembers[0]) && isset($decodedMembers[0]['username'])) {
                    $teamMembers = array_map(function($member) {
                        return $member['username'];
                    }, $decodedMembers);
                } else {
                    // Si son solo IDs, obtener nombres de los miembros del equipo
                    $memberNames = [];
                    foreach ($decodedMembers as $memberId) {
                        if (is_numeric($memberId)) {
                            $memberQuery = "SELECT username FROM users WHERE id = :id";
                            $memberStmt = $db->prepare($memberQuery);
                            $memberStmt->bindParam(':id', $memberId);
                            $memberStmt->execute();
                            $member = $memberStmt->fetch();
                            if ($member) {
                                $memberNames[] = $member['username'];
                            }
                        } else {
                            $memberNames[] = $memberId; // Si ya es un nombre
                        }
                    }
                    $teamMembers = $memberNames;
                }
            }
        }

        $participants[] = [
            'id' => $row['id'],
            'participantType' => $row['participant_type'],
            'participantId' => $row['participant_id'],
            'participantName' => $row['participant_name'],
            'participantAvatar' => $row['participant_avatar'],
            'clanTag' => $row['clan_tag'],
            'clanIcon' => $row['clan_icon'],
            'teamName' => $row['team_name'],
            'teamMembers' => $teamMembers,
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
    error_log('Error in get-participants.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>