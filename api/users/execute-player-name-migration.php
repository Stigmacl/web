<?php
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "Ejecutando migración para agregar columna player_name...\n\n";

    $migration = file_get_contents(__DIR__ . '/add-player-name-column.sql');

    $statements = array_filter(
        array_map('trim', explode(';', $migration)),
        fn($stmt) => !empty($stmt) && !str_starts_with($stmt, '--')
    );

    foreach ($statements as $statement) {
        if (!empty($statement)) {
            echo "Ejecutando: " . substr($statement, 0, 60) . "...\n";
            $db->exec($statement);
            echo "✓ Completado\n\n";
        }
    }

    echo "Verificando columna player_name...\n";
    $checkQuery = "SHOW COLUMNS FROM users LIKE 'player_name'";
    $stmt = $db->query($checkQuery);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        echo "✓ Columna player_name existe en la tabla users\n";
        echo "Tipo: " . $result['Type'] . "\n";
        echo "Null: " . $result['Null'] . "\n";
        echo "Default: " . ($result['Default'] ?? 'NULL') . "\n";
    } else {
        echo "✗ La columna player_name NO existe\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
