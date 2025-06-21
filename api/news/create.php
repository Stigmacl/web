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

if (!isset($data['title']) || !isset($data['content'])) {
    errorResponse('Título y contenido son requeridos');
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
        errorResponse('No tienes permisos para crear noticias', 403);
    }

    $query = "INSERT INTO news (title, content, image, author, is_pinned) 
              VALUES (:title, :content, :image, :author, :is_pinned)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':title', $data['title']);
    $stmt->bindParam(':content', $data['content']);
    $stmt->bindParam(':image', $data['image']);
    $stmt->bindParam(':author', $data['author']);
    $isPinned = isset($data['isPinned']) ? (int)$data['isPinned'] : 0;
    $stmt->bindParam(':is_pinned', $isPinned);
    $stmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Noticia creada exitosamente',
        'id' => $db->lastInsertId()
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>