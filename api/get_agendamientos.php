<?php
/**
 * get_agendamientos.php
 * Obtiene agendamientos para visualización en Index, Hoja de Vida, KPI y Admin
 *
 * FIX: Se agregó LEFT JOIN con tbl_dotacion_fusion para resolver el supervisor
 * real del ejecutivo usando id_usuario (RUT sin DV) cruzado contra el campo rut
 * de tbl_dotacion_fusion (que puede incluir DV y/o puntos).
 * REGEXP_REPLACE limpia el RUT de fusión dejando solo dígitos+k, luego LEFT()
 * recorta al mismo largo que id_usuario para comparar sin dígito verificador.
 *
 * Parámetros GET:
 * - action      : 'pendientes' (RECHAZADO) | 'positivos' (EJECUTADO/EJECUTADOCONLLAMADO) | 'all'
 * - supervisor  : nombre del supervisor (filtra su equipo)
 * - rut         : RUT del cliente (filtro de hoja de vida)
 * - fecha_desde / fecha_hasta : rango de fechas (fecha_agendamiento)
 */

header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

try {
    $pdo = Database::conectar();

    $action     = $_GET['action']      ?? 'all';
    $supervisor = $_GET['supervisor']  ?? null;
    $rut        = $_GET['rut']         ?? null;
    $fechaDesde = $_GET['fecha_desde'] ?? null;
    $fechaHasta = $_GET['fecha_hasta'] ?? null;

    /*
    ══════════════════════════════════════════════════════════════════
     JOIN con tbl_dotacion_fusion para resolver supervisor del ejecutivo
     ──────────────────────────────────────────────────────────────────
     ag.id_usuario             → '8955467'         (solo dígitos, sin DV)
     fus.rut (posibles formatos):
         '8955467-k'           → REGEXP_REPLACE → '8955467k' → LEFT(9,7) = '8955467'
         '8.955.467-k'         → REGEXP_REPLACE → '8955467k' → LEFT(9,7) = '8955467'
         '8955467'             → ya limpio

     Bug 4 Fix: Comparamos AMBAS variantes para máxima cobertura:
       (a) LEFT(rut_limpio, LENGTH(id_usuario)) = id_usuario  ← id_usuario sin DV vs rut con DV
       (b) REGEXP_REPLACE(fus.rut, ...) = ag.id_usuario       ← ambos sin DV (edge case)
    ══════════════════════════════════════════════════════════════════
    */
    $sql = "SELECT
                ag.id,
                ag.id_agendamiento,
                ag.fecha_creacion,
                ag.fecha_agendamiento,
                ag.rut_cliente,
                ag.nombre_contacto,
                ag.servicio,
                ag.tipo,
                ag.observaciones,
                ag.estado,
                ag.usuario_crea,
                ag.id_usuario,
                ag.comentario_callback,
                ag.timestamp_creacion,

                -- Nombre completo del ejecutivo desde dotación (prioridad sobre usuario_crea)
                COALESCE(fus.nombre, ag.usuario_crea) AS nombre_ejecutivo,

                -- Supervisor resuelto desde dotación; fallback al campo supervisor de la tabla si existiera
                COALESCE(fus.supervisor, ag.supervisor) AS supervisor_resuelto

            FROM tbl_agendamientos ag

            LEFT JOIN tbl_dotacion_fusion fus
                ON ag.id_usuario IS NOT NULL
                AND ag.id_usuario <> ''
                AND (
                    -- Variante A: id_usuario es el RUT sin DV; fus.rut puede tener DV y puntos
                    LEFT(
                        REGEXP_REPLACE(fus.rut, '[^0-9kK]', ''),
                        LENGTH(ag.id_usuario)
                    ) = ag.id_usuario
                    OR
                    -- Variante B: ambos ya están limpios sin DV (casos donde fus.rut solo tiene dígitos)
                    REGEXP_REPLACE(fus.rut, '[^0-9kK]', '') = ag.id_usuario
                )

            WHERE 1=1";

    $params = [];

    /* ── Filtro por estado ─────────────────────────────────────── */
    if ($action === 'pendientes') {
        $sql .= " AND ag.estado = 'RECHAZADO'";
    } elseif ($action === 'positivos') {
        $sql .= " AND ag.estado IN ('EJECUTADO', 'EJECUTADOCONLLAMADO')";
    }

    /* ── Filtro por supervisor (resuelto vía JOIN) ─────────────── */
    if ($supervisor) {
        $sql .= " AND COALESCE(fus.supervisor, ag.supervisor) = ?";
        $params[] = $supervisor;
    }

    /* ── Filtro por RUT del cliente ────────────────────────────── */
    if ($rut) {
        $rutNorm = preg_replace('/[^0-9kK]/', '', $rut);
        $sql .= " AND (ag.rut_cliente = ? OR ag.rut_cliente = ?)";
        $params[] = $rut;
        $params[] = $rutNorm;
    }

    /* ── Filtro por rango de fechas ────────────────────────────── */
    if ($fechaDesde) {
        $sql .= " AND ag.fecha_agendamiento >= ?";
        $params[] = $fechaDesde;
    }
    if ($fechaHasta) {
        $sql .= " AND ag.fecha_agendamiento <= ?";
        $params[] = $fechaHasta;
    }

    $sql .= " ORDER BY ag.fecha_agendamiento DESC LIMIT 1000";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $agendamientos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($agendamientos);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
