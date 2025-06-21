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

if (!isset($data['matchId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de partida requerido'
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
            'message' => 'No tienes permisos para actualizar partidas'
        ], 403);
    }

    // Construir query de actualización dinámicamente
    $updateFields = [];
    $params = [':id' => $data['matchId']];

    if (isset($data['winnerId'])) {
        $updateFields[] = "winner_id = :winner_id";
        $params[':winner_id'] = $data['winnerId'];
    }

    if (isset($data['score1'])) {
        $updateFields[] = "score1 = :score1";
        $params[':score1'] = $data['score1'];
    }

    if (isset($data['score2'])) {
        $updateFields[] = "score2 = :score2";
        $params[':score2'] = $data['score2'];
    }

    if (isset($data['mapPlayed'])) {
        $updateFields[] = "map_played = :map_played";
        $params[':map_played'] = $data['mapPlayed'];
    }

    if (isset($data['status'])) {
        $updateFields[] = "status = :status";
        $params[':status'] = $data['status'];
        
        // Si se marca como completada, agregar timestamp
        if ($data['status'] === 'completed') {
            $updateFields[] = "completed_at = NOW()";
        }
    }

    if (isset($data['notes'])) {
        $updateFields[] = "notes = :notes";
        $params[':notes'] = $data['notes'];
    }

    if (empty($updateFields)) {
        jsonResponse([
            'success' => false,
            'message' => 'No hay campos para actualizar'
        ], 400);
    }

    $query = "UPDATE tournament_matches SET " . implode(', ', $updateFields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();

    // Si hay un ganador, actualizar estadísticas de participantes
    if (isset($data['winnerId']) && $data['winnerId']) {
        // Obtener información de la partida
        $matchQuery = "SELECT participant1_id, participant2_id FROM tournament_matches WHERE id = :id";
        $matchStmt = $db->prepare($matchQuery);
        $matchStmt->bindParam(':id', $data['matchId']);
        $matchStmt->execute();
        $match = $matchStmt->fetch();

        if ($match) {
            // Actualizar ganador
            $winnerQuery = "UPDATE tournament_participants SET wins = wins + 1, points = points + 3 WHERE id = :winner_id";
            $winnerStmt = $db->prepare($winnerQuery);
            $winnerStmt->bindParam(':winner_id', $data['winnerId']);
            $winnerStmt->execute();

            // Actualizar perdedor
            $loserId = ($data['winnerId'] == $match['participant1_id']) ? $match['participant2_id'] : $match['participant1_id'];
            if ($loserId) {
                $loserQuery = "UPDATE tournament_participants SET losses = losses + 1, points = points + 1 WHERE id = :loser_id";
                $loserStmt = $db->prepare($loserQuery);
                $loserStmt->bindParam(':loser_id', $loserId);
                $loserStmt->execute();
            }
        }
    }

    jsonResponse([
        'success' => true,
        'message' => 'Partida actualizada exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>