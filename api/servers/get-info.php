<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function queryUnrealServer($ip, $port, $timeout = 2) {
    $socket = @fsockopen("udp://$ip", $port, $errno, $errstr, $timeout);

    if (!$socket) {
        return null;
    }

    stream_set_timeout($socket, $timeout);
    stream_set_blocking($socket, true);

    $query = "\x79\x00\x00\x00\x00";
    fwrite($socket, $query);

    $response = fread($socket, 4096);
    fclose($socket);

    if (!$response || strlen($response) < 5) {
        return null;
    }

    return parseServerInfo($response);
}

function parseServerInfo($data) {
    $pos = 5;
    $info = [];

    $info['serverid'] = unpack('V', substr($data, $pos, 4))[1];
    $pos += 4;

    $info['ip'] = readString($data, $pos);
    $info['hostport'] = unpack('V', substr($data, $pos, 4))[1];
    $pos += 4;

    $info['queryport'] = unpack('V', substr($data, $pos, 4))[1];
    $pos += 4;

    $info['hostname'] = readString($data, $pos);
    $info['mapname'] = readString($data, $pos);
    $info['gametype'] = readString($data, $pos);

    $info['numplayers'] = unpack('V', substr($data, $pos, 4))[1];
    $pos += 4;

    $info['maxplayers'] = unpack('V', substr($data, $pos, 4))[1];
    $pos += 4;

    $flags = unpack('V', substr($data, $pos, 4))[1];
    $pos += 4;

    $info['password'] = ($flags & 0x01) ? 'True' : 'False';

    $skill = unpack('V', substr($data, $pos, 4))[1];
    $pos += 4;

    return $info;
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

function queryUnrealPlayers($ip, $port, $timeout = 2) {
    $socket = @fsockopen("udp://$ip", $port, $errno, $errstr, $timeout);

    if (!$socket) {
        return [];
    }

    stream_set_timeout($socket, $timeout);
    stream_set_blocking($socket, true);

    $query = "\x79\x00\x00\x00\x01";
    fwrite($socket, $query);

    $response = fread($socket, 8192);
    fclose($socket);

    if (!$response || strlen($response) < 5) {
        return [];
    }

    return parsePlayerInfo($response);
}

function parsePlayerInfo($data) {
    $pos = 5;
    $players = [];

    $numPlayers = unpack('V', substr($data, $pos, 4))[1];
    $pos += 4;

    for ($i = 0; $i < $numPlayers && $pos < strlen($data); $i++) {
        $player = [];

        $playerId = unpack('V', substr($data, $pos, 4))[1];
        $pos += 4;

        $player['name'] = readString($data, $pos);

        $player['ping'] = unpack('V', substr($data, $pos, 4))[1];
        $pos += 4;

        $player['score'] = unpack('V', substr($data, $pos, 4))[1];
        $pos += 4;

        if ($pos + 4 <= strlen($data)) {
            $statsId = unpack('V', substr($data, $pos, 4))[1];
            $pos += 4;
        }

        $players[] = $player;
    }

    return $players;
}

function queryUnrealRules($ip, $port, $timeout = 2) {
    $socket = @fsockopen("udp://$ip", $port, $errno, $errstr, $timeout);

    if (!$socket) {
        return [];
    }

    stream_set_timeout($socket, $timeout);
    stream_set_blocking($socket, true);

    $query = "\x79\x00\x00\x00\x02";
    fwrite($socket, $query);

    $response = fread($socket, 8192);
    fclose($socket);

    if (!$response || strlen($response) < 5) {
        return [];
    }

    return parseRules($response);
}

function parseRules($data) {
    $pos = 5;
    $rules = [];

    if ($pos + 4 > strlen($data)) {
        return $rules;
    }

    $numRules = unpack('V', substr($data, $pos, 4))[1];
    $pos += 4;

    for ($i = 0; $i < $numRules && $pos < strlen($data); $i++) {
        $key = readString($data, $pos);
        $value = readString($data, $pos);
        $rules[$key] = $value;
    }

    return $rules;
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

$serverInfo = queryUnrealServer($ip, $port, $timeout);

if ($serverInfo === null) {
    http_response_code(503);
    echo json_encode(['error' => 'Server not responding']);
    exit;
}

$players = queryUnrealPlayers($ip, $port, $timeout);
$rules = queryUnrealRules($ip, $port, $timeout);

$result = array_merge($serverInfo, [
    'players' => $players,
    'rules' => $rules,
    'mapTitle' => $rules['MapTitle'] ?? $serverInfo['mapname'] ?? '',
    'gameVer' => (int)($rules['GameVersion'] ?? 0),
    'scoreTerrorists' => (int)($rules['TerroristScore'] ?? 0),
    'scoreSpecialForces' => (int)($rules['SFScore'] ?? 0),
    'roundNumber' => (int)($rules['RoundNumber'] ?? 0),
    'timeLimit' => (int)($rules['TimeLimit'] ?? 0),
    'friendlyFire' => $rules['FriendlyFire'] ?? 'False',
    'adminName' => $rules['AdminName'] ?? '',
    'adminEmail' => $rules['AdminEmail'] ?? ''
]);

echo json_encode($result, JSON_PRETTY_PRINT);
