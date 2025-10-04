<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config/database.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'No autorizado'
    ]);
    exit;
}

try {
    if (!isset($_FILES['image'])) {
        throw new Exception('No se ha enviado ninguna imagen');
    }

    $file = $_FILES['image'];
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)');
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception('El archivo es demasiado grande. Máximo 5MB');
    }

    $uploadDir = '../../uploads/sponsors/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('sponsor_') . '.' . $extension;
    $filepath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Error al guardar la imagen');
    }

    $url = '/uploads/sponsors/' . $filename;

    echo json_encode([
        'success' => true,
        'url' => $url,
        'message' => 'Imagen subida exitosamente'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al subir imagen: ' . $e->getMessage()
    ]);
}
