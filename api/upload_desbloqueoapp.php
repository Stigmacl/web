<?php
/**
 * api/upload_desbloqueoapp.php
 * Endpoint para procesar la carga de desbloqueos de APP desde Excel
 * Inserta los datos en tbl_desbloqueoapp y los integra como errores globales
 */

require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $db = Database::conectar();
    $rawData = file_get_contents("php://input");
    $payload = json_decode($rawData, true);

    if (!$payload || !isset($payload['data'])) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Carga de datos inválida"
        ]);
        exit;
    }

    $data = $payload['data'];
    $fileName = $payload['fileName'] ?? 'desbloqueoapp.xlsx';
    $registrosInsertados = 0;
    $registrosActualizados = 0;

    // Preparar statement para insertar en tbl_desbloqueoapp
    $stmt = $db->prepare("
        INSERT INTO tbl_desbloqueoapp (
            rut_cliente, nombre_cliente, tipo, motivo,
            eat_rut, eat_username, fecha_registro_eat,
            bloqueo_app, bloqueo_rutpay, autenticado, tipo_autenticado, multicanalidad,
            comentario_origen, revision_callback, fecha_revision_callback,
            usuario_callback, comentario_callback, estado_desbloqueo
        ) VALUES (
            :rut_cliente, :nombre_cliente, :tipo, :motivo,
            :eat_rut, :eat_username, :fecha_registro_eat,
            :bloqueo_app, :bloqueo_rutpay, :autenticado, :tipo_autenticado, :multicanalidad,
            :comentario_origen, :revision_callback, :fecha_revision_callback,
            :usuario_callback, :comentario_callback, :estado_desbloqueo
        )
        ON DUPLICATE KEY UPDATE
            nombre_cliente = VALUES(nombre_cliente),
            tipo = VALUES(tipo),
            motivo = VALUES(motivo),
            eat_username = VALUES(eat_username),
            bloqueo_app = VALUES(bloqueo_app),
            bloqueo_rutpay = VALUES(bloqueo_rutpay),
            autenticado = VALUES(autenticado),
            tipo_autenticado = VALUES(tipo_autenticado),
            multicanalidad = VALUES(multicanalidad),
            comentario_origen = VALUES(comentario_origen),
            revision_callback = VALUES(revision_callback),
            fecha_revision_callback = VALUES(fecha_revision_callback),
            usuario_callback = VALUES(usuario_callback),
            comentario_callback = VALUES(comentario_callback),
            estado_desbloqueo = VALUES(estado_desbloqueo),
            fecha_actualizacion = CURRENT_TIMESTAMP
    ");

    $db->beginTransaction();

    foreach ($data as $row) {
        // Normalizar fechas
        $fechaRegistroEat = null;
        if (!empty($row['fecha_registro_eat'])) {
            $fechaRegistroEat = $row['fecha_registro_eat'];
        }

        $fechaRevisionCallback = null;
        if (!empty($row['fecha_revision_callback'])) {
            $fechaRevisionCallback = $row['fecha_revision_callback'];
        }

        // Ejecutar insert
        $stmt->execute([
            ':rut_cliente' => trim($row['rut_cliente'] ?? ''),
            ':nombre_cliente' => trim($row['nombre_cliente'] ?? ''),
            ':tipo' => trim($row['tipo'] ?? ''),
            ':motivo' => trim($row['motivo'] ?? ''),
            ':eat_rut' => trim($row['eat_rut'] ?? ''),
            ':eat_username' => trim($row['eat_username'] ?? ''),
            ':fecha_registro_eat' => $fechaRegistroEat,
            ':bloqueo_app' => trim($row['bloqueo_app'] ?? ''),
            ':bloqueo_rutpay' => trim($row['bloqueo_rutpay'] ?? ''),
            ':autenticado' => trim($row['autenticado'] ?? ''),
            ':tipo_autenticado' => trim($row['tipo_autenticado'] ?? ''),
            ':multicanalidad' => trim($row['multicanalidad'] ?? ''),
            ':comentario_origen' => trim($row['comentario_origen'] ?? ''),
            ':revision_callback' => trim($row['revision_callback'] ?? ''),
            ':fecha_revision_callback' => $fechaRevisionCallback,
            ':usuario_callback' => trim($row['usuario_callback'] ?? ''),
            ':comentario_callback' => trim($row['comentario_callback'] ?? ''),
            ':estado_desbloqueo' => 'RECHAZADO' // Todos los desbloqueos ingresan como RECHAZADO
        ]);

        $registrosInsertados++;
    }

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Desbloqueos de APP cargados exitosamente",
        "inserted" => $registrosInsertados,
        "fileName" => $fileName
    ]);

} catch (Exception $e) {
    if (isset($db)) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Error al procesar los desbloqueos de APP",
        "details" => $e->getMessage()
    ]);
}
?>
