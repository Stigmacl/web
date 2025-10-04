<?php
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

if (!isset($data['name']) || !isset($data['maxParticipants'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Nombre y máximo de participantes son requeridos'
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
            'message' => 'No tienes permisos para crear torneos'
        ], 403);
    }

    // Crear tablas si no existen
    $createTournamentsTable = "
        CREATE TABLE IF NOT EXISTS `tournaments` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `name` varchar(255) NOT NULL,
          `description` text DEFAULT NULL,
          `type` enum('individual','clan','team') NOT NULL DEFAULT 'individual',
          `team_size` int(11) DEFAULT 1,
          `max_participants` int(11) NOT NULL,
          `participant_count` int(11) DEFAULT 0,
          `status` enum('draft','registration','active','completed','cancelled') DEFAULT 'draft',
          `start_date` datetime DEFAULT NULL,
          `end_date` datetime DEFAULT NULL,
          `prize_pool` varchar(255) DEFAULT NULL,
          `rules` text DEFAULT NULL,
          `bracket_type` enum('single_elimination','double_elimination','round_robin','swiss') DEFAULT 'single_elimination',
          `created_by` int(11) NOT NULL,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`),
          KEY `fk_tournaments_created_by` (`created_by`),
          CONSTRAINT `fk_tournaments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    $db->exec($createTournamentsTable);

    // Verificar que el nombre del torneo no esté en uso
    $checkQuery = "SELECT id FROM tournaments WHERE name = :name";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':name', $data['name']);
    $checkStmt->execute();

    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Ya existe un torneo con ese nombre'
        ], 400);
    }

    // Validar tipo de torneo y tamaño de equipo
    $validTypes = ['individual', 'clan', 'team'];
    $type = isset($data['type']) && in_array($data['type'], $validTypes) ? $data['type'] : 'individual';
    
    // Validar tamaño de equipo según el tipo
    $teamSize = 1;
    if (isset($data['teamSize'])) {
        $teamSize = (int)$data['teamSize'];
        
        // Validaciones específicas por tipo
        if ($type === 'individual' && $teamSize !== 1) {
            $teamSize = 1;
        } elseif ($type === 'clan' && !in_array($teamSize, [1, 2, 3, 4, 5, 6])) {
            $teamSize = 3; // Default para clanes
        } elseif ($type === 'team' && !in_array($teamSize, [2, 3, 4, 5, 6])) {
            $teamSize = 3; // Default para equipos
        }
    }

    // Insertar torneo
    $query = "
        INSERT INTO tournaments (
            name, description, type, team_size, max_participants, 
            status, start_date, end_date, prize_pool, rules, 
            bracket_type, created_by
        ) VALUES (
            :name, :description, :type, :team_size, :max_participants, 
            :status, :start_date, :end_date, :prize_pool, :rules, 
            :bracket_type, :created_by
        )
    ";

    $stmt = $db->prepare($query);
    $stmt->bindValue(':name', $data['name']);
    $stmt->bindValue(':description', $data['description'] ?? '');
    $stmt->bindValue(':type', $type);
    $stmt->bindValue(':team_size', $teamSize, PDO::PARAM_INT);
    $stmt->bindValue(':max_participants', $data['maxParticipants'], PDO::PARAM_INT);
    $stmt->bindValue(':status', $data['status'] ?? 'draft');

    $startDate = !empty($data['startDate']) ? $data['startDate'] : null;
    $endDate = !empty($data['endDate']) ? $data['endDate'] : null;

    if ($startDate) {
        $stmt->bindValue(':start_date', $startDate);
    } else {
        $stmt->bindValue(':start_date', null, PDO::PARAM_NULL);
    }

    if ($endDate) {
        $stmt->bindValue(':end_date', $endDate);
    } else {
        $stmt->bindValue(':end_date', null, PDO::PARAM_NULL);
    }

    $stmt->bindValue(':prize_pool', $data['prizePool'] ?? null);
    $stmt->bindValue(':rules', $data['rules'] ?? null);
    $stmt->bindValue(':bracket_type', $data['bracketType'] ?? 'single_elimination');
    $stmt->bindValue(':created_by', $_SESSION['user_id'], PDO::PARAM_INT);

    if ($stmt->execute()) {
        $tournamentId = $db->lastInsertId();

        jsonResponse([
            'success' => true,
            'message' => 'Torneo creado exitosamente',
            'id' => $tournamentId
        ]);
    } else {
        error_log("Error SQL: " . print_r($stmt->errorInfo(), true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al crear el torneo en la base de datos'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en create tournament: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>