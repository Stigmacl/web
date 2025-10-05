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
          `draws` int(11) DEFAULT 0,
          `status` enum('registered','active','eliminated','winner') DEFAULT 'registered',
          `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (`id`),
          UNIQUE KEY `unique_participant` (`tournament_id`, `participant_type`, `participant_id`),
          KEY `fk_tournament_participants_tournament` (`tournament_id`),
          CONSTRAINT `fk_tournament_participants_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    $db->exec($createParticipantsTable);

    // Agregar columna draws si no existe
    $checkDrawsColumn = "SHOW COLUMNS FROM tournament_participants LIKE 'draws'";
    $drawsColumnExists = $db->query($checkDrawsColumn);
    
    if ($drawsColumnExists->rowCount() == 0) {
        $db->exec("ALTER TABLE tournament_participants ADD COLUMN draws int(11) DEFAULT 0 AFTER losses");
    }

    // Asegurar que la columna participant_count existe en tournaments
    $checkColumn = "SHOW COLUMNS FROM tournaments LIKE 'participant_count'";
    $columnExists = $db->query($checkColumn);

    if ($columnExists->rowCount() == 0) {
        $db->exec("ALTER TABLE tournaments ADD COLUMN participant_count int(11) DEFAULT 0 AFTER max_participants");
    }

    // Verificar que el torneo existe y obtener información
    $tournamentQuery = "SELECT max_participants, COALESCE(participant_count, 0) as participant_count, status, type, team_size FROM tournaments WHERE id = :id";
    $tournamentStmt = $db->prepare($tournamentQuery);
    $tournamentId = $data['tournamentId'];
    $tournamentStmt->bindParam(':id', $tournamentId);
    $tournamentStmt->execute();
    $tournament = $tournamentStmt->fetch();

    if (!$tournament) {
        jsonResponse([
            'success' => false,
            'message' => 'Torneo no encontrado'
        ], 404);
    }

    if ($tournament['status'] !== 'draft' && $tournament['status'] !== 'registration') {
        jsonResponse([
            'success' => false,
            'message' => 'El torneo no está aceptando nuevos participantes'
        ], 400);
    }

    if ($tournament['participant_count'] >= $tournament['max_participants']) {
        jsonResponse([
            'success' => false,
            'message' => 'El torneo ya alcanzó el máximo de participantes'
        ], 400);
    }

    $validParticipantTypes = ['user', 'clan', 'team'];
    if (!in_array($data['participantType'], $validParticipantTypes)) {
        jsonResponse([
            'success' => false,
            'message' => 'Tipo de participante inválido'
        ], 400);
    }

    // Definir participantType desde el inicio
    $participantType = $data['participantType'];
    $participantId = $data['participantId'] ?? null;
    $teamName = $data['teamName'] ?? null;

    // Para equipos personalizados, generar un ID único
    if ($participantType === 'team') {
        $participantId = 'team_' . uniqid();
        // Asegurar que se proporcione un nombre de equipo
        if (empty($teamName)) {
            jsonResponse([
                'success' => false,
                'message' => 'Nombre de equipo requerido para equipos personalizados'
            ], 400);
        }
    }

    if (!$participantId && $participantType !== 'team') {
        jsonResponse([
            'success' => false,
            'message' => 'ID de participante requerido'
        ], 400);
    }

    // Validar participantes según el tipo
    if ($participantType === 'user') {
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
    } elseif ($participantType === 'clan') {
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

    // Verificar duplicados
    if ($participantType === 'team') {
        $duplicateQuery = "SELECT id FROM tournament_participants WHERE tournament_id = :tournament_id AND participant_type = 'team' AND team_name = :team_name";
        $duplicateStmt = $db->prepare($duplicateQuery);
        $duplicateStmt->bindParam(':tournament_id', $tournamentId);
        $duplicateStmt->bindParam(':team_name', $teamName);
        $duplicateStmt->execute();
    } else {
        $duplicateQuery = "SELECT id FROM tournament_participants WHERE tournament_id = :tournament_id AND participant_type = :participant_type AND participant_id = :participant_id";
        $duplicateStmt = $db->prepare($duplicateQuery);
        $duplicateStmt->bindParam(':tournament_id', $tournamentId);
        $duplicateStmt->bindParam(':participant_type', $participantType);
        $duplicateStmt->bindParam(':participant_id', $participantId);
        $duplicateStmt->execute();
    }

    if ($duplicateStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'El participante ya está registrado en este torneo'
        ], 400);
    }

    // Manejar miembros del equipo
    $teamMembers = null;
    if (($participantType === 'team' || ($participantType === 'clan' && $tournament['team_size'] > 1)) 
        && isset($data['teamMembers']) && is_array($data['teamMembers'])) {

        if (count($data['teamMembers']) !== $tournament['team_size']) {
            jsonResponse([
                'success' => false,
                'message' => "El equipo debe tener exactamente {$tournament['team_size']} miembros"
            ], 400);
        }

        $validMembers = [];
        foreach ($data['teamMembers'] as $memberId) {
            $memberQuery = "SELECT id, username FROM users WHERE id = :id AND is_active = 1";
            $memberStmt = $db->prepare($memberQuery);
            $memberStmt->bindParam(':id', $memberId);
            $memberStmt->execute();
            $member = $memberStmt->fetch();

            if (!$member) {
                jsonResponse([
                    'success' => false,
                    'message' => 'Uno o más miembros del equipo no son válidos'
                ], 400);
            }

            $validMembers[] = [
                'id' => $member['id'],
                'username' => $member['username']
            ];
        }

        $teamMembers = json_encode($validMembers);
    } elseif ($tournament['team_size'] > 1 && $participantType !== 'user') {
        jsonResponse([
            'success' => false,
            'message' => "Este torneo requiere equipos de {$tournament['team_size']} jugadores. Debe especificar los miembros del equipo."
        ], 400);
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
    $insertStmt->bindValue(':tournament_id', $tournamentId, PDO::PARAM_INT);
    $insertStmt->bindValue(':participant_type', $participantType, PDO::PARAM_STR);
    $insertStmt->bindValue(':participant_id', $participantId, PDO::PARAM_STR);
    $insertStmt->bindValue(':team_name', $teamName, $teamName === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $insertStmt->bindValue(':team_members', $teamMembers, $teamMembers === null ? PDO::PARAM_NULL : PDO::PARAM_STR);

    if (!$insertStmt->execute()) {
        error_log("Error SQL al insertar participante: " . print_r($insertStmt->errorInfo(), true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al insertar el participante en la base de datos'
        ], 500);
    }

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
    $updateCountStmt->bindParam(':tournament_id', $tournamentId);
    $updateCountStmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Participante agregado exitosamente',
        'participantId' => $participantId
    ]);

} catch (Exception $e) {
    error_log('Error en add-participant.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>