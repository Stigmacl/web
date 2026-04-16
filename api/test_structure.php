<?php
require_once 'config.php';

try {
    $pdo = Database::conectar();
    
    echo "🔍 TEST 1: Estructura de tbl_dotacion_fusion\n";
    $result = $pdo->query("DESCRIBE tbl_dotacion_fusion");
    $columns = $result->fetchAll();
    foreach($columns as $col) {
        echo "  - " . $col['Field'] . " (" . $col['Type'] . ")\n";
    }
    echo "\n";
    
    echo "🔍 TEST 2: Buscar Ignacio Henriquez en Dotación\n";
    $result = $pdo->query("SELECT * FROM tbl_dotacion_fusion WHERE nombre LIKE '%IGNACIO%' OR nombre LIKE '%HENRIQUEZ%' LIMIT 5");
    $rows = $result->fetchAll();
    echo "Registros encontrados: " . count($rows) . "\n";
    if(count($rows) > 0) {
        echo "Columnas: " . implode(", ", array_keys($rows[0])) . "\n";
        foreach($rows as $row) {
            echo "  - " . json_encode($row) . "\n";
        }
    }
    echo "\n";
    
    echo "🔍 TEST 3: Ver algunos supervisores únicos\n";
    $result = $pdo->query("SELECT DISTINCT supervisor FROM tbl_dotacion_fusion LIMIT 10");
    $rows = $result->fetchAll();
    foreach($rows as $row) {
        echo "  - " . $row['supervisor'] . "\n";
    }
    
} catch(Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
