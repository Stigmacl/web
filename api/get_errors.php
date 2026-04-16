<?php
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $db = Database::conectar();
    
    $supervisor = isset($_GET['supervisor']) ? $_GET['supervisor'] : '';
    
    // Si queremos filtrar en el backend, podemos agregar WHERE...
    // Pero el frontend hace mucho flitro cruzado con dotación, así que es mejor traer todo (o todo lo del supervisor y sin supervisor)
    
    // Traer todos los errores de los ultimos meses. Limitamos a ~2000 por si acaso.
    $query = "SELECT t1.*, t2.estado_operativo, t2.nota_auditoria, t2.autor_gestion, t2.fecha_gestion 
              FROM tbl_errores_ingesta t1 
              LEFT JOIN tbl_gestiones_operativas t2 ON t1.id_reporte = t2.fk_id_reporte 
              ORDER BY t1.fecha_origen DESC LIMIT 2000";
    
    $stmt = $db->query($query);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $result = [];
    foreach ($rows as $row) {
        $campos = $row['campos_especificos'] ? json_decode($row['campos_especificos'], true) : [];
        
        // Mapeo al formato que espera frontend (globalErrorsCollection)
        $mapped = [
            'id' => $row['id_reporte'],
            'categoria' => $row['categoria'],
            'fecha' => date('d M Y', strtotime($row['fecha_origen'])), // formato excel "18 mar 2026" aproximado
            'n_ot' => $row['n_ot'],
            'rut' => $row['rut_cliente'],
            'cliente' => isset($campos['cliente']) ? $campos['cliente'] : 'SIN NOMBRE',
            'ejecutivo' => $row['nombre_ejecutivo'],
            'rutEjecutivo' => $row['rut_ejecutivo'],
            'supervisor' => $row['nombre_supervisor'],
            'error' => $row['observacion_cruda'],
            'tipificacion' => $row['tipificacion'],
            'agendamientoEstado' => $row['estado_origen'],
            
            // Campos de gestion operativa
            'estado' => $row['estado_operativo'] ?: 'pendiente',
            'observacionSupervisor' => $row['nota_auditoria'] ?: '',
            'autorGestion' => $row['autor_gestion'] ?: ''
        ];
        
        // Campos específicos que frontend saca
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
