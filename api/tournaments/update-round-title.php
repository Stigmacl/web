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

if (!isset($data['tournamentId']) || !isset($data['round'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de torneo y ronda son requeridos'
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
            'message' => 'No tienes permisos para actualizar títulos de rondas'
        ], 403);
    }

    // Crear tabla de títulos de rondas si no existe
    $createRoundTitlesTable = "
        CREATE TABLE IF NOT EXISTS `tournament_round_titles` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `tournament_id` int(11) NOT NULL,
          `round` int(11) NOT NULL,
          `title` varchar(255) NOT NULL,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`),
          UNIQUE KEY `unique_tournament_round` (`tournament_id`, `round`),
          KEY `fk_round_titles_tournament` (`tournament_id`),
          CONSTRAINT `fk_round_titles_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    $db->exec($createRoundTitlesTable);

    // Insertar o actualizar el título de la ronda
    $upsertQuery = "
        INSERT INTO tournament_round_titles (tournament_id, round, title) 
        VALUES (:tournament_id, :round, :title)
        ON DUPLICATE KEY UPDATE 
        title = VALUES(title),
        updated_at = CURRENT_TIMESTAMP
    ";
    
    $upsertStmt = $db->prepare($upsertQuery);
    $upsertStmt->bindParam(':tournament_id', $data['tournamentId']);
    $upsertStmt->bindParam(':round', $data['round']);
    $upsertStmt->bindParam(':title', $data['title']);
    
    if (!$upsertStmt->execute()) {
        error_log("Error SQL al actualizar título de ronda: " . print_r($upsertStmt->errorInfo(), true));
        jsonResponse([
            'success' => false,
            'message' => 'Error al actualizar el título en la base de datos'
        ], 500);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Título de ronda actualizado exitosamente'
    ]);

} catch (Exception $e) {
    error_log('Error en update-round-title.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>