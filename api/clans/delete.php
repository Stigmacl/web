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

if (!isset($data['id'])) {
    errorResponse('ID de clan requerido');
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
        errorResponse('No tienes permisos para eliminar clanes', 403);
    }

    // Obtener información del clan antes de eliminarlo
    $clanQuery = "SELECT tag FROM clans WHERE id = :id";
    $clanStmt = $db->prepare($clanQuery);
    $clanStmt->bindParam(':id', $data['id']);
    $clanStmt->execute();
    $clan = $clanStmt->fetch();

    if (!$clan) {
        errorResponse('Clan no encontrado', 404);
    }

    // Remover el clan de todos los usuarios que lo tenían asignado
    $updateUsersQuery = "UPDATE users SET clan = NULL WHERE clan = :tag";
    $updateUsersStmt = $db->prepare($updateUsersQuery);
    $updateUsersStmt->bindParam(':tag', $clan['tag']);
    $updateUsersStmt->execute();

    // Eliminar el clan
    $deleteQuery = "DELETE FROM clans WHERE id = :id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':id', $data['id']);
    $deleteStmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Clan eliminado exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>