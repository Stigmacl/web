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

if (!isset($data['tournamentId'])) {
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
            'message' => 'No tienes permisos para quitar designaciones de campeón'
        ], 403);
    }

    // Verificar que el torneo existe
    $tournamentQuery = "SELECT id FROM tournaments WHERE id = :id";
    $tournamentStmt = $db->prepare($tournamentQuery);
    $tournamentStmt->bindParam(':id', $data['tournamentId']);
    $tournamentStmt->execute();

    if (!$tournamentStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Torneo no encontrado'
        ], 404);
    }

    // Eliminar la designación manual del campeón
    $deleteQuery = "DELETE FROM tournament_champions WHERE tournament_id = :tournament_id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':tournament_id', $data['tournamentId']);

    if ($deleteStmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Designación de campeón eliminada exitosamente'
        ]);
    } else {
        error_log("Error SQL al eliminar designación de campeón: " . print_r($deleteStmt->errorInfo(), true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al eliminar la designación en la base de datos'
        ], 500);
    }

} catch (Exception $e) {
    error_log('Error en clear-champion.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>