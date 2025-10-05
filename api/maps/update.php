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

if (!isset($data['id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de mapa requerido'
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
            'message' => 'No tienes permisos para editar mapas'
        ], 403);
    }

    // Verificar que el mapa existe
    $checkQuery = "SELECT id FROM maps WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data['id']);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Mapa no encontrado'
        ], 404);
    }

    // Construir query de actualización dinámicamente
    $updateFields = [];
    $params = [':id' => $data['id']];

    if (isset($data['name'])) {
        // Verificar que el nombre no esté en uso por otro mapa
        $nameCheckQuery = "SELECT id FROM maps WHERE name = :name AND id != :id";
        $nameCheckStmt = $db->prepare($nameCheckQuery);
        $nameCheckStmt->bindParam(':name', $data['name']);
        $nameCheckStmt->bindParam(':id', $data['id']);
        $nameCheckStmt->execute();

        if ($nameCheckStmt->fetch()) {
            jsonResponse([
                'success' => false,
                'message' => 'Ya existe un mapa con ese nombre'
            ], 400);
        }

        $updateFields[] = "name = :name";
        $params[':name'] = $data['name'];
    }

    if (isset($data['displayName'])) {
        $updateFields[] = "display_name = :display_name";
        $params[':display_name'] = $data['displayName'];
    }

    if (isset($data['description'])) {
        $updateFields[] = "description = :description";
        $params[':description'] = $data['description'];
    }

    if (isset($data['imageUrl'])) {
        $updateFields[] = "image_url = :image_url";
        $params[':image_url'] = $data['imageUrl'];
    }

    if (isset($data['gameMode'])) {
        $updateFields[] = "game_mode = :game_mode";
        $params[':game_mode'] = $data['gameMode'];
    }

    if (isset($data['maxPlayers'])) {
        $updateFields[] = "max_players = :max_players";
        $params[':max_players'] = $data['maxPlayers'];
    }

    if (isset($data['difficulty'])) {
        $updateFields[] = "difficulty = :difficulty";
        $params[':difficulty'] = $data['difficulty'];
    }

    if (isset($data['environment'])) {
        $updateFields[] = "environment = :environment";
        $params[':environment'] = $data['environment'];
    }

    if (isset($data['size'])) {
        $updateFields[] = "size = :size";
        $params[':size'] = $data['size'];
    }

    if (isset($data['isActive'])) {
        $updateFields[] = "is_active = :is_active";
        $params[':is_active'] = $data['isActive'] ? 1 : 0;
    }

    if (empty($updateFields)) {
        jsonResponse([
            'success' => false,
            'message' => 'No hay campos para actualizar'
        ], 400);
    }

    $query = "UPDATE maps SET " . implode(', ', $updateFields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Mapa actualizado exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>