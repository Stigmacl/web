<?php
require_once '../config/database.php';

startSecureSession();

if (!isset($_SESSION['user_id'])) {
    errorResponse('No autorizado', 401);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que la tabla existe, si no, crearla
    $checkTable = "SHOW TABLES LIKE 'clan_member_requests'";
    $tableExists = $db->query($checkTable);
    
    if ($tableExists->rowCount() == 0) {
        // Crear la tabla si no existe
        $createTable = "
        CREATE TABLE `clan_member_requests` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `clan_id` int(11) NOT NULL,
          `requested_by` int(11) NOT NULL,
          `target_user_id` int(11) NOT NULL,
          `action` enum('add','remove') NOT NULL,
          `reason` text DEFAULT NULL,
          `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
          `reviewed_by` int(11) DEFAULT NULL,
          `reviewed_at` timestamp NULL DEFAULT NULL,
          `admin_notes` text DEFAULT NULL,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`),
          KEY `fk_clan_requests_clan` (`clan_id`),
          KEY `fk_clan_requests_requester` (`requested_by`),
          KEY `fk_clan_requests_target` (`target_user_id`),
          KEY `fk_clan_requests_reviewer` (`reviewed_by`),
          KEY `idx_status` (`status`),
          CONSTRAINT `fk_clan_requests_clan` FOREIGN KEY (`clan_id`) REFERENCES `clans` (`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_clan_requests_requester` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_clan_requests_target` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_clan_requests_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $db->exec($createTable);
    }

    // Verificar permisos
    $userQuery = "SELECT role FROM users WHERE id = :user_id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':user_id', $_SESSION['user_id']);
    $userStmt->execute();
    $currentUser = $userStmt->fetch();

    $isAdmin = $currentUser && $currentUser['role'] === 'admin';
    $isLeader = false;

    if (!$isAdmin) {
        // Verificar si es líder de algún clan
        $leaderQuery = "SELECT id FROM clans WHERE leader_id = :user_id";
        $leaderStmt = $db->prepare($leaderQuery);
        $leaderStmt->bindParam(':user_id', $_SESSION['user_id']);
        $leaderStmt->execute();
        $isLeader = $leaderStmt->fetch() !== false;
    }

    if (!$isAdmin && !$isLeader) {
        errorResponse('No tienes permisos para ver solicitudes de clan', 403);
    }

    // Construir query según permisos
    if ($isAdmin) {
        // Los admins ven todas las solicitudes
        $query = "SELECT r.*, 
                         c.name as clan_name, c.tag as clan_tag,
                         u1.username as requester_name, u1.avatar as requester_avatar,
                         u2.username as target_name, u2.avatar as target_avatar,
                         u3.username as reviewer_name
                  FROM clan_member_requests r
                  JOIN clans c ON r.clan_id = c.id
                  JOIN users u1 ON r.requested_by = u1.id
                  JOIN users u2 ON r.target_user_id = u2.id
                  LEFT JOIN users u3 ON r.reviewed_by = u3.id
                  ORDER BY r.created_at DESC";
        $stmt = $db->prepare($query);
    } else {
        // Los líderes solo ven las solicitudes de sus clanes
        $query = "SELECT r.*, 
                         c.name as clan_name, c.tag as clan_tag,
                         u1.username as requester_name, u1.avatar as requester_avatar,
                         u2.username as target_name, u2.avatar as target_avatar,
                         u3.username as reviewer_name
                  FROM clan_member_requests r
                  JOIN clans c ON r.clan_id = c.id
                  JOIN users u1 ON r.requested_by = u1.id
                  JOIN users u2 ON r.target_user_id = u2.id
                  LEFT JOIN users u3 ON r.reviewed_by = u3.id
                  WHERE c.leader_id = :user_id
                  ORDER BY r.created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $_SESSION['user_id']);
    }

    $stmt->execute();

    $requests = [];
    while ($row = $stmt->fetch()) {
        $requests[] = [
            'id' => $row['id'],
            'clanId' => $row['clan_id'],
            'clanName' => $row['clan_name'],
            'clanTag' => $row['clan_tag'],
            'requestedBy' => [
                'id' => $row['requested_by'],
                'username' => $row['requester_name'],
                'avatar' => $row['requester_avatar']
            ],
            'targetUser' => [
                'id' => $row['target_user_id'],
                'username' => $row['target_name'],
                'avatar' => $row['target_avatar']
            ],
            'action' => $row['action'],
            'reason' => $row['reason'],
            'status' => $row['status'],
            'reviewedBy' => $row['reviewer_name'],
            'reviewedAt' => $row['reviewed_at'],
            'adminNotes' => $row['admin_notes'],
            'createdAt' => $row['created_at']
        ];
    }

    jsonResponse([
        'success' => true,
        'requests' => $requests,
        'userRole' => $isAdmin ? 'admin' : 'leader'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>