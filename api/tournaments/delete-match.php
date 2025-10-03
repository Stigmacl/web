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
            'message' => 'No tienes permisos para eliminar partidas'
        ], 403);
    }

    // Verificar que la partida existe
    $checkQuery = "SELECT id, tournament_id FROM tournament_matches WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data['matchId']);
    $checkStmt->execute();
    $match = $checkStmt->fetch();

    if (!$match) {
        jsonResponse([
            'success' => false,
            'message' => 'Partida no encontrada'
        ], 404);
    }

    // Eliminar la partida
    $deleteQuery = "DELETE FROM tournament_matches WHERE id = :id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':id', $data['matchId']);
    
    if ($deleteStmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Partida eliminada exitosamente'
        ]);
    } else {
        error_log("Error SQL al eliminar partida: " . print_r($deleteStmt->errorInfo(), true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al eliminar la partida en la base de datos'
        ], 500);
    }

} catch (Exception $e) {
    error_log('Error en delete-match.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>