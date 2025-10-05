<?php
require_once '../config/database.php';

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que la tabla maps existe
    $checkTable = "SHOW TABLES LIKE 'maps'";
    $tableExists = $db->query($checkTable);
    
    if ($tableExists->rowCount() == 0) {
        jsonResponse([
            'success' => true,
            'maps' => []
        ]);
        return;
    }

    $query = "SELECT m.*, 
                     u.username as created_by_username
              FROM maps m 
              LEFT JOIN users u ON m.created_by = u.id
              ORDER BY m.name ASC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();

    $maps = [];
    while ($row = $stmt->fetch()) {
        $maps[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'displayName' => $row['display_name'],
            'description' => $row['description'],
            'imageUrl' => $row['image_url'],
            'gameMode' => $row['game_mode'],
            'maxPlayers' => (int)$row['max_players'],
            'difficulty' => $row['difficulty'],
            'environment' => $row['environment'],
            'size' => $row['size'],
            'isActive' => (bool)$row['is_active'],
            'createdBy' => $row['created_by_username'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }

    jsonResponse([
        'success' => true,
        'maps' => $maps
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>