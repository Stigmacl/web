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

    // Primero, agregar la columna participant_count si no existe
    $checkColumn = "SHOW COLUMNS FROM tournaments LIKE 'participant_count'";
    $columnExists = $db->query($checkColumn);
    
    if ($columnExists->rowCount() == 0) {
        $db->exec("ALTER TABLE tournaments ADD COLUMN participant_count int(11) DEFAULT 0 AFTER max_participants");
        
        // Actualizar los valores existentes
        $updateQuery = "
            UPDATE tournaments t 
            SET participant_count = (
                SELECT COUNT(*) 
                FROM tournament_participants tp 
                WHERE tp.tournament_id = t.id 
                AND tp.status IN ('registered', 'active')
            )
        ";
        $db->exec($updateQuery);
    }

    // Agregar columna maps si no existe
    $checkMapsColumn = "SHOW COLUMNS FROM tournaments LIKE 'maps'";
    $mapsColumnExists = $db->query($checkMapsColumn);
    
    if ($mapsColumnExists->rowCount() == 0) {
        $db->exec("ALTER TABLE tournaments ADD COLUMN maps text DEFAULT NULL AFTER rules");
    }

    $query = "SELECT t.*, 
                     u.username as created_by_username
              FROM tournaments t 
              LEFT JOIN users u ON t.created_by = u.id
              ORDER BY t.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();

    $tournaments = [];
    while ($row = $stmt->fetch()) {
        // Decodificar mapas desde JSON
        $maps = [];
        if (!empty($row['maps'])) {
            $decodedMaps = json_decode($row['maps'], true);
            if (is_array($decodedMaps)) {
                $maps = $decodedMaps;
            }
        }

        $tournaments[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'description' => $row['description'],
            'type' => $row['type'],
            'teamSize' => (int)$row['team_size'],
            'maxParticipants' => (int)$row['max_participants'],
            'participantCount' => (int)($row['participant_count'] ?? 0),
            'status' => $row['status'],
            'startDate' => $row['start_date'],
            'endDate' => $row['end_date'],
            'prizePool' => $row['prize_pool'],
            'rules' => $row['rules'],
            'maps' => $maps,
            'bracketType' => $row['bracket_type'],
            'createdBy' => $row['created_by_username'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }

    jsonResponse([
        'success' => true,
        'tournaments' => $tournaments
    ]);

} catch (Exception $e) {
    error_log('Error in get-all.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>