<?php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $database = new Database();
    $db = $database->getConnection();

    echo json_encode([
        'status' => 'testing',
        'message' => 'Insertando jugador de prueba...',
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    echo "\n\n";

    $testPlayer = [
        'name' => 'TestPlayer_' . time(),
        'frags' => 15,
        'deaths' => 8,
        'score' => 1500,
        'ping' => 50,
        'team' => 1
    ];

    $serverIp = '38.225.91.120';
    $serverPort = 7777;
    $snapshotTime = date('Y-m-d H:i:s');

    $db->beginTransaction();

    $snapshotQuery = "INSERT INTO ranking_snapshots
                     (server_ip, server_port, player_name, kills, deaths, score, ping, team, snapshot_time)
                     VALUES (:server_ip, :server_port, :player_name, :kills, :deaths, :score, :ping, :team, :snapshot_time)";

    $snapshotStmt = $db->prepare($snapshotQuery);
    $snapshotStmt->execute([
        ':server_ip' => $serverIp,
        ':server_port' => $serverPort,
        ':player_name' => $testPlayer['name'],
        ':kills' => $testPlayer['frags'],
        ':deaths' => $testPlayer['deaths'],
        ':score' => $testPlayer['score'],
        ':ping' => $testPlayer['ping'],
        ':team' => $testPlayer['team'],
        ':snapshot_time' => $snapshotTime
    ]);

    $kdRatio = $testPlayer['deaths'] > 0 ? round($testPlayer['frags'] / $testPlayer['deaths'], 2) : $testPlayer['frags'];

    $insertQuery = "INSERT INTO player_rankings
                   (player_name, server_ip, server_port, total_kills, total_deaths,
                    total_score, kd_ratio, games_played, last_seen)
                   VALUES (:player_name, :server_ip, :server_port, :total_kills,
                           :total_deaths, :total_score, :kd_ratio, :games_played, :last_seen)";

    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->execute([
        ':player_name' => $testPlayer['name'],
        ':server_ip' => $serverIp,
        ':server_port' => $serverPort,
        ':total_kills' => $testPlayer['frags'],
        ':total_deaths' => $testPlayer['deaths'],
        ':total_score' => $testPlayer['score'],
        ':kd_ratio' => $kdRatio,
        ':games_played' => 1,
        ':last_seen' => $snapshotTime
    ]);

    $db->commit();

    $verifyStmt = $db->prepare("SELECT * FROM player_rankings WHERE player_name = :name");
    $verifyStmt->execute([':name' => $testPlayer['name']]);
    $inserted = $verifyStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Jugador de prueba insertado correctamente',
        'test_player' => $testPlayer,
        'inserted_data' => $inserted,
        'verification' => 'Verifica en: https://tacticalopschile.cl/api/rankings/get-rankings.php'
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }

    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
