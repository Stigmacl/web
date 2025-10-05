<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function queryUnrealPlayers($ip, $port, $timeout = 2) {
    $socket = @fsockopen("udp://$ip", $port, $errno, $errstr, $timeout);

    if (!$socket) {
        return null;
    }

    stream_set_timeout($socket, $timeout);
    stream_set_blocking($socket, true);

    $query = "\x79\x00\x00\x00\x01";
    fwrite($socket, $query);

    $response = fread($socket, 8192);
    fclose($socket);

    if (!$response || strlen($response) < 5) {
        return null;
    }

    return parsePlayerInfo($response);
}

function parsePlayerInfo($data) {
    $pos = 5;
    $players = [];

    if ($pos + 4 > strlen($data)) {
        return $players;
    }

    $numPlayers = unpack('V', substr($data, $pos, 4))[1];
    $pos += 4;

    for ($i = 0; $i < $numPlayers && $pos < strlen($data); $i++) {
        $player = [];

        if ($pos + 4 > strlen($data)) break;

        $playerId = unpack('V', substr($data, $pos, 4))[1];
        $pos += 4;

        $player['name'] = readString($data, $pos);

        if ($pos + 4 > strlen($data)) break;
        $player['ping'] = unpack('V', substr($data, $pos, 4))[1];
        $pos += 4;

        if ($pos + 4 > strlen($data)) break;
        $player['score'] = unpack('V', substr($data, $pos, 4))[1];
        $pos += 4;

        if ($pos + 4 > strlen($data)) break;
        $player['team'] = unpack('V', substr($data, $pos, 4))[1];
        $pos += 4;

        if ($pos + 4 > strlen($data)) break;
        $player['frags'] = unpack('V', substr($data, $pos, 4))[1];
        $pos += 4;

        if ($pos + 4 > strlen($data)) break;
        $player['deaths'] = unpack('V', substr($data, $pos, 4))[1];
        $pos += 4;

        $players[] = $player;
    }

    return $players;
}

function readString(&$data, &$pos) {
    $str = '';
    while ($pos < strlen($data)) {
        $char = $data[$pos++];
        if ($char === "\x00") break;
        $str .= $char;
    }
    return $str;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$ip = $_GET['ip'] ?? '';
$port = (int)($_GET['port'] ?? 0);
$timeout = (int)($_GET['timeout'] ?? 3);

if (empty($ip) || $port <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'IP and port are required']);
    exit;
}

$timeout = max(1, min($timeout, 10));

$players = queryUnrealPlayers($ip, $port, $timeout);

if ($players === null) {
    http_response_code(503);
    echo json_encode(['error' => 'Server not responding']);
    exit;
}

echo json_encode($players, JSON_PRETTY_PRINT);
