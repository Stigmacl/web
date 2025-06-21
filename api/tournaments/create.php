<?php
error_reporting(0);
ini_set('display_errors', 0);

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

if (!isset($data['name']) || !isset($data['type']) || !isset($data['maxParticipants'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Nombre, tipo y número máximo de participantes son requeridos'
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
            'message' => 'No tienes permisos para crear torneos'
        ], 403);
    }

    // Crear tabla tournaments si no existe
    $checkTable = "SHOW TABLES LIKE 'tournaments'";
    if ($db->query($checkTable)->rowCount() == 0) {
        $db->exec("
            CREATE TABLE `tournaments` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `name` varchar(255) NOT NULL,
              `description` text DEFAULT NULL,
              `type` enum('individual','clan') NOT NULL,
              `team_size` int(11) DEFAULT 1,
              `max_participants` int(11) NOT NULL,
              `status` enum('draft','registration','active','completed','cancelled') NOT NULL DEFAULT 'draft',
              `start_date` datetime DEFAULT NULL,
              `end_date` datetime DEFAULT NULL,
              `prize_pool` varchar(255) DEFAULT NULL,
              `rules` text DEFAULT NULL,
              `maps` text DEFAULT NULL,
              `bracket_type` enum('single_elimination','double_elimination','round_robin','swiss') DEFAULT 'single_elimination',
              `created_by` int(11) NOT NULL,
              `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `fk_tournaments_created_by` (`created_by`),
              KEY `idx_status` (`status`),
              KEY `idx_type` (`type`),
              CONSTRAINT `fk_tournaments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    // Crear tabla de participantes si no existe
    $checkParticipantsTable = "SHOW TABLES LIKE 'tournament_participants'";
    if ($db->query($checkParticipantsTable)->rowCount() == 0) {
        $db->exec("
            CREATE TABLE `tournament_participants` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `tournament_id` int(11) NOT NULL,
              `participant_type` enum('user','clan') NOT NULL,
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
              CONSTRAINT `fk_tournament_participants_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    // Crear tabla de partidas si no existe
    $checkMatchesTable = "SHOW TABLES LIKE 'tournament_matches'";
    if ($db->query($checkMatchesTable)->rowCount() == 0) {
        $db->exec("
            CREATE TABLE `tournament_matches` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `tournament_id` int(11) NOT NULL,
              `round` int(11) NOT NULL,
              `match_number` int(11) NOT NULL,
              `participant1_id` int(11) DEFAULT NULL,
              `participant2_id` int(11) DEFAULT NULL,
              `winner_id` int(11) DEFAULT NULL,
              `score1` int(11) DEFAULT 0,
              `score2` int(11) DEFAULT 0,
              `map_played` varchar(255) DEFAULT NULL,
              `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
              `scheduled_at` datetime DEFAULT NULL,
              `completed_at` datetime DEFAULT NULL,
              `notes` text DEFAULT NULL,
              `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `fk_tournament_matches_tournament` (`tournament_id`),
              KEY `fk_tournament_matches_participant1` (`participant1_id`),
              KEY `fk_tournament_matches_participant2` (`participant2_id`),
              KEY `fk_tournament_matches_winner` (`winner_id`),
              KEY `idx_round` (`round`),
              KEY `idx_status` (`status`),
              CONSTRAINT `fk_tournament_matches_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
              CONSTRAINT `fk_tournament_matches_participant1` FOREIGN KEY (`participant1_id`) REFERENCES `tournament_participants` (`id`) ON DELETE SET NULL,
              CONSTRAINT `fk_tournament_matches_participant2` FOREIGN KEY (`participant2_id`) REFERENCES `tournament_participants` (`id`) ON DELETE SET NULL,
              CONSTRAINT `fk_tournament_matches_winner` FOREIGN KEY (`winner_id`) REFERENCES `tournament_participants` (`id`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    $mapsJson = isset($data['maps']) && is_array($data['maps']) ? json_encode($data['maps']) : null;

    $query = "
        INSERT INTO tournaments (
            name, description, type, team_size, max_participants, 
            start_date, end_date, prize_pool, rules, maps, bracket_type, created_by
        ) VALUES (
            :name, :description, :type, :team_size, :max_participants, 
            :start_date, :end_date, :prize_pool, :rules, :maps, :bracket_type, :created_by
        )
    ";

    $stmt = $db->prepare($query);
    $stmt->bindValue(':name', $data['name']);
    $stmt->bindValue(':description', $data['description'] ?? '');
    $stmt->bindValue(':type', $data['type']);
    $stmt->bindValue(':team_size', $data['teamSize'] ?? 1, PDO::PARAM_INT);
    $stmt->bindValue(':max_participants', $data['maxParticipants'], PDO::PARAM_INT);
    $stmt->bindValue(':start_date', $data['startDate'] ?? null);
    $stmt->bindValue(':end_date', $data['endDate'] ?? null);
    $stmt->bindValue(':prize_pool', $data['prizePool'] ?? '');
    $stmt->bindValue(':rules', $data['rules'] ?? '');
    $stmt->bindValue(':maps', $mapsJson);
    $stmt->bindValue(':bracket_type', $data['bracketType'] ?? 'single_elimination');
    $stmt->bindValue(':created_by', $_SESSION['user_id'], PDO::PARAM_INT);

    if ($stmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Torneo creado exitosamente',
            'id' => $db->lastInsertId()
        ]);
    } else {
        error_log("Error SQL: " . print_r($stmt->errorInfo(), true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al crear el torneo en la base de datos'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en create-tournament.php: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>
