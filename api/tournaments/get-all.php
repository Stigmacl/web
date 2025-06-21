<?php
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que la tabla tournaments existe
    $checkTable = "SHOW TABLES LIKE 'tournaments'";
    $tableExists = $db->query($checkTable);
    
    if ($tableExists->rowCount() == 0) {
        jsonResponse([
            'success' => true,
            'tournaments' => []
        ]);
        return;
    }

    $query = "SELECT t.*, 
                     u.username as created_by_username,
                     (SELECT COUNT(*) FROM tournament_participants tp WHERE tp.tournament_id = t.id) as participant_count
              FROM tournaments t 
              LEFT JOIN users u ON t.created_by = u.id
              ORDER BY t.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();

    $tournaments = [];
    while ($row = $stmt->fetch()) {
        $tournaments[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'description' => $row['description'],
            'type' => $row['type'],
            'teamSize' => (int)$row['team_size'],
            'maxParticipants' => (int)$row['max_participants'],
            'participantCount' => (int)$row['participant_count'],
            'status' => $row['status'],
            'startDate' => $row['start_date'],
            'endDate' => $row['end_date'],
            'prizePool' => $row['prize_pool'],
            'rules' => $row['rules'],
            'maps' => $row['maps'] ? json_decode($row['maps'], true) : [],
            'bracketType' => $row['bracket_type'],
            'createdBy' => $row['created_by_username'],
            'createdAt' => $row['created_at']
        ];
    }

    jsonResponse([
        'success' => true,
        'tournaments' => $tournaments
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>