<?php
require_once '../config/database.php';

if (!isset($_GET['matchId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de partida requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $matchId = $_GET['matchId'];

    // Verificar que la partida existe
    $checkQuery = "SELECT id FROM tournament_matches WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $matchId);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Partida no encontrada'
        ], 404);
    }

    // Crear tabla de imágenes si no existe
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

    // Obtener imágenes de la partida
    $query = "
        SELECT tmi.*, u.username as uploaded_by_username
        FROM tournament_match_images tmi
        LEFT JOIN users u ON tmi.uploaded_by = u.id
        WHERE tmi.match_id = :match_id
        ORDER BY tmi.image_type, tmi.uploaded_at DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':match_id', $matchId);
    $stmt->execute();

    $images = [];
    while ($row = $stmt->fetch()) {
        $images[] = [
            'id' => $row['id'],
            'matchId' => $row['match_id'],
            'imageType' => $row['image_type'],
            'imageUrl' => $row['image_url'],
            'description' => $row['description'],
            'uploadedBy' => $row['uploaded_by_username'],
            'uploadedAt' => $row['uploaded_at']
        ];
    }

    jsonResponse([
        'success' => true,
        'images' => $images
    ]);

} catch (Exception $e) {
    error_log('Error en get-match-images.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>