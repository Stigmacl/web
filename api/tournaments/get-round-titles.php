<?php
require_once '../config/database.php';

if (!isset($_GET['tournamentId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de torneo requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $tournamentId = $_GET['tournamentId'];

    // Verificar que el torneo existe
    $checkQuery = "SELECT id FROM tournaments WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $tournamentId);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Torneo no encontrado'
        ], 404);
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

    // Obtener títulos de rondas
    $query = "
        SELECT round, title
        FROM tournament_round_titles
        WHERE tournament_id = :tournament_id
        ORDER BY round ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':tournament_id', $tournamentId);
    $stmt->execute();

    $roundTitles = [];
    while ($row = $stmt->fetch()) {
        $roundTitles[$row['round']] = $row['title'];
    }

    jsonResponse([
        'success' => true,
        'roundTitles' => $roundTitles
    ]);

} catch (Exception $e) {
    error_log('Error in get-round-titles.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>