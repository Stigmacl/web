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

if (!isset($data['userId'])) {
    errorResponse('ID de usuario requerido');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el usuario sea admin
    $userQuery = "SELECT role FROM users WHERE id = :id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':id', $_SESSION['user_id']);
    $userStmt->execute();
    $currentUser = $userStmt->fetch();

    if (!$currentUser || $currentUser['role'] !== 'admin') {
        errorResponse('No tienes permisos para asignar clanes', 403);
    }

    // Verificar que el usuario objetivo existe
    $checkQuery = "SELECT id FROM users WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data['userId']);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        errorResponse('Usuario no encontrado', 404);
    }

    // Si se especifica un clan, verificar que existe
    if (!empty($data['clanTag'])) {
        $clanQuery = "SELECT tag FROM clans WHERE tag = :tag";
        $clanStmt = $db->prepare($clanQuery);
        $clanStmt->bindParam(':tag', $data['clanTag']);
        $clanStmt->execute();

        if (!$clanStmt->fetch()) {
            errorResponse('El clan especificado no existe', 404);
        }
    }

    // ✅ Solución del error: pasar variables por referencia
    $clanTagToAssign = !empty($data['clanTag']) ? $data['clanTag'] : null;
    $userId = $data['userId'];

    $updateQuery = "UPDATE users SET clan = :clan WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':clan', $clanTagToAssign);
    $updateStmt->bindParam(':id', $userId);
    $updateStmt->execute();

    jsonResponse([
        'success' => true,
        'message' => empty($data['clanTag']) ? 'Usuario removido del clan exitosamente' : 'Clan asignado exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>
