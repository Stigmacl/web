<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Método no permitido', 405);
}

$userId = $_GET['user_id'] ?? null;

if (!$userId) {
    errorResponse('ID de usuario requerido');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Obtener el player_name del usuario
    $userQuery = "SELECT player_name FROM users WHERE id = :user_id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':user_id', $userId);
    $userStmt->execute();
    $user = $userStmt->fetch();

    if (!$user) {
        errorResponse('Usuario no encontrado', 404);
    }

    if (!$user['player_name']) {
        jsonResponse([
            'success' => true,
            'hasPlayerName' => false,
            'stats' => null
        ]);
        exit;
    }

    // Obtener estadísticas por servidor
    $serverStatsQuery = "SELECT
                        server_id,
                        player_name,
                        total_kills,
                        total_deaths,
                        total_score,
                        games_played,
                        CASE
                            WHEN total_deaths = 0 THEN total_kills
                            ELSE ROUND(total_kills / total_deaths, 2)
                        END as kd_ratio,
                        last_seen
                    FROM player_rankings
                    WHERE player_name = :player_name
                    ORDER BY server_id";

    $serverStatsStmt = $db->prepare($serverStatsQuery);
    $serverStatsStmt->bindParam(':player_name', $user['player_name']);
    $serverStatsStmt->execute();
    $serverStats = $serverStatsStmt->fetchAll();

    // Obtener estadísticas acumuladas del ranking (suma de todos los servidores)
    $statsQuery = "SELECT
                    player_name,
                    SUM(total_kills) as total_kills,
                    SUM(total_deaths) as total_deaths,
                    SUM(total_score) as total_score,
                    SUM(games_played) as games_played,
                    CASE
                        WHEN SUM(total_deaths) = 0 THEN SUM(total_kills)
                        ELSE ROUND(SUM(total_kills) / SUM(total_deaths), 2)
                    END as kd_ratio,
                    MAX(last_seen) as last_seen
                FROM player_rankings
                WHERE player_name = :player_name
                GROUP BY player_name";

    $statsStmt = $db->prepare($statsQuery);
    $statsStmt->bindParam(':player_name', $user['player_name']);
    $statsStmt->execute();
    $stats = $statsStmt->fetch();

    if (!$stats) {
        jsonResponse([
            'success' => true,
            'hasPlayerName' => true,
            'playerName' => $user['player_name'],
            'stats' => null,
            'serverStats' => [],
            'message' => 'No se encontraron estadísticas para este jugador'
        ]);
        exit;
    }

    // Obtener ranking actual del jugador
    $rankQuery = "SELECT COUNT(*) + 1 as player_rank
                FROM (
                    SELECT player_name,
                        CASE
                            WHEN SUM(total_deaths) = 0 THEN SUM(total_kills)
                            ELSE SUM(total_kills) / SUM(total_deaths)
                        END as kd_ratio
                    FROM player_rankings
                    GROUP BY player_name
                ) as rankings
                WHERE kd_ratio > (
                    SELECT
                        CASE
                            WHEN SUM(total_deaths) = 0 THEN SUM(total_kills)
                            ELSE SUM(total_kills) / SUM(total_deaths)
                        END
                    FROM player_rankings
                    WHERE player_name = :player_name
                )";

    $rankStmt = $db->prepare($rankQuery);
    $rankStmt->bindParam(':player_name', $user['player_name']);
    $rankStmt->execute();
    $rankResult = $rankStmt->fetch();

    jsonResponse([
        'success' => true,
        'hasPlayerName' => true,
        'playerName' => $user['player_name'],
        'stats' => $stats ? array_merge($stats, ['rank' => $rankResult['player_rank']]) : null,
        'serverStats' => $serverStats
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>
