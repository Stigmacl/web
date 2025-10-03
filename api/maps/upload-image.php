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
            'message' => 'No tienes permisos para subir imágenes'
        ], 403);
    }

    // Verificar que se subió un archivo
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        jsonResponse([
            'success' => false,
            'message' => 'No se subió ningún archivo o hubo un error'
        ], 400);
    }

    $file = $_FILES['image'];
    
    // Validar tipo de archivo
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes)) {
        jsonResponse([
            'success' => false,
            'message' => 'Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, WebP'
        ], 400);
    }

    // Validar tamaño (máximo 5MB)
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $maxSize) {
        jsonResponse([
            'success' => false,
            'message' => 'El archivo es demasiado grande. Máximo 5MB'
        ], 400);
    }

    // Crear directorio de uploads si no existe
    $uploadDir = '../uploads/maps/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generar nombre único para el archivo
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = 'map_' . uniqid() . '_' . time() . '.' . $extension;
    $filePath = $uploadDir . $fileName;

    // Mover archivo subido
    if (move_uploaded_file($file['tmp_name'], $filePath)) {
        // Generar URL relativa
        $fileUrl = '/api/uploads/maps/' . $fileName;
        
        jsonResponse([
            'success' => true,
            'message' => 'Imagen subida exitosamente',
            'imageUrl' => $fileUrl,
            'fileName' => $fileName
        ]);
    } else {
        jsonResponse([
            'success' => false,
            'message' => 'Error al guardar el archivo'
        ], 500);
    }

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>