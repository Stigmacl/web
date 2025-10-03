<?php
require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    errorResponse('No autorizado', 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Método no permitido', 405);
}

$data = getJsonInput();

if (!isset($data['action']) || !isset($data['targetUserId']) || !isset($data['clanId'])) {
    errorResponse('Acción, ID de usuario objetivo y ID de clan son requeridos');
}

if (!in_array($data['action'], ['add', 'remove'])) {
    errorResponse('Acción debe ser add o remove');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el usuario sea líder del clan
    $clanQuery = "SELECT * FROM clans WHERE id = :clan_id AND leader_id = :user_id";
    $clanStmt = $db->prepare($clanQuery);
    $clanStmt->bindParam(':clan_id', $data['clanId']);
    $clanStmt->bindParam(':user_id', $_SESSION['user_id']);
    $clanStmt->execute();
    $clan = $clanStmt->fetch();

    if (!$clan) {
        errorResponse('No tienes permisos para gestionar este clan', 403);
    }

    // Verificar que el usuario objetivo existe
    $userQuery = "SELECT id, username, clan FROM users WHERE id = :user_id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':user_id', $data['targetUserId']);
    $userStmt->execute();
    $targetUser = $userStmt->fetch();

    if (!$targetUser) {
        errorResponse('Usuario no encontrado', 404);
    }

    // Validaciones específicas según la acción
    if ($data['action'] === 'add') {
        if ($targetUser['clan']) {
            errorResponse('El usuario ya pertenece a un clan');
        }
    } else if ($data['action'] === 'remove') {
        if ($targetUser['clan'] !== $clan['tag']) {
            errorResponse('El usuario no pertenece a este clan');
        }
        if ($targetUser['id'] === $_SESSION['user_id']) {
            errorResponse('No puedes expulsarte a ti mismo del clan');
        }
    }

    // Verificar si ya existe una solicitud pendiente
    $existingQuery = "SELECT id FROM clan_member_requests 
                      WHERE clan_id = :clan_id AND target_user_id = :target_user_id 
                      AND action = :action AND status = 'pending'";
    $existingStmt = $db->prepare($existingQuery);
    $existingStmt->bindParam(':clan_id', $data['clanId']);
    $existingStmt->bindParam(':target_user_id', $data['targetUserId']);
    $existingStmt->bindParam(':action', $data['action']);
    $existingStmt->execute();

    if ($existingStmt->fetch()) {
        errorResponse('Ya existe una solicitud pendiente para esta acción');
    }

    // Crear la solicitud
    $insertQuery = "INSERT INTO clan_member_requests 
                    (clan_id, requested_by, target_user_id, action, reason, status) 
                    VALUES (:clan_id, :requested_by, :target_user_id, :action, :reason, 'pending')";
    
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->bindParam(':clan_id', $data['clanId']);
    $insertStmt->bindParam(':requested_by', $_SESSION['user_id']);
    $insertStmt->bindParam(':target_user_id', $data['targetUserId']);
    $insertStmt->bindParam(':action', $data['action']);
    $insertStmt->bindParam(':reason', $data['reason'] ?? '');
    
    if ($insertStmt->execute()) {
        $actionText = $data['action'] === 'add' ? 'agregar' : 'expulsar';
        jsonResponse([
            'success' => true,
            'message' => "Solicitud para {$actionText} a {$targetUser['username']} enviada a los administradores"
        ]);
    } else {
        errorResponse('Error al crear la solicitud', 500);
    }

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>