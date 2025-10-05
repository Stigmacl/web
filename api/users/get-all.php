<?php
require_once '../config/database.php';

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

try {
    $database = new Database();
    $db = $database->getConnection();

    // Primero, actualizar el estado de usuarios inactivos
    // Un usuario se considera offline si no ha tenido actividad en los últimos 5 minutos
    $updateOfflineQuery = "UPDATE users
                          SET is_online = 0
                          WHERE is_online = 1
                          AND last_login < DATE_SUB(NOW(), INTERVAL 5 MINUTE)";
    $db->exec($updateOfflineQuery);

    $query = "SELECT id, username, email, role, avatar, status, is_online, clan, is_active, last_login, created_at, hide_email, player_name
              FROM users
              ORDER BY created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute();

    $users = [];
    while ($row = $stmt->fetch()) {
        // Calcular si el usuario está realmente online basado en su última actividad
        $isOnline = false;
        if ($row['is_online'] && $row['last_login']) {
            $lastLogin = strtotime($row['last_login']);
            $now = time();
            $minutesSinceLogin = ($now - $lastLogin) / 60;
            // Considerar online solo si la última actividad fue en los últimos 5 minutos
            $isOnline = $minutesSinceLogin < 5;
        }

        $users[] = [
            'id' => $row['id'],
            'username' => $row['username'],
            'email' => $row['email'],
            'role' => $row['role'],
            'avatar' => $row['avatar'],
            'status' => $row['status'],
            'isOnline' => $isOnline,
            'clan' => $row['clan'],
            'isActive' => (bool)$row['is_active'],
            'lastLogin' => $row['last_login'],
            'createdAt' => $row['created_at'],
            'hideEmail' => (bool)$row['hide_email'],
            'playerName' => $row['player_name']
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