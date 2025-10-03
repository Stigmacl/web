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

    // Crear tabla de campeones si no existe
    $createChampionTable = "
        CREATE TABLE IF NOT EXISTS `tournament_champions` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `tournament_id` int(11) NOT NULL,
          `type` enum('individual','team') NOT NULL,
          `participant_id` varchar(50) DEFAULT NULL,
          `team_participants` text DEFAULT NULL,
          `name` varchar(255) NOT NULL,
          `designated_by` int(11) NOT NULL,
          `designated_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`),
          UNIQUE KEY `unique_tournament_champion` (`tournament_id`),
          KEY `fk_tournament_champions_tournament` (`tournament_id`),
          KEY `fk_tournament_champions_designated_by` (`designated_by`),
          CONSTRAINT `fk_tournament_champions_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_tournament_champions_designated_by` FOREIGN KEY (`designated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    $db->exec($createChampionTable);

    // Obtener el campeón manual si existe
    $championQuery = "
        SELECT tc.*, u.username as designated_by_username
        FROM tournament_champions tc
        LEFT JOIN users u ON tc.designated_by = u.id
        WHERE tc.tournament_id = :tournament_id
    ";

    $championStmt = $db->prepare($championQuery);
    $championStmt->bindParam(':tournament_id', $tournamentId);
    $championStmt->execute();
    $champion = $championStmt->fetch();

    if ($champion) {
        $championData = [
            'type' => $champion['type'],
            'name' => $champion['name'],
            'designatedBy' => $champion['designated_by_username'],
            'designatedAt' => $champion['designated_at']
        ];

        if ($champion['type'] === 'individual' && $champion['participant_id']) {
            $championData['participantId'] = $champion['participant_id'];
        } elseif ($champion['type'] === 'team' && $champion['team_participants']) {
            $championData['teamParticipants'] = json_decode($champion['team_participants'], true);
        }

        jsonResponse([
            'success' => true,
            'champion' => $championData
        ]);
    } else {
        jsonResponse([
            'success' => true,
            'champion' => null
        ]);
    }

} catch (Exception $e) {
    error_log('Error en get-champion.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>