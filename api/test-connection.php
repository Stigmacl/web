<?php
/**
 * Script de diagnóstico para probar la conexión y configuración
 * Accede a: https://tu-dominio.com/api/test-connection.php
 */

// Mostrar todos los errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');

$results = [
    'php_version' => phpversion(),
    'server_info' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'database' => [],
    'session' => [],
    'permissions' => []
];

// Test 1: Conexión a base de datos
try {
    $host = 'localhost';
    $db_name = 'tactica2_tactical_ops_chile';
    $username = 'tactica2_root';
    $password = 'Trini3915..';

    $conn = new PDO(
        "mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    $results['database']['connection'] = 'OK';

    // Verificar tablas críticas
    $tables = ['users', 'news', 'clans', 'tournaments'];
    foreach ($tables as $table) {
        $stmt = $conn->query("SHOW TABLES LIKE '$table'");
        $exists = $stmt->rowCount() > 0;
        $results['database']['tables'][$table] = $exists ? 'EXISTS' : 'MISSING';
    }

    // Verificar estructura de tabla news
    try {
        $stmt = $conn->query("DESCRIBE news");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $results['database']['news_columns'] = $columns;
    } catch (Exception $e) {
        $results['database']['news_structure_error'] = $e->getMessage();
    }

    // Verificar usuarios
    $stmt = $conn->query("SELECT COUNT(*) as count FROM users");
    $results['database']['user_count'] = $stmt->fetch()['count'];

} catch (PDOException $e) {
    $results['database']['error'] = $e->getMessage();
    $results['database']['connection'] = 'FAILED';
}

// Test 2: Sesiones
try {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $results['session']['status'] = 'OK';
    $results['session']['save_path'] = session_save_path();
    $results['session']['writable'] = is_writable(session_save_path()) ? 'YES' : 'NO';
} catch (Exception $e) {
    $results['session']['error'] = $e->getMessage();
}

// Test 3: Permisos de archivos
$paths_to_check = [
    __DIR__ . '/config/database.php',
    __DIR__ . '/news/create.php',
    __DIR__ . '/auth/register.php'
];

foreach ($paths_to_check as $path) {
    if (file_exists($path)) {
        $results['permissions'][basename($path)] = [
            'readable' => is_readable($path) ? 'YES' : 'NO',
            'perms' => substr(sprintf('%o', fileperms($path)), -4)
        ];
    }
}

// Test 4: Extensiones PHP
$required_extensions = ['pdo', 'pdo_mysql', 'json', 'mbstring', 'session'];
foreach ($required_extensions as $ext) {
    $results['php_extensions'][$ext] = extension_loaded($ext) ? 'LOADED' : 'MISSING';
}

// Test 5: Variables de servidor importantes
$results['server_vars'] = [
    'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT'] ?? 'Not set',
    'HTTP_HOST' => $_SERVER['HTTP_HOST'] ?? 'Not set',
    'HTTPS' => $_SERVER['HTTPS'] ?? 'Not set',
    'REQUEST_SCHEME' => $_SERVER['REQUEST_SCHEME'] ?? 'Not set'
];

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
