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
    $userId = $_SESSION['user_id'];
    $userStmt->bindParam(':id', $userId);
    $userStmt->execute();
    $user = $userStmt->fetch();

    if (!$user || $user['role'] !== 'admin') {
        jsonResponse([
            'success' => false,
            'message' => 'No tienes permisos para subir imágenes de partidas'
        ], 403);
    }

    // Verificar que la partida existe
    $matchQuery = "SELECT id, tournament_id FROM tournament_matches WHERE id = :id";
    $matchStmt = $db->prepare($matchQuery);
    $matchId = $data['matchId'];
    $matchStmt->bindParam(':id', $matchId);
    $matchStmt->execute();
    $match = $matchStmt->fetch();

    if (!$match) {
        jsonResponse([
            'success' => false,
            'message' => 'Partida no encontrada'
        ], 404);
    }

    // Crear tabla de imágenes de partidas si no existe
    $createImagesTable = "
        CREATE TABLE IF NOT EXISTS `tournament_match_images` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `match_id` int(11) NOT NULL,
          `image_type` enum('ida','vuelta','general') NOT NULL,
          `image_url` text NOT NULL,
          `description` varchar(255) DEFAULT NULL,
          `uploaded_by` int(11) NOT NULL,
          `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (`id`),
          KEY `fk_match_images_match` (`match_id`),
          KEY `fk_match_images_uploaded_by` (`uploaded_by`),
          KEY `idx_match_images_type` (`match_id`, `image_type`),
          CONSTRAINT `fk_match_images_match` FOREIGN KEY (`match_id`) REFERENCES `tournament_matches` (`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_match_images_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    $db->exec($createImagesTable);

    // Validar datos de entrada
    if (!isset($data['imageType']) || !in_array($data['imageType'], ['ida', 'vuelta', 'general'])) {
        jsonResponse([
            'success' => false,
            'message' => 'Tipo de imagen inválido'
        ], 400);
    }

    if (!isset($data['imageUrl']) || empty(trim($data['imageUrl']))) {
        jsonResponse([
            'success' => false,
            'message' => 'URL de imagen requerida'
        ], 400);
    }

    // Variables a usar
    $imageType = $data['imageType'];
    $imageUrl = $data['imageUrl'];
    $description = $data['description'] ?? null;

    // Verificar si ya existe una imagen del mismo tipo para esta partida
    $existingQuery = "SELECT id FROM tournament_match_images WHERE match_id = :match_id AND image_type = :image_type";
    $existingStmt = $db->prepare($existingQuery);
    $existingStmt->bindParam(':match_id', $matchId);
    $existingStmt->bindParam(':image_type', $imageType);
    $existingStmt->execute();
    $existing = $existingStmt->fetch();

    if ($existing) {
        // Actualizar imagen existente
        $updateQuery = "
            UPDATE tournament_match_images 
            SET image_url = :image_url, 
                description = :description, 
                uploaded_by = :uploaded_by, 
                uploaded_at = CURRENT_TIMESTAMP 
            WHERE id = :id
        ";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':image_url', $imageUrl);
        $updateStmt->bindParam(':description', $description);
        $updateStmt->bindParam(':uploaded_by', $userId);
        $updateStmt->bindParam(':id', $existing['id']);
        
        if (!$updateStmt->execute()) {
            error_log("Error SQL al actualizar imagen: " . print_r($updateStmt->errorInfo(), true));
            jsonResponse([
                'success' => false,
                'message' => 'Error al actualizar la imagen en la base de datos'
            ], 500);
        }
    } else {
        // Insertar nueva imagen
        $insertQuery = "
            INSERT INTO tournament_match_images (
                match_id, image_type, image_url, description, uploaded_by
            ) VALUES (
                :match_id, :image_type, :image_url, :description, :uploaded_by
            )
        ";
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->bindParam(':match_id', $matchId);
        $insertStmt->bindParam(':image_type', $imageType);
        $insertStmt->bindParam(':image_url', $imageUrl);
        $insertStmt->bindParam(':description', $description);
        $insertStmt->bindParam(':uploaded_by', $userId);
        
        if (!$insertStmt->execute()) {
            error_log("Error SQL al insertar imagen: " . print_r($insertStmt->errorInfo(), true));
            jsonResponse([
                'success' => false,
                'message' => 'Error al guardar la imagen en la base de datos'
            ], 500);
        }
    }

    jsonResponse([
        'success' => true,
        'message' => 'Imagen subida exitosamente'
    ]);

} catch (Exception $e) {
    error_log('Error en upload-match-images.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>
