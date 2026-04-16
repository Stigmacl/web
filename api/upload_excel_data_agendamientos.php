<?php
/**
 * upload_excel_data_agendamientos.php
 * Extensión de upload_excel_data.php para manejar importación de agendamientos
 * 
 * Inserta en tbl_agendamientos y cruza automáticamente con tbl_dotacion
 * para obtener el supervisor por RUT del cliente
 */

require_once 'config.php';

header('Content-Type: application/json');

$rawData = file_get_contents("php://input");
$payload = json_decode($rawData, true);

if (!$payload || !isset($payload['type']) || !isset($payload['data'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Carga de datos inválida"]);
    exit;
}

$db = Database::conectar();
$type = $payload['type'];
$data = $payload['data'];
$registrosProcesados = 0;

try {
    if ($type === 'agendamientos') {
        // Preparar statement para insertar agendamientos
        $stmt = $db->prepare("
            INSERT INTO tbl_agendamientos (
                id_agendamiento, fecha_creacion, hora_creacion, fecha_agendamiento,
                rut_cliente, dv_cliente, nombre_contacto, email,
                telefono_contacto, telefono_movil, servicio, tipo,
                desbloqueo_tarjetas, reseteo_tarjetas, observaciones, estado,
                id_usuario, supervisor, usuario_crea, usuario_callback,
                comentario_callback, fecha_cierre_callback, tipo_pac,
                tarjeta_credito_pac, cuenta_cargo_pac, tipo_bloqueo_tc,
                tipo_canal_tc, tipo_reseteo_atm, modalidad_reseteo_atm,
                numero_tarjeta_bloqueo, numero_operacion, numero_cuenta,
                rut_titular_seguro, numero_atencion_denuncio, tipo_problema_seguro,
                fecha_envio_documentacion, medio_envio_documentacion, documentos_enviados
            ) VALUES (
                :id_agendamiento, :fecha_creacion, :hora_creacion, :fecha_agendamiento,
                :rut_cliente, :dv_cliente, :nombre_contacto, :email,
                :telefono_contacto, :telefono_movil, :servicio, :tipo,
                :desbloqueo_tarjetas, :reseteo_tarjetas, :observaciones, :estado,
                :id_usuario, :supervisor, :usuario_crea, :usuario_callback,
                :comentario_callback, :fecha_cierre_callback, :tipo_pac,
                :tarjeta_credito_pac, :cuenta_cargo_pac, :tipo_bloqueo_tc,
                :tipo_canal_tc, :tipo_reseteo_atm, :modalidad_reseteo_atm,
                :numero_tarjeta_bloqueo, :numero_operacion, :numero_cuenta,
                :rut_titular_seguro, :numero_atencion_denuncio, :tipo_problema_seguro,
                :fecha_envio_documentacion, :medio_envio_documentacion, :documentos_enviados
            )
            ON DUPLICATE KEY UPDATE
                fecha_creacion = VALUES(fecha_creacion),
                fecha_agendamiento = VALUES(fecha_agendamiento),
                nombre_contacto = VALUES(nombre_contacto),
                email = VALUES(email),
                telefono_contacto = VALUES(telefono_contacto),
                telefono_movil = VALUES(telefono_movil),
                servicio = VALUES(servicio),
                tipo = VALUES(tipo),
                desbloqueo_tarjetas = VALUES(desbloqueo_tarjetas),
                reseteo_tarjetas = VALUES(reseteo_tarjetas),
                observaciones = VALUES(observaciones),
                estado = VALUES(estado),
                supervisor = VALUES(supervisor),
                usuario_callback = VALUES(usuario_callback),
                comentario_callback = VALUES(comentario_callback),
                fecha_cierre_callback = VALUES(fecha_cierre_callback)
        ");

        foreach ($data as $row) {
            // Validar que tenga ID y RUT
            if (empty($row['id_agendamiento']) || empty($row['rut_cliente'])) {
                continue;
            }

            // Normalizar RUT
            $rutCliente = preg_replace('/[^0-9kK]/', '', $row['rut_cliente']);

            // Buscar supervisor por RUT en tbl_dotacion
            $supervisor = null;
            if (!empty($row['supervisor'])) {
                $supervisor = strtoupper(trim($row['supervisor']));
            } else {
                $qSup = $db->prepare("
                    SELECT supervisor_asignado FROM tbl_dotacion
                    WHERE REPLACE(REPLACE(rut, '-', ''), '.', '') = ?
                    LIMIT 1
                ");
                $qSup->execute([$rutCliente]);
                $supData = $qSup->fetch();
                if ($supData && !empty($supData['supervisor_asignado'])) {
                    $supervisor = $supData['supervisor_asignado'];
                }
            }

            // Validar y normalizar estado
            $estado = strtoupper(trim($row['estado'] ?? 'RECHAZADO'));
            if (!in_array($estado, ['RECHAZADO', 'EJECUTADO', 'EJECUTADOCONLLAMADO'])) {
                $estado = 'RECHAZADO';
            }

            // Convertir fechas
            $fechaCreacion = _convertirFecha($row['fecha_creacion'] ?? null);
            $fechaAgend = _convertirFecha($row['fecha_agendamiento'] ?? null);
            $fechaCierre = _convertirFechaHora($row['fecha_cierre_callback'] ?? null);
            $fechaEnvio = _convertirFechaHora($row['fecha_envio_documentacion'] ?? null);

            // Ejecutar insert
            $stmt->execute([
                ':id_agendamiento' => $row['id_agendamiento'],
                ':fecha_creacion' => $fechaCreacion,
                ':hora_creacion' => $row['hora_creacion'] ?? null,
                ':fecha_agendamiento' => $fechaAgend,
                ':rut_cliente' => $rutCliente,
                ':dv_cliente' => $row['dv_cliente'] ?? null,
                ':nombre_contacto' => $row['nombre_contacto'] ?? null,
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
                ':fecha_cierre_callback' => $fechaCierre,
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
                ':fecha_envio_documentacion' => $fechaEnvio,
                ':medio_envio_documentacion' => $row['medio_envio_documentacion'] ?? null,
                ':documentos_enviados' => $row['documentos_enviados'] ?? null
            ]);

            $registrosProcesados++;
        }
    }

    echo json_encode(["status" => "success", "inserted" => $registrosProcesados]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Fallo escribiendo en la BD", "details" => $e->getMessage()]);
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function _convertirFecha($dateStr) {
    if (!$dateStr) return null;
    
    try {
        // Si es número (Excel date serial)
        if (is_numeric($dateStr) && $dateStr > 10000) {
            $date = new DateTime();
            $date->setTimestamp((int)(($dateStr - 25569) * 86400));
            return $date->format('Y-m-d');
        }
        
        // Si es string de fecha
        $date = new DateTime($dateStr);
        return $date->format('Y-m-d');
    } catch (Exception $e) {
        return null;
    }
}

function _convertirFechaHora($dateStr) {
    if (!$dateStr) return null;
    
    try {
        // Si es número (Excel date serial)
        if (is_numeric($dateStr) && $dateStr > 10000) {
            $date = new DateTime();
            $date->setTimestamp((int)(($dateStr - 25569) * 86400));
            return $date->format('Y-m-d H:i:s');
        }
        
        // Si es string de fecha
        $date = new DateTime($dateStr);
        return $date->format('Y-m-d H:i:s');
    } catch (Exception $e) {
        return null;
    }
}
?>
