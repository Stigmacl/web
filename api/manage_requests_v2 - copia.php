<?php
/**
 */

header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';
$action = $_GET['action'] ?? $_POST['action'] ?? null;

try {
    $pdo = Database::conectar();

    // =============================================
    // 1. RESUMEN (Total Pendientes)
    // =============================================
    if ($action === 'get_errors_summary') {
        $supervisor = trim($_GET['supervisor'] ?? '');
        
        if (empty($supervisor)) {
            echo json_encode(['error' => 'Supervisor requerido']);
            exit;
        }

        // Solo contamos agendamientos (por ahora)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total 
            FROM tbl_agendamientos 
            WHERE supervisor = ? AND estado = 'RECHAZADO'
        ");
        $stmt->execute([$supervisor]);
        $agendamientosCount = $stmt->fetchColumn() ?? 0;

        echo json_encode([
            'errores_pendientes' => 0,
            'agendamientos_pendientes' => $agendamientosCount,
            'total_pendientes' => $agendamientosCount
        ]);
        exit;
    }

    // =============================================
    // 2. GET ALL ERRORS - VERSIÓN CORREGIDA
    // =============================================
    if ($action === 'get_all_errors') {
        $supervisor   = trim($_GET['supervisor'] ?? '');
        $estadoFiltro = strtoupper(trim($_GET['estado'] ?? 'PENDIENTE'));

        if (empty($supervisor)) {
            echo json_encode(['error' => 'Supervisor requerido']);
            exit;
        }

        $where = "";
        if ($estadoFiltro === 'PENDIENTE' || $estadoFiltro === 'PENDIENTES') {
            $where = " AND a.estado = 'RECHAZADO'";
        } elseif (in_array($estadoFiltro, ['HISTORICO', 'HISTÓRICO', 'RESUELTO'])) {
            where = " AND a.estado IN ('EJECUTADO', 'EJECUTADOCONLLAMADO')";
        }

$sql = "
SELECT 
    'AGENDAMIENTO' as tipo,
    a.id,
    a.rut_cliente as rut,
    a.nombre_contacto as nombre,
    a.observaciones as descripcion,
    a.estado,
    a.supervisor,
    a.nombre_ejecutivo,
    a.fecha_agendamiento as fecha,
    a.timestamp_creacion
FROM tbl_agendamientos a
INNER JOIN tbl_ejecutivos e 
    ON UPPER(TRIM(a.nombre_ejecutivo)) = UPPER(TRIM(e.nombre))
WHERE UPPER(TRIM(e.supervisor)) = UPPER(TRIM(?))
{$where}
ORDER BY a.fecha_agendamiento DESC
LIMIT 1000
";

        $stmt = $pdo->prepare($sql);
        $partes = explode(' ', trim($supervisor));
$busqueda = $partes[0] . '%' . end($partes);

        $stmt->execute([$supervisor]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($data);
        exit;
    }

    // =============================================
    // 3. Mantener compatibilidad con versión anterior
    // =============================================
    require_once 'manage_requests.php';

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>