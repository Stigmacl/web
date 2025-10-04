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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $serverIp = $_GET['server_ip'] ?? null;
    $serverPort = isset($_GET['server_port']) ? (int)$_GET['server_port'] : null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $orderBy = $_GET['order_by'] ?? 'kd_ratio';

    // Validate order_by parameter
    $validOrderBy = ['kd_ratio', 'total_kills', 'total_score', 'games_played'];
    if (!in_array($orderBy, $validOrderBy)) {
        $orderBy = 'kd_ratio';
    }

    // Build query
    $query = "SELECT player_name, server_ip, server_port, total_kills, total_deaths,
                     total_score, kd_ratio, games_played, last_seen, created_at
              FROM player_rankings";

    $params = [];

    if ($serverIp && $serverPort) {
        $query .= " WHERE server_ip = :server_ip AND server_port = :server_port";
        $params[':server_ip'] = $serverIp;
        $params[':server_port'] = $serverPort;
    }

    $query .= " ORDER BY {$orderBy} DESC, total_kills DESC LIMIT :limit";

    $stmt = $db->prepare($query);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $rankings = [];
    $rank = 1;

    while ($row = $stmt->fetch()) {
        $rankings[] = [
            'rank' => $rank++,
            'playerName' => $row['player_name'],
            'serverIp' => $row['server_ip'],
            'serverPort' => (int)$row['server_port'],
            'totalKills' => (int)$row['total_kills'],
            'totalDeaths' => (int)$row['total_deaths'],
            'totalScore' => (int)$row['total_score'],
            'kdRatio' => (float)$row['kd_ratio'],
            'gamesPlayed' => (int)$row['games_played'],
            'lastSeen' => $row['last_seen'],
            'createdAt' => $row['created_at']
        ];
    }

    jsonResponse([
        'success' => true,
        'rankings' => $rankings,
        'server_ip' => $serverIp,
        'server_port' => $serverPort,
        'order_by' => $orderBy
    ]);

} catch (Exception $e) {
    error_log("Error getting rankings: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error getting rankings: ' . $e->getMessage()
    ], 500);
}
