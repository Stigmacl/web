<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== DIAGNÓSTICO DEL SISTEMA DE RANKING ===\n\n";
echo "Fecha/Hora: " . date('Y-m-d H:i:s') . "\n\n";

echo "--- 1. Verificando conexión a la base de datos ---\n";
try {
    require_once '../config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    echo "✓ Conexión exitosa\n\n";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n\n";
    exit(1);
}

echo "--- 2. Verificando tablas ---\n";
$tables = ['player_rankings', 'ranking_snapshots'];
foreach ($tables as $table) {
    $stmt = $db->query("SHOW TABLES LIKE '$table'");
    if ($stmt->rowCount() > 0) {
        echo "✓ Tabla '$table' existe\n";

        $count = $db->query("SELECT COUNT(*) FROM $table")->fetchColumn();
        echo "  Registros: $count\n";
    } else {
        echo "✗ Tabla '$table' NO existe\n";
    }
}
echo "\n";

echo "--- 3. Probando API externa ---\n";
$testServer = ['ip' => '38.225.91.120', 'port' => 7777];
$url = "https://api.lcto.cl/players?ip={$testServer['ip']}&port={$testServer['port']}&timeOut=12";
echo "URL: $url\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
if ($error) {
    echo "✗ Error cURL: $error\n";
} else if ($httpCode === 200) {
    echo "✓ API responde correctamente\n";
    $data = json_decode($response, true);
    if (is_array($data)) {
        echo "✓ JSON válido\n";
        echo "  Jugadores encontrados: " . count($data) . "\n";
        if (count($data) > 0) {
            echo "  Ejemplo: " . json_encode($data[0], JSON_PRETTY_PRINT) . "\n";
        }
    } else {
        echo "✗ Respuesta no es un array JSON válido\n";
        echo "  Respuesta: " . substr($response, 0, 200) . "\n";
    }
} else {
    echo "✗ HTTP Error: $httpCode\n";
    echo "  Respuesta: " . substr($response, 0, 200) . "\n";
}
echo "\n";

echo "--- 4. Últimos registros en ranking_snapshots ---\n";
$stmt = $db->query("SELECT * FROM ranking_snapshots ORDER BY snapshot_time DESC LIMIT 5");
$snapshots = $stmt->fetchAll();
if (count($snapshots) > 0) {
    echo "✓ Hay " . count($snapshots) . " snapshots recientes:\n";
    foreach ($snapshots as $snap) {
        echo "  - {$snap['player_name']} | Server: {$snap['server_ip']}:{$snap['server_port']} | Tiempo: {$snap['snapshot_time']}\n";
    }
} else {
    echo "✗ NO hay snapshots registrados\n";
}
echo "\n";

echo "--- 5. Últimos registros en player_rankings ---\n";
$stmt = $db->query("SELECT * FROM player_rankings ORDER BY last_seen DESC LIMIT 5");
$rankings = $stmt->fetchAll();
if (count($rankings) > 0) {
    echo "✓ Hay " . count($rankings) . " rankings:\n";
    foreach ($rankings as $rank) {
        echo "  - {$rank['player_name']} | K/D: {$rank['kd_ratio']} | Kills: {$rank['total_kills']} | Último visto: {$rank['last_seen']}\n";
    }
} else {
    echo "✗ NO hay rankings registrados\n";
}
echo "\n";

echo "--- 6. Verificando logs de PHP ---\n";
$phpErrorLog = ini_get('error_log');
echo "Archivo de log: " . ($phpErrorLog ?: 'No configurado') . "\n\n";

echo "=== FIN DEL DIAGNÓSTICO ===\n";
echo "\n";
echo "CONCLUSIÓN:\n";
echo "- Si no hay snapshots recientes, el cron job NO está ejecutándose\n";
echo "- Si la API responde pero no hay registros, verifica el cron en cPanel\n";
echo "- Ejecuta manualmente: https://tacticalopschile.cl/api/rankings/collect-stats.php\n";
