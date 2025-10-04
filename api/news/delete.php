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

if (!isset($data['id'])) {
    errorResponse('ID de noticia requerido');
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
        errorResponse('No tienes permisos para eliminar noticias', 403);
    }

    // Verificar que la noticia existe
    $checkQuery = "SELECT id FROM news WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data['id']);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        errorResponse('Noticia no encontrada', 404);
    }

    // Eliminar la noticia (esto también eliminará automáticamente los comentarios y likes por CASCADE)
    $deleteQuery = "DELETE FROM news WHERE id = :id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':id', $data['id']);

    if (!$deleteStmt->execute()) {
        error_log('Error al ejecutar DELETE: ' . print_r($deleteStmt->errorInfo(), true));
        errorResponse('Error al eliminar la noticia', 500);
    }

    $rowsAffected = $deleteStmt->rowCount();
    error_log("Filas eliminadas: $rowsAffected para noticia ID: {$data['id']}");

    jsonResponse([
        'success' => true,
        'message' => 'Noticia eliminada exitosamente',
        'rowsAffected' => $rowsAffected
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>