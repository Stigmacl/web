<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $statsQuery = "SELECT * FROM player_stats";
    $statsStmt = $db->prepare($statsQuery);
    $statsStmt->execute();
    $stats = $statsStmt->fetchAll();

    $titlesQuery = "SELECT * FROM player_titles ORDER BY awarded_date DESC";
    $titlesStmt = $db->prepare($titlesQuery);
    $titlesStmt->execute();
    $titles = $titlesStmt->fetchAll();

    jsonResponse([
        'success' => true,
        'stats' => $stats,
        'titles' => $titles
    ]);
} catch (Exception $e) {
    errorResponse('Error al obtener estadísticas: ' . $e->getMessage(), 500);
}
?>
