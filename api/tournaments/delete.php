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
            'message' => 'No tienes permisos para eliminar torneos'
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

    // Eliminar el torneo (esto también eliminará automáticamente los mapas, participantes y matches por CASCADE)
    $deleteQuery = "DELETE FROM tournaments WHERE id = :id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':id', $data['id']);
    $deleteStmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Torneo eliminado exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>