<?php
require_once '../config/database.php';

startSecureSession();

if (!isset($_SESSION['user_id'])) {
    errorResponse('No autorizado', 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Método no permitido', 405);
}

$data = getJsonInput();

if (!isset($data['requestId']) || !isset($data['decision'])) {
    errorResponse('ID de solicitud y decisión son requeridos');
}

if (!in_array($data['decision'], ['approved', 'rejected'])) {
    errorResponse('Decisión debe ser approved o rejected');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el usuario sea admin
    $userQuery = "SELECT role FROM users WHERE id = :user_id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':user_id', $_SESSION['user_id']);
    $userStmt->execute();
    $currentUser = $userStmt->fetch();

    if (!$currentUser || $currentUser['role'] !== 'admin') {
        errorResponse('Solo los administradores pueden revisar solicitudes', 403);
    }

    // Obtener la solicitud
    $requestQuery = "SELECT r.*, c.tag as clan_tag, u.username as target_username
                     FROM clan_member_requests r
                     JOIN clans c ON r.clan_id = c.id
                     JOIN users u ON r.target_user_id = u.id
                     WHERE r.id = :request_id AND r.status = 'pending'";
    $requestStmt = $db->prepare($requestQuery);
    $requestStmt->bindParam(':request_id', $data['requestId']);
    $requestStmt->execute();
    $request = $requestStmt->fetch();

    if (!$request) {
        errorResponse('Solicitud no encontrada o ya procesada', 404);
    }

    // Iniciar transacción
    $db->beginTransaction();

    try {
        // Actualizar el estado de la solicitud
        $updateQuery = "UPDATE clan_member_requests 
                        SET status = :status, reviewed_by = :reviewed_by, 
                            reviewed_at = NOW(), admin_notes = :admin_notes
                        WHERE id = :request_id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':status', $data['decision']);
        $updateStmt->bindParam(':reviewed_by', $_SESSION['user_id']);
        $updateStmt->bindParam(':admin_notes', $data['adminNotes'] ?? '');
        $updateStmt->bindParam(':request_id', $data['requestId']);
        $updateStmt->execute();

        // Si la solicitud fue aprobada, ejecutar la acción
        if ($data['decision'] === 'approved') {
            if ($request['action'] === 'add') {
                // Agregar usuario al clan
                $addUserQuery = "UPDATE users SET clan = :clan_tag WHERE id = :user_id";
                $addUserStmt = $db->prepare($addUserQuery);
                $addUserStmt->bindParam(':clan_tag', $request['clan_tag']);
                $addUserStmt->bindParam(':user_id', $request['target_user_id']);
                $addUserStmt->execute();
            } else if ($request['action'] === 'remove') {
                // Remover usuario del clan
                $removeUserQuery = "UPDATE users SET clan = NULL WHERE id = :user_id";
                $removeUserStmt = $db->prepare($removeUserQuery);
                $removeUserStmt->bindParam(':user_id', $request['target_user_id']);
                $removeUserStmt->execute();
            }
        }

        $db->commit();

        $actionText = $request['action'] === 'add' ? 'agregar' : 'expulsar';
        $statusText = $data['decision'] === 'approved' ? 'aprobada' : 'rechazada';
        
        jsonResponse([
            'success' => true,
            'message' => "Solicitud para {$actionText} a {$request['target_username']} ha sido {$statusText}"
        ]);

    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>