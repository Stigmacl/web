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
            if (isset($data['winnerId']) && !empty($data['winnerId'])) {
                $updateFields[] = "winner_id = :winner_id";
                $params[':winner_id'] = $data['winnerId'];
            } else {
                $updateFields[] = "winner_id = NULL";
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
    
    if (!$stmt->execute()) {
        error_log("Error SQL al actualizar partida: " . print_r($stmt->errorInfo(), true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al actualizar la partida en la base de datos'
        ], 500);
    }

    // Actualizar estadísticas de participantes con el nuevo sistema de puntos
    if (isset($data['status']) && $data['status'] === 'completed' && 
        isset($data['score1']) && isset($data['score2'])) {
        
        // Agregar columna draws si no existe
        $checkDrawsColumn = "SHOW COLUMNS FROM tournament_participants LIKE 'draws'";
        $drawsColumnExists = $db->query($checkDrawsColumn);
        
        if ($drawsColumnExists->rowCount() == 0) {
            $db->exec("ALTER TABLE tournament_participants ADD COLUMN draws int(11) DEFAULT 0 AFTER losses");
        }

        // Calcular puntos según el nuevo sistema
        $participant1Points = 0;
        $participant2Points = 0;
        $participant1Result = '';
        $participant2Result = '';
        
        if ($data['score1'] > $data['score2']) {
            // Participante 1 gana
            $participant1Points = 3;
            $participant2Points = 0;
            $participant1Result = 'win';
            $participant2Result = 'loss';
        } elseif ($data['score2'] > $data['score1']) {
            // Participante 2 gana
            $participant1Points = 0;
            $participant2Points = 3;
            $participant1Result = 'loss';
            $participant2Result = 'win';
        } else {
            // Empate
            $participant1Points = 1;
            $participant2Points = 1;
            $participant1Result = 'draw';
            $participant2Result = 'draw';
        }

        if ($match['team_size'] > 1) {
            // Para equipos múltiples, actualizar estadísticas de todos los miembros del equipo
            $team1Field = 'team1_participants';
            $team2Field = 'team2_participants';
            
            // Obtener participantes actualizados
            $updatedMatchQuery = "SELECT $team1Field as team1_participants, $team2Field as team2_participants FROM tournament_matches WHERE id = :id";
            $updatedMatchStmt = $db->prepare($updatedMatchQuery);
            $updatedMatchStmt->bindParam(':id', $data['matchId']);
            $updatedMatchStmt->execute();
            $updatedMatch = $updatedMatchStmt->fetch();
            
            if ($updatedMatch) {
                // Actualizar equipo 1
                if (!empty($updatedMatch['team1_participants'])) {
                    $team1Ids = json_decode($updatedMatch['team1_participants'], true);
                    if (is_array($team1Ids)) {
                        foreach ($team1Ids as $participantId) {
                            $updateQuery = "UPDATE tournament_participants SET points = points + :points";
                            if ($participant1Result === 'win') {
                                $updateQuery .= ", wins = wins + 1";
                            } elseif ($participant1Result === 'loss') {
                                $updateQuery .= ", losses = losses + 1";
                            } elseif ($participant1Result === 'draw') {
                                $updateQuery .= ", draws = draws + 1";
                            }
                            $updateQuery .= " WHERE id = :participant_id";
                            
                            $updateStmt = $db->prepare($updateQuery);
                            $updateStmt->bindParam(':points', $participant1Points);
                            $updateStmt->bindParam(':participant_id', $participantId);
                            $updateStmt->execute();
                        }
                    }
                }
                
                // Actualizar equipo 2
                if (!empty($updatedMatch['team2_participants'])) {
                    $team2Ids = json_decode($updatedMatch['team2_participants'], true);
                    if (is_array($team2Ids)) {
                        foreach ($team2Ids as $participantId) {
                            $updateQuery = "UPDATE tournament_participants SET points = points + :points";
                            if ($participant2Result === 'win') {
                                $updateQuery .= ", wins = wins + 1";
                            } elseif ($participant2Result === 'loss') {
                                $updateQuery .= ", losses = losses + 1";
                            } elseif ($participant2Result === 'draw') {
                                $updateQuery .= ", draws = draws + 1";
                            }
                            $updateQuery .= " WHERE id = :participant_id";
                            
                            $updateStmt = $db->prepare($updateQuery);
                            $updateStmt->bindParam(':points', $participant2Points);
                            $updateStmt->bindParam(':participant_id', $participantId);
                            $updateStmt->execute();
                        }
                    }
                }
            }
        } else {
            // Para 1v1, usar el sistema original
            if ($match['participant1_id']) {
                $updateQuery = "UPDATE tournament_participants SET points = points + :points";
                if ($participant1Result === 'win') {
                    $updateQuery .= ", wins = wins + 1";
                } elseif ($participant1Result === 'loss') {
                    $updateQuery .= ", losses = losses + 1";
                } elseif ($participant1Result === 'draw') {
                    $updateQuery .= ", draws = draws + 1";
                }
                $updateQuery .= " WHERE id = :participant_id";
                
                $updateStmt = $db->prepare($updateQuery);
                $updateStmt->bindParam(':points', $participant1Points);
                $updateStmt->bindParam(':participant_id', $match['participant1_id']);
                $updateStmt->execute();
            }

            if ($match['participant2_id']) {
                $updateQuery = "UPDATE tournament_participants SET points = points + :points";
                if ($participant2Result === 'win') {
                    $updateQuery .= ", wins = wins + 1";
                } elseif ($participant2Result === 'loss') {
                    $updateQuery .= ", losses = losses + 1";
                } elseif ($participant2Result === 'draw') {
                    $updateQuery .= ", draws = draws + 1";
                }
                $updateQuery .= " WHERE id = :participant_id";
                
                $updateStmt = $db->prepare($updateQuery);
                $updateStmt->bindParam(':points', $participant2Points);
                $updateStmt->bindParam(':participant_id', $match['participant2_id']);
                $updateStmt->execute();
            }
        }
    }

    jsonResponse([
        'success' => true,
        'message' => 'Partida actualizada exitosamente'
    ]);

} catch (Exception $e) {
    error_log('Error en update-match.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>