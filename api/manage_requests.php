<?php
/**
 * manage_requests.php
 * API de Solicitudes de Dotación — versión completa con:
 *   - Log de auditoría compartido (tbl_log_solicitudes)
 *   - Notificaciones persistentes en BD (tbl_notificaciones)
 *   - Reincorporación con comentario obligatorio
 *   - Impacto automático en tbl_dotacion al aprobar/reincorporar
 */

header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = Database::conectar();

    // ─────────────────────────────────────────────
    // GET — Consultas de lectura
    // ─────────────────────────────────────────────
    if ($method === 'GET') {

        // Listar todas las solicitudes (para admins)
        if ($action === 'list') {
            $stmt = $pdo->query("
                SELECT * FROM tbl_solicitudes_dotacion
                ORDER BY timestamp DESC
            ");
            echo json_encode($stmt->fetchAll());
            exit;
        }

        // Listar solicitudes de un supervisor específico
        if ($action === 'list_supervisor') {
            $supervisor = $_GET['supervisor'] ?? '';
            $stmt = $pdo->prepare("
                SELECT * FROM tbl_solicitudes_dotacion
                WHERE supervisor = ?
                ORDER BY timestamp DESC
            ");
            $stmt->execute([$supervisor]);
            echo json_encode($stmt->fetchAll());
            exit;
        }

        // Log de auditoría de una solicitud específica
        if ($action === 'log') {
            $id = intval($_GET['id'] ?? 0);
            $stmt = $pdo->prepare("
                SELECT * FROM tbl_log_solicitudes
                WHERE solicitud_id = ?
                ORDER BY timestamp ASC
            ");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetchAll());
            exit;
        }

        // Log completo de todas las solicitudes (visible para todos los admins)
        if ($action === 'log_all') {
            $stmt = $pdo->query("
                SELECT l.*, s.nombre AS ejecutivo_nombre, s.rut AS ejecutivo_rut, s.supervisor
                FROM tbl_log_solicitudes l
                JOIN tbl_solicitudes_dotacion s ON l.solicitud_id = s.id
                ORDER BY l.timestamp DESC
                LIMIT 200
            ");
            echo json_encode($stmt->fetchAll());
            exit;
        }

        // Notificaciones para un usuario (admin o supervisor)
        if ($action === 'notificaciones') {
            $nombre  = $_GET['nombre']  ?? '';
            $rol     = $_GET['rol']     ?? 'SUPERVISOR';

            if ($rol === 'ADMIN' || strtoupper($rol) === 'ADMIN') {
                // Todos los admins ven las mismas notificaciones de tipo ADMIN
                $stmt = $pdo->prepare("
                    SELECT * FROM tbl_notificaciones
                    WHERE target_rol = 'ADMIN'
                    ORDER BY timestamp DESC
                    LIMIT 50
                ");
                $stmt->execute();
            } else {
                // Supervisor ve solo sus notificaciones
                $stmt = $pdo->prepare("
                    SELECT * FROM tbl_notificaciones
                    WHERE target_rol = 'SUPERVISOR' AND target_nombre = ?
                    ORDER BY timestamp DESC
                    LIMIT 50
                ");
                $stmt->execute([$nombre]);
            }
            echo json_encode($stmt->fetchAll());
            exit;
        }

        // Conteo de notificaciones no vistas
        if ($action === 'notif_count') {
            $nombre = $_GET['nombre'] ?? '';
            $rol    = $_GET['rol']    ?? 'SUPERVISOR';

            if (strtoupper($rol) === 'ADMIN') {
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) AS total FROM tbl_notificaciones
                    WHERE target_rol = 'ADMIN' AND visto = 0
                ");
                $stmt->execute();
            } else {
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) AS total FROM tbl_notificaciones
                    WHERE target_rol = 'SUPERVISOR' AND target_nombre = ? AND visto = 0
                ");
                $stmt->execute([$nombre]);
            }
            echo json_encode($stmt->fetch());
            exit;
        }
    }

    // ─────────────────────────────────────────────
    // POST — Acciones de escritura
    // ─────────────────────────────────────────────
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Payload inválido']);
            exit;
        }

        // ── Crear nueva solicitud de baja ──────────────────────────────
        if ($action === 'create') {
            $rut               = trim($data['rut']              ?? '');
            $nombre            = trim($data['nombre']           ?? '');
            $supervisor        = trim($data['supervisor']       ?? '');
            $fechaEgreso       = trim($data['fechaEgreso']      ?? '');
            $categoriaPropuesta = trim($data['categoriaPropuesta'] ?? '');
            $motivo            = trim($data['motivo']           ?? '');

            if (!$rut || !$nombre || !$supervisor) {
                http_response_code(422);
                echo json_encode(['error' => 'Faltan campos obligatorios']);
                exit;
            }

            // Verificar si ya existe una solicitud PENDIENTE para este ejecutivo
            $stmtCheck = $pdo->prepare("
                SELECT id FROM tbl_solicitudes_dotacion
                WHERE rut = ? AND status = 'PENDIENTE'
                LIMIT 1
            ");
            $stmtCheck->execute([$rut]);
            if ($stmtCheck->fetch()) {
                echo json_encode(['success' => false, 'error' => 'Ya existe una solicitud pendiente para este ejecutivo.']);
                exit;
            }

            // Insertar solicitud
            $stmt = $pdo->prepare("
                INSERT INTO tbl_solicitudes_dotacion
                    (rut, nombre, supervisor, fecha_egreso, categoria_propuesta, motivo)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$rut, $nombre, $supervisor, $fechaEgreso, $categoriaPropuesta, $motivo]);
            $newId = $pdo->lastInsertId();

            // Log de auditoría: acción CREADA
            _insertLog($pdo, $newId, 'CREADA', $supervisor, 'SUPERVISOR', $motivo);

            // Notificación a TODOS los admins
            _insertNotif($pdo, 'NUEVA_SOLICITUD',
                'Nueva Solicitud de Baja',
                "{$supervisor} solicita la eliminación de dotación de {$nombre}",
                'ADMIN', null, $newId
            );

            echo json_encode(['success' => true, 'id' => $newId]);
            exit;
        }

        // ── Aprobar solicitud ──────────────────────────────────────────
        if ($action === 'approve') {
            $id             = intval($data['id']             ?? 0);
            $categoriaFinal = trim($data['categoriaFinal']   ?? '');
            $adminNombre    = trim($data['adminNombre']      ?? 'Administración');
            $comentario     = trim($data['comentario']       ?? '');

            if (!$id || !$categoriaFinal) {
                http_response_code(422);
                echo json_encode(['error' => 'Faltan campos obligatorios']);
                exit;
            }

            // Obtener datos de la solicitud
            $sol = _getSolicitud($pdo, $id);
            if (!$sol) {
                echo json_encode(['error' => 'Solicitud no encontrada']);
                exit;
            }

            // Actualizar solicitud
            $stmt = $pdo->prepare("
                UPDATE tbl_solicitudes_dotacion
                SET status = 'APROBADA',
                    categoria_final = ?,
                    admin_nombre = ?,
                    comentario_admin = ?,
                    visto_supervisor = 0
                WHERE id = ?
            ");
            $stmt->execute([$categoriaFinal, $adminNombre, $comentario, $id]);

            // Impacto en tbl_dotacion: cambiar estado del ejecutivo
            $stmtDot = $pdo->prepare("
                UPDATE tbl_dotacion
                SET estado_dotacion = ?
                WHERE rut = ?
            ");
            $stmtDot->execute([$categoriaFinal, $sol['rut']]);

            // Log de auditoría
            _insertLog($pdo, $id, 'APROBADA', $adminNombre, 'ADMIN', $comentario);

            // Notificación al supervisor
            _insertNotif($pdo, 'SOLICITUD_APROBADA',
                'Solicitud Aprobada',
                "Tu solicitud de baja para {$sol['nombre']} fue APROBADA como \"{$categoriaFinal}\" por {$adminNombre}.",
                'SUPERVISOR', $sol['supervisor'], $id
            );

            echo json_encode(['success' => true]);
            exit;
        }

        // ── Rechazar solicitud ─────────────────────────────────────────
        if ($action === 'reject') {
            $id          = intval($data['id']          ?? 0);
            $adminNombre = trim($data['adminNombre']   ?? 'Administración');
            $comentario  = trim($data['comentario']    ?? '');

            if (!$id) {
                http_response_code(422);
                echo json_encode(['error' => 'ID requerido']);
                exit;
            }

            $sol = _getSolicitud($pdo, $id);
            if (!$sol) {
                echo json_encode(['error' => 'Solicitud no encontrada']);
                exit;
            }

            $stmt = $pdo->prepare("
                UPDATE tbl_solicitudes_dotacion
                SET status = 'RECHAZADA',
                    admin_nombre = ?,
                    comentario_admin = ?,
                    visto_supervisor = 0
                WHERE id = ?
            ");
            $stmt->execute([$adminNombre, $comentario, $id]);

            // Log de auditoría
            _insertLog($pdo, $id, 'RECHAZADA', $adminNombre, 'ADMIN', $comentario);

            // Notificación al supervisor
            _insertNotif($pdo, 'SOLICITUD_RECHAZADA',
                'Solicitud Rechazada',
                "Tu solicitud de baja para {$sol['nombre']} fue RECHAZADA por {$adminNombre}." . ($comentario ? " Motivo: {$comentario}" : ''),
                'SUPERVISOR', $sol['supervisor'], $id
            );

            echo json_encode(['success' => true]);
            exit;
        }

        // ── Reincorporar ejecutivo ─────────────────────────────────────
        if ($action === 'reincorporar') {
            $id                   = intval($data['id']                    ?? 0);
            $reincorporadorNombre = trim($data['reincorporadorNombre']    ?? 'Administración');
            $motivoReincorporacion = trim($data['motivoReincorporacion']  ?? '');

            if (!$id || !$motivoReincorporacion) {
                http_response_code(422);
                echo json_encode(['error' => 'El motivo de reincorporación es obligatorio']);
                exit;
            }

            $sol = _getSolicitud($pdo, $id);
            if (!$sol) {
                echo json_encode(['error' => 'Solicitud no encontrada']);
                exit;
            }

            // Actualizar solicitud
            $stmt = $pdo->prepare("
                UPDATE tbl_solicitudes_dotacion
                SET status = 'REINCORPORADA',
                    reincorporador_nombre = ?,
                    motivo_reincorporacion = ?,
                    visto_supervisor = 0
                WHERE id = ?
            ");
            $stmt->execute([$reincorporadorNombre, $motivoReincorporacion, $id]);

            // Revertir estado en tbl_dotacion a Activo
            $stmtDot = $pdo->prepare("
                UPDATE tbl_dotacion
                SET estado_dotacion = 'Activo'
                WHERE rut = ?
            ");
            $stmtDot->execute([$sol['rut']]);

            // Log de auditoría
            _insertLog($pdo, $id, 'REINCORPORADA', $reincorporadorNombre, 'ADMIN', $motivoReincorporacion);

            // Notificación al supervisor
            _insertNotif($pdo, 'REINCORPORACION',
                'Ejecutivo Reincorporado',
                "{$sol['nombre']} ha sido reincorporado a tu dotación por {$reincorporadorNombre}. Motivo: {$motivoReincorporacion}",
                'SUPERVISOR', $sol['supervisor'], $id
            );

            echo json_encode(['success' => true]);
            exit;
        }

        // ── Marcar notificaciones como vistas ──────────────────────────
        if ($action === 'marcar_vistas') {
            $nombre = trim($data['nombre'] ?? '');
            $rol    = strtoupper(trim($data['rol'] ?? 'SUPERVISOR'));

            if ($rol === 'ADMIN') {
                $stmt = $pdo->prepare("
                    UPDATE tbl_notificaciones SET visto = 1
                    WHERE target_rol = 'ADMIN'
                ");
                $stmt->execute();
            } else {
                $stmt = $pdo->prepare("
                    UPDATE tbl_notificaciones SET visto = 1
                    WHERE target_rol = 'SUPERVISOR' AND target_nombre = ?
                ");
                $stmt->execute([$nombre]);
            }

            echo json_encode(['success' => true]);
            exit;
        }

        // ── Compatibilidad: acción 'update' del código antiguo ─────────
        // Redirige internamente a approve/reject/reincorporar
        if ($action === 'update') {
            $id     = intval($data['id']     ?? 0);
            $status = strtoupper(trim($data['status'] ?? ''));

            if ($status === 'APROBADA') {
                $_GET['action'] = 'approve';
                $data['categoriaFinal'] = $data['categoriaFinal'] ?? '';
                $data['adminNombre']    = $data['adminNombre']    ?? 'Administración';
                $data['comentario']     = $data['comentario']     ?? '';
            } elseif ($status === 'RECHAZADA') {
                $_GET['action'] = 'reject';
                $data['adminNombre'] = $data['adminNombre'] ?? 'Administración';
                $data['comentario']  = $data['comentario']  ?? '';
            } elseif ($status === 'REINCORPORADA') {
                $_GET['action'] = 'reincorporar';
                $data['reincorporadorNombre']  = $data['reincorporadorNombre']  ?? ($data['adminNombre'] ?? 'Administración');
                $data['motivoReincorporacion'] = $data['motivoReincorporacion'] ?? '';
            } else {
                echo json_encode(['error' => 'Status no reconocido']);
                exit;
            }

            // Re-ejecutar con la nueva acción
            $action = $_GET['action'];

            // Llamada recursiva simulada: reutilizar lógica
            $sol = _getSolicitud($pdo, $id);
            if (!$sol) { echo json_encode(['error' => 'Solicitud no encontrada']); exit; }

            if ($action === 'approve') {
                $pdo->prepare("UPDATE tbl_solicitudes_dotacion SET status='APROBADA', categoria_final=?, admin_nombre=?, comentario_admin=?, visto_supervisor=0 WHERE id=?")
                    ->execute([$data['categoriaFinal'], $data['adminNombre'], $data['comentario'], $id]);
                $pdo->prepare("UPDATE tbl_dotacion SET estado_dotacion=? WHERE rut=?")
                    ->execute([$data['categoriaFinal'], $sol['rut']]);
                _insertLog($pdo, $id, 'APROBADA', $data['adminNombre'], 'ADMIN', $data['comentario']);
                _insertNotif($pdo, 'SOLICITUD_APROBADA', 'Solicitud Aprobada',
                    "Tu solicitud de baja para {$sol['nombre']} fue APROBADA como \"{$data['categoriaFinal']}\" por {$data['adminNombre']}.",
                    'SUPERVISOR', $sol['supervisor'], $id);
            } elseif ($action === 'reject') {
                $pdo->prepare("UPDATE tbl_solicitudes_dotacion SET status='RECHAZADA', admin_nombre=?, comentario_admin=?, visto_supervisor=0 WHERE id=?")
                    ->execute([$data['adminNombre'], $data['comentario'], $id]);
                _insertLog($pdo, $id, 'RECHAZADA', $data['adminNombre'], 'ADMIN', $data['comentario']);
                _insertNotif($pdo, 'SOLICITUD_RECHAZADA', 'Solicitud Rechazada',
                    "Tu solicitud de baja para {$sol['nombre']} fue RECHAZADA por {$data['adminNombre']}.",
                    'SUPERVISOR', $sol['supervisor'], $id);
            } elseif ($action === 'reincorporar') {
                $pdo->prepare("UPDATE tbl_solicitudes_dotacion SET status='REINCORPORADA', reincorporador_nombre=?, motivo_reincorporacion=?, visto_supervisor=0 WHERE id=?")
                    ->execute([$data['reincorporadorNombre'], $data['motivoReincorporacion'], $id]);
                $pdo->prepare("UPDATE tbl_dotacion SET estado_dotacion='Activo' WHERE rut=?")
                    ->execute([$sol['rut']]);
                _insertLog($pdo, $id, 'REINCORPORADA', $data['reincorporadorNombre'], 'ADMIN', $data['motivoReincorporacion']);
                _insertNotif($pdo, 'REINCORPORACION', 'Ejecutivo Reincorporado',
                    "{$sol['nombre']} ha sido reincorporado a tu dotación.",
                    'SUPERVISOR', $sol['supervisor'], $id);
            }

            echo json_encode(['success' => true]);
            exit;
        }
    }

    // Acción no reconocida
    http_response_code(404);
    echo json_encode(['error' => 'Acción no reconocida']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// ─────────────────────────────────────────────────────────────
// Helpers privados
// ─────────────────────────────────────────────────────────────

function _getSolicitud(PDO $pdo, int $id): ?array {
    $stmt = $pdo->prepare("SELECT * FROM tbl_solicitudes_dotacion WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function _insertLog(PDO $pdo, int $solicitudId, string $accion, string $actorNombre, string $actorRol, ?string $comentario): void {
    $stmt = $pdo->prepare("
        INSERT INTO tbl_log_solicitudes (solicitud_id, accion, actor_nombre, actor_rol, comentario)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$solicitudId, $accion, $actorNombre, $actorRol, $comentario]);
}

function _insertNotif(PDO $pdo, string $tipo, string $titulo, string $mensaje, string $targetRol, ?string $targetNombre, ?int $solicitudId): void {
    $stmt = $pdo->prepare("
        INSERT INTO tbl_notificaciones (tipo, titulo, mensaje, target_rol, target_nombre, solicitud_id)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$tipo, $titulo, $mensaje, $targetRol, $targetNombre, $solicitudId]);
}
?>
