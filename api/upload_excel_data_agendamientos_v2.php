<?php
/**
 * upload_excel_data_agendamientos_v2.php - VERSIÓN FINAL (Abril 2026)
 * Cruce automático robusto por nombre + RUT + usuario
 */

require_once 'config.php';

header('Content-Type: application/json');

$rawData = file_get_contents("php://input");
$payload = json_decode($rawData, true);

if (!$payload || $payload['type'] !== 'agendamientos' || empty($payload['data'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Datos de agendamientos inválidos"]);
    exit;
}

$db = Database::conectar();
$data = $payload['data'];
$procesados = 0;
$con_supervisor = 0;

try {
    $stmt = $db->prepare("
        INSERT INTO tbl_agendamientos (
            id_agendamiento, fecha_creacion, hora_creacion, fecha_agendamiento,
            rut_cliente, dv_cliente, nombre_contacto, email, telefono_contacto, telefono_movil,
            servicio, tipo, desbloqueo_tarjetas, reseteo_tarjetas, observaciones, estado,
            id_usuario, supervisor, usuario_crea, usuario_callback, comentario_callback,
            fecha_cierre_callback, tipo_pac, tarjeta_credito_pac, cuenta_cargo_pac,
            tipo_bloqueo_tc, tipo_canal_tc, tipo_reseteo_atm, modalidad_reseteo_atm,
            numero_tarjeta_bloqueo, numero_operacion, numero_cuenta,
            rut_titular_seguro, numero_atencion_denuncio, tipo_problema_seguro,
            fecha_envio_documentacion, medio_envio_documentacion, documentos_enviados
        ) VALUES (
            :id_agendamiento, :fecha_creacion, :hora_creacion, :fecha_agendamiento,
            :rut_cliente, :dv_cliente, :nombre_contacto, :email, :telefono_contacto, :telefono_movil,
            :servicio, :tipo, :desbloqueo_tarjetas, :reseteo_tarjetas, :observaciones, :estado,
            :id_usuario, :supervisor, :usuario_crea, :usuario_callback, :comentario_callback,
            :fecha_cierre_callback, :tipo_pac, :tarjeta_credito_pac, :cuenta_cargo_pac,
            :tipo_bloqueo_tc, :tipo_canal_tc, :tipo_reseteo_atm, :modalidad_reseteo_atm,
            :numero_tarjeta_bloqueo, :numero_operacion, :numero_cuenta,
            :rut_titular_seguro, :numero_atencion_denuncio, :tipo_problema_seguro,
            :fecha_envio_documentacion, :medio_envio_documentacion, :documentos_enviados
        )
        ON DUPLICATE KEY UPDATE 
            estado = VALUES(estado),
            observaciones = VALUES(observaciones),
            supervisor = COALESCE(VALUES(supervisor), supervisor),
            comentario_callback = VALUES(comentario_callback),
            fecha_cierre_callback = VALUES(fecha_cierre_callback)
    ");

    foreach ($data as $row) {
        if (empty($row['id_agendamiento']) || empty($row['rut_cliente'])) continue;

        $rutCliente = preg_replace('/[^0-9kK]/', '', $row['rut_cliente'] ?? '');
        $nombreContacto = trim($row['nombre_contacto'] ?? '');
        $supervisor = null;

        // === CRUCE AUTOMÁTICO (en orden de efectividad) ===
        if (!empty($nombreContacto)) {
            $q = $db->prepare("
                SELECT supervisor FROM tbl_dotacion_fusion 
                WHERE UPPER(TRIM(nombre)) LIKE UPPER(?) 
                   OR UPPER(TRIM(nombre_1)) LIKE UPPER(?)
                LIMIT 1
            ");
            $like = "%" . strtoupper($nombreContacto) . "%";
            $q->execute([$like, $like]);
            if ($r = $q->fetch()) {
                $supervisor = strtoupper(trim($r['supervisor']));
            }
        }

        if (empty($supervisor) && !empty($rutCliente)) {
            $q = $db->prepare("
                SELECT supervisor FROM tbl_dotacion_fusion 
                WHERE rut = ? OR REPLACE(rut, '.', '') = ? OR REPLACE(rut, '-', '') = ?
                LIMIT 1
            ");
            $q->execute([$rutCliente, $rutCliente, $rutCliente]);
            if ($r = $q->fetch()) $supervisor = strtoupper(trim($r['supervisor']));
        }

        if (empty($supervisor)) {
            $usuarioEj = trim($row['usuario_crea'] ?? $row['id_usuario'] ?? $row['usuario'] ?? '');
            if (!empty($usuarioEj)) {
                $q = $db->prepare("SELECT supervisor FROM tbl_dotacion_fusion WHERE UPPER(TRIM(usuario)) = UPPER(TRIM(?)) LIMIT 1");
                $q->execute([$usuarioEj]);
                if ($r = $q->fetch()) $supervisor = strtoupper(trim($r['supervisor']));
            }
        }

        $estado = strtoupper(trim($row['estado'] ?? 'RECHAZADO'));
        if (!in_array($estado, ['RECHAZADO', 'EJECUTADO', 'EJECUTADOCONLLAMADO'])) {
            $estado = 'RECHAZADO';
        }

        // Ejecutar inserción
        $stmt->execute([
            ':id_agendamiento' => $row['id_agendamiento'],
            ':fecha_creacion' => _convertirFecha($row['fecha_creacion'] ?? null),
            ':hora_creacion' => $row['hora_creacion'] ?? null,
            ':fecha_agendamiento' => _convertirFecha($row['fecha_agendamiento'] ?? null),
            ':rut_cliente' => $rutCliente,
            ':dv_cliente' => $row['dv_cliente'] ?? null,
            ':nombre_contacto' => $nombreContacto,
            ':email' => $row['email'] ?? null,
            ':telefono_contacto' => $row['telefono_contacto'] ?? null,
            ':telefono_movil' => $row['telefono_movil'] ?? null,
            ':servicio' => $row['servicio'] ?? null,
            ':tipo' => $row['tipo'] ?? null,
            ':desbloqueo_tarjetas' => $row['desbloqueo_tarjetas'] ?? null,
            ':reseteo_tarjetas' => $row['reseteo_tarjetas'] ?? null,
            ':observaciones' => $row['observaciones'] ?? null,
            ':estado' => $estado,
            ':id_usuario' => $row['id_usuario'] ?? null,
            ':supervisor' => $supervisor,
            ':usuario_crea' => $row['usuario_crea'] ?? null,
            ':usuario_callback' => $row['usuario_callback'] ?? null,
            ':comentario_callback' => $row['comentario_callback'] ?? null,
            ':fecha_cierre_callback' => _convertirFechaHora($row['fecha_cierre_callback'] ?? null),
            ':tipo_pac' => $row['tipo_pac'] ?? null,
            ':tarjeta_credito_pac' => $row['tarjeta_credito_pac'] ?? null,
            ':cuenta_cargo_pac' => $row['cuenta_cargo_pac'] ?? null,
            ':tipo_bloqueo_tc' => $row['tipo_bloqueo_tc'] ?? null,
            ':tipo_canal_tc' => $row['tipo_canal_tc'] ?? null,
            ':tipo_reseteo_atm' => $row['tipo_reseteo_atm'] ?? null,
            ':modalidad_reseteo_atm' => $row['modalidad_reseteo_atm'] ?? null,
            ':numero_tarjeta_bloqueo' => $row['numero_tarjeta_bloqueo'] ?? null,
            ':numero_operacion' => $row['numero_operacion'] ?? null,
            ':numero_cuenta' => $row['numero_cuenta'] ?? null,
            ':rut_titular_seguro' => $row['rut_titular_seguro'] ?? null,
            ':numero_atencion_denuncio' => $row['numero_atencion_denuncio'] ?? null,
            ':tipo_problema_seguro' => $row['tipo_problema_seguro'] ?? null,
            ':fecha_envio_documentacion' => _convertirFechaHora($row['fecha_envio_documentacion'] ?? null),
            ':medio_envio_documentacion' => $row['medio_envio_documentacion'] ?? null,
            ':documentos_enviados' => $row['documentos_enviados'] ?? null
        ]);

        if ($supervisor) $con_supervisor++;
        $procesados++;
    }

    echo json_encode([
        "status" => "success",
        "inserted" => $procesados,
        "con_supervisor" => $con_supervisor,
        "mensaje" => "Importación completada. " . $con_supervisor . " registros con supervisor asignado."
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

// === Helpers de fecha (mantén estas funciones al final del archivo) ===
function _convertirFecha($dateStr) {
    if (!$dateStr) return null;
    try {
        if (is_numeric($dateStr) && $dateStr > 10000) {
            $date = new DateTime();
            $date->setTimestamp((int)(($dateStr - 25569) * 86400));
            return $date->format('Y-m-d');
        }
        $date = new DateTime($dateStr);
        return $date->format('Y-m-d');
    } catch (Exception $e) { return null; }
}

function _convertirFechaHora($dateStr) {
    if (!$dateStr) return null;
    try {
        if (is_numeric($dateStr) && $dateStr > 10000) {
            $date = new DateTime();
            $date->setTimestamp((int)(($dateStr - 25569) * 86400));
            return $date->format('Y-m-d H:i:s');
        }
        $date = new DateTime($dateStr);
        return $date->format('Y-m-d H:i:s');
    } catch (Exception $e) { return null; }
}
?>