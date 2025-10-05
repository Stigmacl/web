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

if (!isset($data['imageId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de imagen requerido'
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
            'message' => 'No tienes permisos para eliminar imágenes de partidas'
        ], 403);
    }

    // Verificar que la imagen existe
    $checkQuery = "SELECT id FROM tournament_match_images WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data['imageId']);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Imagen no encontrada'
        ], 404);
    }

    // Eliminar la imagen
    $deleteQuery = "DELETE FROM tournament_match_images WHERE id = :id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':id', $data['imageId']);
    
    if ($deleteStmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Imagen eliminada exitosamente'
        ]);
    } else {
        error_log("Error SQL al eliminar imagen: " . print_r($deleteStmt->errorInfo(), true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al eliminar la imagen en la base de datos'
        ], 500);
    }

} catch (Exception $e) {
    error_log('Error en delete-match-image.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>