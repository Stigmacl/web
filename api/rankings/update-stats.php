<?php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['server_ip']) || !isset($data['server_port']) || !isset($data['players'])) {
        jsonResponse(['success' => false, 'message' => 'Missing required fields'], 400);
    }

    $serverIp = $data['server_ip'];
    $serverPort = (int)$data['server_port'];
    $players = $data['players'];

    if (!is_array($players)) {
        jsonResponse(['success' => false, 'message' => 'Players must be an array'], 400);
    }

    $database = new Database();
    $db = $database->getConnection();

    $db->beginTransaction();

    $updateCount = 0;
    $snapshotTime = date('Y-m-d H:i:s');

    foreach ($players as $player) {
        $playerName = $player['name'] ?? '';
        $kills = (int)($player['frags'] ?? 0);
        $deaths = (int)($player['deaths'] ?? 0);
        $score = (int)($player['score'] ?? 0);
        $ping = (int)($player['ping'] ?? 0);
        $team = (int)($player['team'] ?? 0);

        if (empty($playerName)) {
            continue;
        }

        // Save snapshot
        $snapshotQuery = "INSERT INTO ranking_snapshots
                         (server_ip, server_port, player_name, kills, deaths, score, ping, team, snapshot_time)
                         VALUES (:server_ip, :server_port, :player_name, :kills, :deaths, :score, :ping, :team, :snapshot_time)";

        $snapshotStmt = $db->prepare($snapshotQuery);
        $snapshotStmt->execute([
            ':server_ip' => $serverIp,
            ':server_port' => $serverPort,
            ':player_name' => $playerName,
            ':kills' => $kills,
            ':deaths' => $deaths,
            ':score' => $score,
            ':ping' => $ping,
            ':team' => $team,
            ':snapshot_time' => $snapshotTime
        ]);

        // Check if player ranking exists
        $checkQuery = "SELECT id, total_kills, total_deaths, total_score, games_played
                      FROM player_rankings
                      WHERE player_name = :player_name
                      AND server_ip = :server_ip
                      AND server_port = :server_port";

        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([
            ':player_name' => $playerName,
            ':server_ip' => $serverIp,
            ':server_port' => $serverPort
        ]);

        $existing = $checkStmt->fetch();

        if ($existing) {
            // Update existing ranking
            $newTotalKills = $existing['total_kills'] + $kills;
            $newTotalDeaths = $existing['total_deaths'] + $deaths;
            $newTotalScore = $existing['total_score'] + $score;
            $newGamesPlayed = $existing['games_played'] + 1;
            $newKdRatio = $newTotalDeaths > 0 ? round($newTotalKills / $newTotalDeaths, 2) : $newTotalKills;

            $updateQuery = "UPDATE player_rankings
                           SET total_kills = :total_kills,
                               total_deaths = :total_deaths,
                               total_score = :total_score,
                               kd_ratio = :kd_ratio,
                               games_played = :games_played,
                               last_seen = :last_seen
                           WHERE id = :id";

            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute([
                ':total_kills' => $newTotalKills,
                ':total_deaths' => $newTotalDeaths,
                ':total_score' => $newTotalScore,
                ':kd_ratio' => $newKdRatio,
                ':games_played' => $newGamesPlayed,
                ':last_seen' => $snapshotTime,
                ':id' => $existing['id']
            ]);
        } else {
            // Insert new ranking
            $kdRatio = $deaths > 0 ? round($kills / $deaths, 2) : $kills;

            $insertQuery = "INSERT INTO player_rankings
                           (player_name, server_ip, server_port, total_kills, total_deaths,
                            total_score, kd_ratio, games_played, last_seen)
                           VALUES (:player_name, :server_ip, :server_port, :total_kills,
                                   :total_deaths, :total_score, :kd_ratio, :games_played, :last_seen)";

            $insertStmt = $db->prepare($insertQuery);
            $insertStmt->execute([
                ':player_name' => $playerName,
                ':server_ip' => $serverIp,
                ':server_port' => $serverPort,
                ':total_kills' => $kills,
                ':total_deaths' => $deaths,
                ':total_score' => $score,
                ':kd_ratio' => $kdRatio,
                ':games_played' => 1,
                ':last_seen' => $snapshotTime
            ]);
        }

        $updateCount++;
    }

    $db->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Rankings updated successfully',
        'updated_count' => $updateCount
    ]);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }

    error_log("Error updating rankings: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error updating rankings: ' . $e->getMessage()
    ], 500);
}
