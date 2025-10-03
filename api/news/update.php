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
        errorResponse('No tienes permisos para editar noticias', 403);
    }

    // Verificar que la noticia existe
    $checkQuery = "SELECT id FROM news WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data['id']);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        errorResponse('Noticia no encontrada', 404);
    }

    // Construir query de actualización dinámicamente
    $updateFields = [];
    $params = [':id' => $data['id']];

    if (isset($data['title'])) {
        $updateFields[] = "title = :title";
        $params[':title'] = $data['title'];
    }

    if (isset($data['content'])) {
        $updateFields[] = "content = :content";
        $params[':content'] = $data['content'];
    }

    if (isset($data['image'])) {
        $updateFields[] = "image = :image";
        $params[':image'] = $data['image'];
    }

    if (isset($data['author'])) {
        $updateFields[] = "author = :author";
        $params[':author'] = $data['author'];
    }

    if (isset($data['isPinned'])) {
        $updateFields[] = "is_pinned = :is_pinned";
        $params[':is_pinned'] = (int)$data['isPinned'];
    }

    if (empty($updateFields)) {
        errorResponse('No hay campos para actualizar');
    }

    $query = "UPDATE news SET " . implode(', ', $updateFields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Noticia actualizada exitosamente'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>