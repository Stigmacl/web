<?php
// api/save_gestion.php
// Guarda o actualiza la gestión operativa de un supervisor sobre un error.
require_once 'config.php';

header('Content-Type: application/json');

$rawData = file_get_contents("php://input");
$payload = json_decode($rawData, true);

if (!$payload || !isset($payload['id_reporte']) || !isset($payload['autor'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Datos incompletos: se requieren id_reporte y autor."]);
    exit;
}

$db = Database::conectar();

try {
    $stmt = $db->prepare("
        INSERT INTO tbl_gestiones_operativas (fk_id_reporte, autor_gestion, estado_operativo, nota_auditoria)
        VALUES (:id, :autor, :estado, :nota)
        ON DUPLICATE KEY UPDATE
            autor_gestion     = VALUES(autor_gestion),
            estado_operativo  = VALUES(estado_operativo),
            nota_auditoria    = VALUES(nota_auditoria),
            fecha_gestion     = CURRENT_TIMESTAMP
    ");

    $estado = !empty($payload['nota']) ? 'realizado' : 'pendiente';

    $stmt->execute([
        ':id'     => $payload['id_reporte'],
        ':autor'  => trim($payload['autor']),
        ':estado' => $payload['estado'] ?? $estado,
        ':nota'   => $payload['nota'] ?? null
    ]);

    echo json_encode(["status" => "success", "estado" => $estado]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
