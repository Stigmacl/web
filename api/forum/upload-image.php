<?php
error_reporting(0);
ini_set('display_errors', 0);

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

try {
    if (!isset($_FILES['image'])) {
        jsonResponse([
            'success' => false,
            'message' => 'No se ha enviado ninguna imagen'
        ], 400);
    }

    $file = $_FILES['image'];

    // Validar el archivo
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB

    if (!in_array($file['type'], $allowedTypes)) {
        jsonResponse([
            'success' => false,
            'message' => 'Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG, GIF y WebP'
        ], 400);
    }

    if ($file['size'] > $maxSize) {
        jsonResponse([
            'success' => false,
            'message' => 'El archivo es demasiado grande. Tamaño máximo: 5MB'
        ], 400);
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        jsonResponse([
            'success' => false,
            'message' => 'Error al subir el archivo'
        ], 500);
    }

    // Crear directorio si no existe
    $uploadDir = __DIR__ . '/../../uploads/forum/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generar nombre único para el archivo
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = uniqid('forum_', true) . '.' . $extension;
    $filePath = $uploadDir . $fileName;

    // Mover el archivo
    if (move_uploaded_file($file['tmp_name'], $filePath)) {
        // Obtener la URL base del servidor
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $imageUrl = $protocol . '://' . $host . '/uploads/forum/' . $fileName;

        jsonResponse([
            'success' => true,
            'url' => $imageUrl
        ]);
    } else {
        jsonResponse([
            'success' => false,
            'message' => 'Error al guardar el archivo'
        ], 500);
    }

} catch (Exception $e) {
    error_log("Error en upload-image.php: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>
