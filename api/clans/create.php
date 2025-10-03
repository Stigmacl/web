<?php
// Deshabilitar la visualización de errores para evitar HTML en la respuesta JSON
error_reporting(0);
ini_set('display_errors', 0);

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

if (!isset($data['name']) || !isset($data['tag'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Nombre y tag del clan son requeridos'
    ], 400);
}

if (strlen($data['tag']) > 8) {
    jsonResponse([
        'success' => false,
        'message' => 'El tag del clan no puede tener más de 8 caracteres'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el usuario sea admin
    $userQuery = "SELECT role FROM users WHERE id = :id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindValue(':id', $_SESSION['user_id']);
    $userStmt->execute();
    $user = $userStmt->fetch();

    if (!$user || $user['role'] !== 'admin') {
        jsonResponse([
            'success' => false,
            'message' => 'No tienes permisos para crear clanes'
        ], 403);
    }

    // Verificar que la tabla clans existe, si no, crearla
    $checkTable = "SHOW TABLES LIKE 'clans'";
    $tableExists = $db->query($checkTable);
    
    if ($tableExists->rowCount() == 0) {
        $createTable = "
        CREATE TABLE `clans` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `name` varchar(100) NOT NULL,
          `tag` varchar(20) NOT NULL,
          `icon` varchar(50) DEFAULT 'crown',
          `logo` text DEFAULT NULL,
          `leader_id` int(11) DEFAULT NULL,
          `description` text DEFAULT NULL,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`),
          UNIQUE KEY `tag` (`tag`),
          UNIQUE KEY `name` (`name`),
          KEY `fk_clans_leader` (`leader_id`),
          CONSTRAINT `fk_clans_leader` FOREIGN KEY (`leader_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $db->exec($createTable);
    } else {
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
            
            $addConstraint = "ALTER TABLE clans ADD CONSTRAINT fk_clans_leader FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL";
            try {
                $db->exec($addConstraint);
            } catch (Exception $e) {
                error_log("Warning: Could not add foreign key constraint: " . $e->getMessage());
            }
        }
    }

    // Verificar que el nombre y tag no existan
    $checkQuery = "SELECT id FROM clans WHERE name = :name OR tag = :tag";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindValue(':name', $data['name']);
    $checkStmt->bindValue(':tag', strtoupper($data['tag']));
    $checkStmt->execute();

    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Ya existe un clan con ese nombre o tag'
        ], 400);
    }

    // Verificar que el líder existe si se especifica
    $leaderId = null;
    if (isset($data['leaderId']) && !empty($data['leaderId'])) {
        $leaderQuery = "SELECT id FROM users WHERE id = :leader_id AND is_active = 1";
        $leaderStmt = $db->prepare($leaderQuery);
        $leaderStmt->bindValue(':leader_id', $data['leaderId']);
        $leaderStmt->execute();
        
        if ($leaderStmt->fetch()) {
            $leaderId = $data['leaderId'];
        } else {
            jsonResponse([
                'success' => false,
                'message' => 'El líder seleccionado no existe o no está activo'
            ], 400);
        }
    }

    $query = "INSERT INTO clans (name, tag, icon, logo, leader_id, description) 
              VALUES (:name, :tag, :icon, :logo, :leader_id, :description)";
    
    $stmt = $db->prepare($query);
    $stmt->bindValue(':name', $data['name']);
    $stmt->bindValue(':tag', strtoupper($data['tag']));
    $stmt->bindValue(':icon', $data['icon'] ?? 'crown');
    $stmt->bindValue(':logo', $data['logo'] ?? null);
    $stmt->bindValue(':leader_id', $leaderId);
    $stmt->bindValue(':description', $data['description'] ?? '');

    if ($stmt->execute()) {
        $clanId = $db->lastInsertId();

        // Si se asignó un líder, actualizar su clan
        if ($leaderId) {
            $updateLeaderQuery = "UPDATE users SET clan = :tag WHERE id = :leader_id";
            $updateLeaderStmt = $db->prepare($updateLeaderQuery);
            $updateLeaderStmt->bindValue(':tag', strtoupper($data['tag']));
            $updateLeaderStmt->bindValue(':leader_id', $leaderId);
            $updateLeaderStmt->execute();
        }

        jsonResponse([
            'success' => true,
            'message' => 'Clan creado exitosamente',
            'id' => $clanId
        ]);
    } else {
        $errorInfo = $stmt->errorInfo();
        error_log("Error SQL en create clan: " . print_r($errorInfo, true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al crear el clan en la base de datos'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en create-clan.php: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>
