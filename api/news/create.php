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

    // Usar imagen por defecto si no se proporciona
    $image = !empty($data['image']) ? $data['image'] : '/Logo-Comunidad.png';

    $query = "INSERT INTO news (title, content, image, author, is_pinned)
              VALUES (:title, :content, :image, :author, :is_pinned)";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':title', $data['title']);
    $stmt->bindParam(':content', $data['content']);
    $stmt->bindParam(':image', $image);
    $stmt->bindParam(':author', $data['author']);
    $isPinned = isset($data['isPinned']) ? (int)$data['isPinned'] : 0;
    $stmt->bindParam(':is_pinned', $isPinned);
    $stmt->execute();

    jsonResponse([
        'success' => true,
        'message' => 'Noticia creada exitosamente',
        'id' => $db->lastInsertId()
    ]);

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    errorResponse('Error de base de datos: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    errorResponse('Error interno del servidor: ' . $e->getMessage(), 500);
}
?>