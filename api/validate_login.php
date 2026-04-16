<?php
/**
 * validate_login.php
 * Versión corregida para evitar SQLSTATE[HY093]
 */

require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

function normalizar($t) {
    return strtoupper(trim((string)$t));
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $usuario = isset($input['usuario']) ? $input['usuario'] : '';

    if (empty($usuario)) {
        echo json_encode(['status' => 'error', 'message' => 'Usuario no recibido']);
        exit;
    }

    $db = Database::conectar();
    $uNorm = normalizar($usuario);

    // Usamos parámetros únicos para evitar el error HY093 en algunas versiones de PDO
    $stmt = $db->prepare("
        SELECT supervisor, jefatura, estado
        FROM tbl_dotacion_jefatura
        WHERE UPPER(TRIM(supervisor)) = :u1 
           OR UPPER(TRIM(jefatura)) = :u2
        LIMIT 1
    ");
    $stmt->execute([
        ':u1' => $uNorm,
        ':u2' => $uNorm
    ]);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$res) {
        echo json_encode(['status' => 'error', 'message' => 'Usuario no encontrado']);
        exit;
    }

    $rol = 'supervisor';
    $sups = [];
    
    $jefNom = isset($res['jefatura']) ? $res['jefatura'] : '';
    
    // Si el usuario ingresado coincide con el campo jefatura, es admin
    if (!empty($jefNom) && normalizar($jefNom) === $uNorm) {
        $rol = 'admin';
        
        // Buscar sus supervisores asociados
        $s2 = $db->prepare("SELECT DISTINCT supervisor FROM tbl_dotacion_jefatura WHERE UPPER(TRIM(jefatura)) = :j");
        $s2->execute([':j' => $uNorm]);
        $sups = array_column($s2->fetchAll(PDO::FETCH_ASSOC), 'supervisor');
    }

    echo json_encode([
        'status' => 'success',
        'rol' => $rol,
        'supervisores_asociados' => $sups,
        'usuario' => $usuario
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error', 
        'message' => 'Error en el servidor: ' . $e->getMessage()
    ]);
}
