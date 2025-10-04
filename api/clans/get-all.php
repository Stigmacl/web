<?php
require_once '../config/database.php';

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que la tabla clans existe
    $checkTable = "SHOW TABLES LIKE 'clans'";
    $tableExists = $db->query($checkTable);
    
    if ($tableExists->rowCount() == 0) {
        jsonResponse([
            'success' => true,
            'clans' => []
        ]);
        return;
    }

    // Verificar si las columnas existen, si no, agregarlas
    $checkColumns = "SHOW COLUMNS FROM clans";
    $columnsResult = $db->query($checkColumns);
    $existingColumns = [];
    
    while ($column = $columnsResult->fetch()) {
        $existingColumns[] = $column['Field'];
    }
    
    if (!in_array('icon', $existingColumns)) {
        $addIconColumn = "ALTER TABLE clans ADD COLUMN icon varchar(50) DEFAULT 'crown' AFTER tag";
        $db->exec($addIconColumn);
    }
    
    if (!in_array('logo', $existingColumns)) {
        $addLogoColumn = "ALTER TABLE clans ADD COLUMN logo text DEFAULT NULL AFTER icon";
        $db->exec($addLogoColumn);
    }
    
    if (!in_array('leader_id', $existingColumns)) {
        $addLeaderColumn = "ALTER TABLE clans ADD COLUMN leader_id int(11) DEFAULT NULL AFTER logo";
        $db->exec($addLeaderColumn);
        
        // Agregar la foreign key constraint
        try {
            $addConstraint = "ALTER TABLE clans ADD CONSTRAINT fk_clans_leader FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL";
            $db->exec($addConstraint);
        } catch (Exception $e) {
            // La constraint ya existe o hay un error, continuar
            error_log("Warning: Could not add foreign key constraint: " . $e->getMessage());
        }
    }

    $query = "SELECT c.*, 
                     (SELECT COUNT(*) FROM users u WHERE u.clan = c.tag AND u.is_active = 1) as member_count,
                     l.username as leader_username,
                     l.avatar as leader_avatar
              FROM clans c 
              LEFT JOIN users l ON c.leader_id = l.id
              ORDER BY c.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();

    $clans = [];
    while ($row = $stmt->fetch()) {
        $clans[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'tag' => $row['tag'],
            'icon' => $row['icon'] ?? 'crown',
            'logo' => $row['logo'],
            'leaderId' => $row['leader_id'],
            'leaderUsername' => $row['leader_username'],
            'leaderAvatar' => $row['leader_avatar'],
            'description' => $row['description'],
            'members' => (int)$row['member_count'],
            'createdAt' => $row['created_at']
        ];
    }

    jsonResponse([
        'success' => true,
        'clans' => $clans
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>