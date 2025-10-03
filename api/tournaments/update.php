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

if (!isset($data['id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de torneo requerido'
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
            'message' => 'No tienes permisos para editar torneos'
        ], 403);
    }

    // Verificar que el torneo existe
    $checkQuery = "SELECT id FROM tournaments WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data['id']);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Torneo no encontrado'
        ], 404);
    }

    // Construir query de actualización dinámicamente
    $updateFields = [];
    $params = [':id' => $data['id']];

    if (isset($data['name'])) {
        // Verificar que el nombre no esté en uso por otro torneo
        $nameCheckQuery = "SELECT id FROM tournaments WHERE name = :name AND id != :id";
        $nameCheckStmt = $db->prepare($nameCheckQuery);
        $nameCheckStmt->bindParam(':name', $data['name']);
        $nameCheckStmt->bindParam(':id', $data['id']);
        $nameCheckStmt->execute();

        if ($nameCheckStmt->fetch()) {
            jsonResponse([
                'success' => false,
                'message' => 'Ya existe un torneo con ese nombre'
            ], 400);
        }

        $updateFields[] = "name = :name";
        $params[':name'] = $data['name'];
    }

    if (isset($data['description'])) {
        $updateFields[] = "description = :description";
        $params[':description'] = $data['description'];
    }

    if (isset($data['type'])) {
        $updateFields[] = "type = :type";
        $params[':type'] = $data['type'];
    }

    if (isset($data['teamSize'])) {
        $updateFields[] = "team_size = :team_size";
        $params[':team_size'] = $data['teamSize'];
    }

    if (isset($data['maxParticipants'])) {
        $updateFields[] = "max_participants = :max_participants";
        $params[':max_participants'] = $data['maxParticipants'];
    }

    if (isset($data['status'])) {
        $updateFields[] = "status = :status";
        $params[':status'] = $data['status'];
    }

    if (isset($data['startDate'])) {
        $updateFields[] = "start_date = :start_date";
        $params[':start_date'] = $data['startDate'];
    }

    if (isset($data['endDate'])) {
        $updateFields[] = "end_date = :end_date";
        $params[':end_date'] = $data['endDate'];
    }

    if (isset($data['prizePool'])) {
        $updateFields[] = "prize_pool = :prize_pool";
        $params[':prize_pool'] = $data['prizePool'];
    }

    if (isset($data['rules'])) {
        $updateFields[] = "rules = :rules";
        $params[':rules'] = $data['rules'];
    }

    if (isset($data['bracketType'])) {
        $updateFields[] = "bracket_type = :bracket_type";
        $params[':bracket_type'] = $data['bracketType'];
    }

    // Actualizar torneo si hay campos para actualizar
    if (!empty($updateFields)) {
        $query = "UPDATE tournaments SET " . implode(', ', $updateFields) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
    }

    jsonResponse([
        'success' => true,
        'message' => 'Torneo actualizado exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>