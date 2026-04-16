<?php
require_once 'config.php';

$json = file_get_contents('http://localhost/api/get_agendamientos.php?action=all');
$data = json_decode($json, true);

if(is_array($data) && count($data) > 0) {
    echo "✅ API retorna array válido\n";
    echo "Total elementos: " . count($data) . "\n\n";
    
    echo "Primer elemento campos:\n";
    $first = $data[0];
    foreach(array_keys($first) as $field) {
        echo "  - $field\n";
    }
    
    echo "\nBuscando 'supervisor_resuelto' en primeros 10:\n";
    for($i=0; $i<min(10, count($data)); $i++) {
        if(isset($data[$i]['supervisor_resuelto'])) {
            echo "  [$i] supervisor_resuelto = " . $data[$i]['supervisor_resuelto'] . "\n";
        } else {
            echo "  [$i] ❌ NO tiene supervisor_resuelto\n";
        }
    }
} else {
    echo "❌ API no retorna array válido\n";
}
?>
