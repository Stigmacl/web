<?php
/**
 * api/get_errors_unified.php
 * Obtiene errores de TODAS las fuentes:
 * - tbl_errores_ingesta (errores genéricos)
 * - tbl_desbloqueoapp (desbloqueos de app)
 * Y los unifica en un solo formato para el frontend
 */

require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $db = Database::conectar();
    
    $supervisor = isset($_GET['supervisor']) ? $_GET['supervisor'] : '';
    
    // 1. ERRORES GENÉRICOS desde tbl_errores_ingesta
    $query1 = "SELECT t1.*, t2.estado_operativo, t2.nota_auditoria, t2.autor_gestion, t2.fecha_gestion 
              FROM tbl_errores_ingesta t1 
              LEFT JOIN tbl_gestiones_operativas t2 ON t1.id_reporte = t2.fk_id_reporte 
              ORDER BY t1.fecha_origen DESC LIMIT 2000";
    
    $stmt1 = $db->query($query1);
    $rows1 = $stmt1->fetchAll(PDO::FETCH_ASSOC);
    
    $result = [];
    
    // Procesar errores genéricos
    foreach ($rows1 as $row) {
        $campos = $row['campos_especificos'] ? json_decode($row['campos_especificos'], true) : [];
        
        $mapped = [
            'id' => $row['id_reporte'],
            'categoria' => $row['categoria'],
            'fecha' => date('d M Y', strtotime($row['fecha_origen'])),
            'n_ot' => $row['n_ot'],
            'rut' => $row['rut_cliente'],
            'cliente' => isset($campos['cliente']) ? $campos['cliente'] : 'SIN NOMBRE',
            'ejecutivo' => $row['nombre_ejecutivo'],
            'rutEjecutivo' => $row['rut_ejecutivo'],
            'supervisor' => $row['nombre_supervisor'],
            'error' => $row['observacion_cruda'],
            'tipificacion' => $row['tipificacion'],
            'agendamientoEstado' => $row['estado_origen'],
            'estado' => $row['estado_operativo'] ?: 'pendiente',
            'observacionSupervisor' => $row['nota_auditoria'] ?: '',
            'autorGestion' => $row['autor_gestion'] ?: ''
        ];
        
        if ($row['categoria'] === 'ONP') {
            $mapped['chequesNoBloqueados'] = isset($campos['chequesNoBloqueados']) ? $campos['chequesNoBloqueados'] : '';
        } else if ($row['categoria'] === 'Desbloqueos APP') {
            $mapped['desbloqueoApp'] = isset($campos['desbloqueoApp']) ? $campos['desbloqueoApp'] : '';
            $mapped['desbloqueoRutPay'] = isset($campos['desbloqueoRutPay']) ? $campos['desbloqueoRutPay'] : '';
            $mapped['autenticado'] = isset($campos['autenticado']) ? $campos['autenticado'] : '';
            $mapped['tipoAutenticado'] = isset($campos['tipoAutenticado']) ? $campos['tipoAutenticado'] : '';
        }
        
        $result[] = $mapped;
    }
    
    // 2. DESBLOQUEOS desde tbl_desbloqueoapp (solo RECHAZADOS)
    $query2 = "SELECT * FROM tbl_desbloqueoapp WHERE estado_desbloqueo = 'RECHAZADO' ORDER BY fecha_registro_eat DESC LIMIT 2000";
    
    $stmt2 = $db->query($query2);
    $rows2 = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    // Procesar desbloqueos
    foreach ($rows2 as $row) {
        // Resolver supervisor desde dotación usando eat_rut
        $supervisor_resuelto = '';
        if (!empty($row['eat_rut'])) {
            $rutBase = preg_replace('/[^0-9Kk]/', '', $row['eat_rut']);
            if (strlen($rutBase) > 2) {
                $search = substr($rutBase, 0, -1);
                $qSup = $db->prepare("SELECT supervisor_asignado FROM tbl_dotacion WHERE REPLACE(REPLACE(rut, '-', ''), '.', '') LIKE ? LIMIT 1");
                $qSup->execute(["%$search%"]);
                $supData = $qSup->fetch();
                if ($supData && !empty($supData['supervisor_asignado'])) {
                    $supervisor_resuelto = $supData['supervisor_asignado'];
                }
            }
        }
        
        $mapped = [
            'id' => 'desbloqueo-' . $row['id_desbloqueo'],
            'categoria' => 'Desbloqueos APP',
            'fecha' => date('d M Y', strtotime($row['fecha_registro_eat'] ?? date('Y-m-d'))),
            'n_ot' => $row['id_desbloqueo'],
            'rut' => $row['rut_cliente'],
            'cliente' => $row['nombre_cliente'] ?? 'SIN NOMBRE',
            'ejecutivo' => $row['eat_username'] ?? 'SIN EJECUTIVO',
            'rutEjecutivo' => $row['eat_rut'],
            'supervisor' => $supervisor_resuelto,
            'error' => $row['comentario_callback'] ?? $row['comentario_origen'] ?? 'Sin comentario',
            'tipificacion' => $row['tipo'] ?? 'DESBLOQUEO',
            'agendamientoEstado' => 'RECHAZADO',
            'desbloqueoApp' => $row['bloqueo_app'],
            'desbloqueoRutPay' => $row['bloqueo_rutpay'],
            'autenticado' => $row['autenticado'],
            'tipoAutenticado' => $row['tipo_autenticado'],
            'estado' => 'pendiente',
            'observacionSupervisor' => '',
            'autorGestion' => ''
        ];
        
        $result[] = $mapped;
    }

    echo json_encode([
        'status' => 'success',
        'data' => $result
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
