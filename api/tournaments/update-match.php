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

    // Obtener información de la partida y torneo
    $matchQuery = "
        SELECT tm.*, t.team_size, t.type 
        FROM tournament_matches tm 
        JOIN tournaments t ON tm.tournament_id = t.id 
        WHERE tm.id = :id
    ";
    $matchStmt = $db->prepare($matchQuery);
    $matchStmt->bindParam(':id', $data['matchId']);
    $matchStmt->execute();
    $match = $matchStmt->fetch();

    if (!$match) {
        jsonResponse([
            'success' => false,
            'message' => 'Partida no encontrada'
        ], 404);
    }

    // Construir query de actualización dinámicamente
    $updateFields = [];
    $params = [':id' => $data['matchId']];

    // Manejar ganadores según el tipo de torneo
    if (isset($data['winnerId']) || isset($data['winnerTeam'])) {
        if ($match['team_size'] > 1) {
            // Para equipos múltiples, usar winner_team
            if (isset($data['winnerTeam'])) {
                $updateFields[] = "winner_team = :winner_team";
                $params[':winner_team'] = $data['winnerTeam'];
            }
            $updateFields[] = "winner_id = NULL"; // Limpiar winner_id para equipos
        } else {
            // Para 1v1, usar winner_id
            if (isset($data['winnerId'])) {
                $updateFields[] = "winner_id = :winner_id";
                $params[':winner_id'] = $data['winnerId'];
            }
            $updateFields[] = "winner_team = NULL"; // Limpiar winner_team para 1v1
        }
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

    // Manejar actualización de equipos para torneos con team_size > 1
    if ($match['team_size'] > 1) {
        if (isset($data['team1Participants']) && is_array($data['team1Participants'])) {
            $updateFields[] = "team1_participants = :team1_participants";
            $params[':team1_participants'] = json_encode($data['team1Participants']);
        }
        
        if (isset($data['team2Participants']) && is_array($data['team2Participants'])) {
            $updateFields[] = "team2_participants = :team2_participants";
            $params[':team2_participants'] = json_encode($data['team2Participants']);
        }
    } else {
        // Para 1v1, manejar participantes individuales
        if (isset($data['participant1Id'])) {
            $updateFields[] = "participant1_id = :participant1_id";
            $params[':participant1_id'] = $data['participant1Id'];
        }
        
        if (isset($data['participant2Id'])) {
            $updateFields[] = "participant2_id = :participant2_id";
            $params[':participant2_id'] = $data['participant2Id'];
        }
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

    // Actualizar estadísticas de participantes si hay un ganador
    if ((isset($data['winnerId']) && $data['winnerId']) || (isset($data['winnerTeam']) && $data['winnerTeam'])) {
        if ($match['team_size'] > 1) {
            // Para equipos múltiples, actualizar estadísticas de todos los miembros del equipo ganador
            $winnerTeam = $data['winnerTeam'];
            $teamField = $winnerTeam == 1 ? 'team1_participants' : 'team2_participants';
            $loserTeamField = $winnerTeam == 1 ? 'team2_participants' : 'team1_participants';
            
            // Obtener participantes actualizados
            $updatedMatchQuery = "SELECT $teamField as winner_participants, $loserTeamField as loser_participants FROM tournament_matches WHERE id = :id";
            $updatedMatchStmt = $db->prepare($updatedMatchQuery);
            $updatedMatchStmt->bindParam(':id', $data['matchId']);
            $updatedMatchStmt->execute();
            $updatedMatch = $updatedMatchStmt->fetch();
            
            if ($updatedMatch) {
                // Actualizar ganadores
                if (!empty($updatedMatch['winner_participants'])) {
                    $winnerIds = json_decode($updatedMatch['winner_participants'], true);
                    if (is_array($winnerIds)) {
                        foreach ($winnerIds as $winnerId) {
                            $winnerQuery = "UPDATE tournament_participants SET wins = wins + 1, points = points + 3 WHERE id = :winner_id";
                            $winnerStmt = $db->prepare($winnerQuery);
                            $winnerStmt->bindParam(':winner_id', $winnerId);
                            $winnerStmt->execute();
                        }
                    }
                }
                
                // Actualizar perdedores
                if (!empty($updatedMatch['loser_participants'])) {
                    $loserIds = json_decode($updatedMatch['loser_participants'], true);
                    if (is_array($loserIds)) {
                        foreach ($loserIds as $loserId) {
                            $loserQuery = "UPDATE tournament_participants SET losses = losses + 1, points = points + 1 WHERE id = :loser_id";
                            $loserStmt = $db->prepare($loserQuery);
                            $loserStmt->bindParam(':loser_id', $loserId);
                            $loserStmt->execute();
                        }
                    }
                }
            }
        } else {
            // Para 1v1, usar el sistema original
            if (isset($data['winnerId']) && $data['winnerId']) {
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