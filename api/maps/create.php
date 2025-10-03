<?php
require_once '../config/database.php';

session_start();

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

if (!isset($data['name'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Nombre del mapa es requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el usuario sea admin
    $userQuery = "SELECT role FROM users WHERE id = :id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':id', $_SESSION['user_id']);
    $userStmt->execute();
    $user = $userStmt->fetch();

    if (!$user || $user['role'] !== 'admin') {
        jsonResponse([
            'success' => false,
            'message' => 'No tienes permisos para crear mapas'
        ], 403);
    }

    // Crear tabla maps si no existe
    $checkTable = "SHOW TABLES LIKE 'maps'";
    if ($db->query($checkTable)->rowCount() == 0) {
        $db->exec("
            CREATE TABLE `maps` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `name` varchar(255) NOT NULL,
              `display_name` varchar(255) NOT NULL,
              `description` text DEFAULT NULL,
              `image_url` varchar(500) DEFAULT NULL,
              `game_mode` varchar(100) DEFAULT NULL,
              `max_players` int(11) DEFAULT NULL,
              `difficulty` enum('easy','medium','hard','expert') DEFAULT 'medium',
              `environment` varchar(100) DEFAULT NULL,
              `size` enum('small','medium','large','extra_large') DEFAULT 'medium',
              `is_active` tinyint(1) DEFAULT 1,
              `created_by` int(11) NOT NULL,
              `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (`id`),
              UNIQUE KEY `unique_name` (`name`),
              KEY `fk_maps_created_by` (`created_by`),
              KEY `idx_is_active` (`is_active`),
              KEY `idx_game_mode` (`game_mode`),
              CONSTRAINT `fk_maps_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    // Verificar que el nombre del mapa no esté en uso
    $checkQuery = "SELECT id FROM maps WHERE name = :name";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':name', $data['name']);
    $checkStmt->execute();

    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Ya existe un mapa con ese nombre'
        ], 400);
    }

    $query = "
        INSERT INTO maps (
            name, display_name, description, image_url, game_mode, 
            max_players, difficulty, environment, size, created_by
        ) VALUES (
            :name, :display_name, :description, :image_url, :game_mode, 
            :max_players, :difficulty, :environment, :size, :created_by
        )
    ";

    $stmt = $db->prepare($query);
    $stmt->bindValue(':name', $data['name']);
    $stmt->bindValue(':display_name', $data['displayName'] ?? $data['name']);
    $stmt->bindValue(':description', $data['description'] ?? '');
    $stmt->bindValue(':image_url', $data['imageUrl'] ?? null);
    $stmt->bindValue(':game_mode', $data['gameMode'] ?? null);
    $stmt->bindValue(':max_players', $data['maxPlayers'] ?? null, PDO::PARAM_INT);
    $stmt->bindValue(':difficulty', $data['difficulty'] ?? 'medium');
    $stmt->bindValue(':environment', $data['environment'] ?? null);
    $stmt->bindValue(':size', $data['size'] ?? 'medium');
    $stmt->bindValue(':created_by', $_SESSION['user_id'], PDO::PARAM_INT);

    if ($stmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Mapa creado exitosamente',
            'id' => $db->lastInsertId()
        ]);
    } else {
        error_log("Error SQL: " . print_r($stmt->errorInfo(), true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al crear el mapa en la base de datos'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en create-map.php: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>