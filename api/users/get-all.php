<?php
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT id, username, email, role, avatar, status, is_online, clan, is_active, last_login, created_at, hide_email 
              FROM users 
              ORDER BY created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();

    $users = [];
    while ($row = $stmt->fetch()) {
        $users[] = [
            'id' => $row['id'],
            'username' => $row['username'],
            'email' => $row['email'],
            'role' => $row['role'],
            'avatar' => $row['avatar'],
            'status' => $row['status'],
            'isOnline' => (bool)$row['is_online'],
            'clan' => $row['clan'],
            'isActive' => (bool)$row['is_active'],
            'lastLogin' => $row['last_login'],
            'createdAt' => $row['created_at'],
            'hideEmail' => (bool)$row['hide_email']
        ];
    }

    jsonResponse([
        'success' => true,
        'users' => $users
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>