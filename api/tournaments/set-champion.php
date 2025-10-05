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

if (!isset($data['tournamentId']) || !isset($data['type']) || !isset($data['name'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Datos requeridos: tournamentId, type, name'
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
            'message' => 'No tienes permisos para designar campeones'
        ], 403);
    }

    // Verificar que el torneo existe
    $tournamentQuery = "SELECT id FROM tournaments WHERE id = :id";
    $tournamentStmt = $db->prepare($tournamentQuery);
    $tournamentStmt->bindParam(':id', $data['tournamentId']);
    $tournamentStmt->execute();

    if (!$tournamentStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Torneo no encontrado'
        ], 404);
    }

    // Crear tabla de campeones manuales si no existe
    $createChampionTable = "
        CREATE TABLE IF NOT EXISTS `tournament_champions` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `tournament_id` int(11) NOT NULL,
          `type` enum('individual','team') NOT NULL,
          `participant_id` varchar(50) DEFAULT NULL,
          `team_participants` text DEFAULT NULL,
          `name` varchar(255) NOT NULL,
          `designated_by` int(11) NOT NULL,
          `designated_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`),
          UNIQUE KEY `unique_tournament_champion` (`tournament_id`),
          KEY `fk_tournament_champions_tournament` (`tournament_id`),
          KEY `fk_tournament_champions_designated_by` (`designated_by`),
          CONSTRAINT `fk_tournament_champions_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_tournament_champions_designated_by` FOREIGN KEY (`designated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    $db->exec($createChampionTable);

    // Preparar datos para insertar/actualizar
    $championData = [
        'tournament_id' => $data['tournamentId'],
        'type' => $data['type'],
        'name' => $data['name'],
        'designated_by' => $_SESSION['user_id']
    ];

    if ($data['type'] === 'individual' && isset($data['participantId'])) {
        $championData['participant_id'] = $data['participantId'];
        $championData['team_participants'] = null;
    } elseif ($data['type'] === 'team' && isset($data['teamParticipants'])) {
        $championData['participant_id'] = null;
        $championData['team_participants'] = json_encode($data['teamParticipants']);
    }

    // Insertar o actualizar el campeón
    $upsertQuery = "
        INSERT INTO tournament_champions (
            tournament_id, type, participant_id, team_participants, name, designated_by
        ) VALUES (
            :tournament_id, :type, :participant_id, :team_participants, :name, :designated_by
        )
        ON DUPLICATE KEY UPDATE
            type = VALUES(type),
            participant_id = VALUES(participant_id),
            team_participants = VALUES(team_participants),
            name = VALUES(name),
            designated_by = VALUES(designated_by),
            updated_at = CURRENT_TIMESTAMP
    ";

    $upsertStmt = $db->prepare($upsertQuery);
    $upsertStmt->bindParam(':tournament_id', $championData['tournament_id']);
    $upsertStmt->bindParam(':type', $championData['type']);
    $upsertStmt->bindParam(':participant_id', $championData['participant_id']);
    $upsertStmt->bindParam(':team_participants', $championData['team_participants']);
    $upsertStmt->bindParam(':name', $championData['name']);
    $upsertStmt->bindParam(':designated_by', $championData['designated_by']);

    if ($upsertStmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Campeón designado exitosamente'
        ]);
    } else {
        error_log("Error SQL al designar campeón: " . print_r($upsertStmt->errorInfo(), true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al designar el campeón en la base de datos'
        ], 500);
    }

} catch (Exception $e) {
    error_log('Error en set-champion.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>