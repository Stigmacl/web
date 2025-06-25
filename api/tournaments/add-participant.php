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

if (!isset($data['tournamentId']) || !isset($data['participantType'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Datos de participante requeridos'
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
            'message' => 'No tienes permisos para agregar participantes'
        ], 403);
    }

    // Crear tabla de participantes si no existe
    $createParticipantsTable = "
        CREATE TABLE IF NOT EXISTS `tournament_participants` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `tournament_id` int(11) NOT NULL,
          `participant_type` enum('user','clan','team') NOT NULL,
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
    ";
    $db->exec($createParticipantsTable);

    // Asegurar que la columna participant_count existe en tournaments
    $checkColumn = "SHOW COLUMNS FROM tournaments LIKE 'participant_count'";
    $columnExists = $db->query($checkColumn);
    
    if ($columnExists->rowCount() == 0) {
        $db->exec("ALTER TABLE tournaments ADD COLUMN participant_count int(11) DEFAULT 0 AFTER max_participants");
    }

    // Verificar que el torneo existe y obtener información
    $tournamentQuery = "SELECT max_participants, COALESCE(participant_count, 0) as participant_count, status, type, team_size FROM tournaments WHERE id = :id";
    $tournamentStmt = $db->prepare($tournamentQuery);
    $tournamentStmt->bindParam(':id', $data['tournamentId']);
    $tournamentStmt->execute();
    $tournament = $tournamentStmt->fetch();

    if (!$tournament) {
        jsonResponse([
            'success' => false,
            'message' => 'Torneo no encontrado'
        ], 404);
    }

    // Verificar que el torneo esté en estado de registro
    if ($tournament['status'] !== 'draft' && $tournament['status'] !== 'registration') {
        jsonResponse([
            'success' => false,
            'message' => 'El torneo no está aceptando nuevos participantes'
        ], 400);
    }

    // Verificar que no se exceda el máximo de participantes
    if ($tournament['participant_count'] >= $tournament['max_participants']) {
        jsonResponse([
            'success' => false,
            'message' => 'El torneo ya alcanzó el máximo de participantes'
        ], 400);
    }

    // Validar tipo de participante según el tipo de torneo
    $validParticipantTypes = ['user', 'clan', 'team'];
    if (!in_array($data['participantType'], $validParticipantTypes)) {
        jsonResponse([
            'success' => false,
            'message' => 'Tipo de participante inválido'
        ], 400);
    }

    // Para equipos personalizados, generar un ID único
    $participantId = $data['participantId'] ?? null;
    if ($data['participantType'] === 'team') {
        $participantId = 'team_' . uniqid();
    }

    if (!$participantId && $data['participantType'] !== 'team') {
        jsonResponse([
            'success' => false,
            'message' => 'ID de participante requerido'
        ], 400);
    }

    // Verificar que el participante existe (excepto para equipos personalizados)
    if ($data['participantType'] === 'user') {
        $checkQuery = "SELECT id, username FROM users WHERE id = :id AND is_active = 1";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $participantId);
        $checkStmt->execute();
        $participant = $checkStmt->fetch();

        if (!$participant) {
            jsonResponse([
                'success' => false,
                'message' => 'Usuario no encontrado o inactivo'
            ], 404);
        }
    } elseif ($data['participantType'] === 'clan') {
        $checkQuery = "SELECT id, name FROM clans WHERE id = :id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $participantId);
        $checkStmt->execute();
        $participant = $checkStmt->fetch();

        if (!$participant) {
            jsonResponse([
                'success' => false,
                'message' => 'Clan no encontrado'
            ], 404);
        }
    }

    // Verificar que el participante no esté ya registrado
    $duplicateQuery = "SELECT id FROM tournament_participants WHERE tournament_id = :tournament_id AND participant_type = :participant_type AND participant_id = :participant_id";
    $duplicateStmt = $db->prepare($duplicateQuery);
    $duplicateStmt->bindParam(':tournament_id', $data['tournamentId']);
    $duplicateStmt->bindParam(':participant_type', $data['participantType']);
    $duplicateStmt->bindParam(':participant_id', $participantId);
    $duplicateStmt->execute();

    if ($duplicateStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'El participante ya está registrado en este torneo'
        ], 400);
    }

    // Para equipos, validar miembros
    $teamMembers = null;
    if ($data['participantType'] === 'team' && isset($data['teamMembers']) && is_array($data['teamMembers'])) {
        // Verificar que el número de miembros coincida con el tamaño del equipo
        if (count($data['teamMembers']) !== $tournament['team_size']) {
            jsonResponse([
                'success' => false,
                'message' => "El equipo debe tener exactamente {$tournament['team_size']} miembros"
            ], 400);
        }

        // Verificar que todos los miembros existan y estén activos
        foreach ($data['teamMembers'] as $memberId) {
            $memberQuery = "SELECT id FROM users WHERE id = :id AND is_active = 1";
            $memberStmt = $db->prepare($memberQuery);
            $memberStmt->bindParam(':id', $memberId);
            $memberStmt->execute();
            
            if (!$memberStmt->fetch()) {
                jsonResponse([
                    'success' => false,
                    'message' => 'Uno o más miembros del equipo no son válidos'
                ], 400);
            }
        }

        $teamMembers = json_encode($data['teamMembers']);
    }

    // Insertar participante
    $insertQuery = "
        INSERT INTO tournament_participants (
            tournament_id, participant_type, participant_id, team_name, team_members, status
        ) VALUES (
            :tournament_id, :participant_type, :participant_id, :team_name, :team_members, 'registered'
        )
    ";

    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->bindParam(':tournament_id', $data['tournamentId']);
    $insertStmt->bindParam(':participant_type', $data['participantType']);
    $insertStmt->bindParam(':participant_id', $participantId);
    $insertStmt->bindParam(':team_name', $data['teamName'] ?? null);
    $insertStmt->bindParam(':team_members', $teamMembers);
    $insertStmt->execute();

    // Actualizar contador de participantes
    $updateCountQuery = "
        UPDATE tournaments 
        SET participant_count = (
            SELECT COUNT(*) 
            FROM tournament_participants 
            WHERE tournament_id = :tournament_id 
            AND status IN ('registered', 'active')
        ) 
        WHERE id = :tournament_id
    ";
    $updateCountStmt = $db->prepare($updateCountQuery);
    $updateCountStmt->bindParam(':tournament_id', $data['tournamentId']);
    $updateCountStmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Participante agregado exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>