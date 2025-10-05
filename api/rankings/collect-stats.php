<?php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function fetchPlayersFromAPI($ip, $port) {
    $url = "https://api.lcto.cl/players?ip={$ip}&port={$port}&timeOut=12";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return null;
    }

    $data = json_decode($response, true);
    return is_array($data) ? $data : null;
}

function updateRankings($db, $serverIp, $serverPort, $players) {
    $updateCount = 0;
    $snapshotTime = date('Y-m-d H:i:s');

    foreach ($players as $player) {
        $playerName = $player['name'] ?? '';
        $kills = (int)($player['frags'] ?? 0);
        $deaths = (int)($player['deaths'] ?? 0);
        $score = (int)($player['score'] ?? 0);
        $ping = (int)($player['ping'] ?? 0);
        $team = (int)($player['team'] ?? 0);

        if (empty($playerName) || ($kills === 0 && $deaths === 0 && $score === 0)) {
            continue;
        }

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

    return $updateCount;
}

try {
    $servers = [
        ['ip' => '38.225.91.120', 'port' => 7777],
        ['ip' => '38.225.91.120', 'port' => 7755],
        ['ip' => '38.225.91.120', 'port' => 7788],
        ['ip' => '38.225.91.120', 'port' => 7744],
    ];

    $database = new Database();
    $db = $database->getConnection();

    $results = [];
    $totalUpdates = 0;

    foreach ($servers as $server) {
        $players = fetchPlayersFromAPI($server['ip'], $server['port']);

        if ($players === null) {
            $results[] = [
                'server' => "{$server['ip']}:{$server['port']}",
                'status' => 'error',
                'message' => 'Failed to fetch players'
            ];
            continue;
        }

        if (empty($players)) {
            $results[] = [
                'server' => "{$server['ip']}:{$server['port']}",
                'status' => 'success',
                'message' => 'No players online',
                'updated' => 0
            ];
            continue;
        }

        $db->beginTransaction();

        try {
            $updateCount = updateRankings($db, $server['ip'], $server['port'], $players);
            $db->commit();

            $totalUpdates += $updateCount;

            $results[] = [
                'server' => "{$server['ip']}:{$server['port']}",
                'status' => 'success',
                'updated' => $updateCount,
                'players' => count($players)
            ];
        } catch (Exception $e) {
            $db->rollBack();
            $results[] = [
                'server' => "{$server['ip']}:{$server['port']}",
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    jsonResponse([
        'success' => true,
        'message' => 'Stats collection completed',
        'total_updates' => $totalUpdates,
        'timestamp' => date('Y-m-d H:i:s'),
        'results' => $results
    ]);

} catch (Exception $e) {
    error_log("Error collecting stats: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error collecting stats: ' . $e->getMessage()
    ], 500);
}
