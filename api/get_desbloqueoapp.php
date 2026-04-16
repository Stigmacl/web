<?php
/**
 * api/get_desbloqueoapp.php
 * Obtiene los desbloqueos de APP y los convierte al formato de errores globales
 * para que se muestren en index.html y se contabilicen como errores "rechazados"
 */

require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $db = Database::conectar();

    // Obtener todos los desbloqueos con estado RECHAZADO
    $query = "SELECT * FROM tbl_desbloqueoapp WHERE estado_desbloqueo = 'RECHAZADO' ORDER BY fecha_registro_eat DESC LIMIT 2000";
    
    $stmt = $db->query($query);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];
    foreach ($rows as $row) {
        // Mapear la estructura de desbloqueos al formato de errores globales
        $mapped = [
            'id' => 'desbloqueo-' . $row['id_desbloqueo'],
            'categoria' => 'Desbloqueos APP',
            'fecha' => date('d M Y', strtotime($row['fecha_registro_eat'] ?? date('Y-m-d'))),
            'n_ot' => $row['id_desbloqueo'],
            'rut' => $row['rut_cliente'],
            'cliente' => $row['nombre_cliente'] ?? 'SIN NOMBRE',
            'ejecutivo' => $row['eat_username'] ?? 'SIN EJECUTIVO',
            'rutEjecutivo' => $row['eat_rut'],
            'supervisor' => '', // Se resolverá desde dotación usando eat_rut
            'error' => $row['comentario_callback'] ?? $row['comentario_origen'] ?? 'Sin comentario',
            'tipificacion' => $row['tipo'] ?? 'DESBLOQUEO',
            'agendamientoEstado' => 'RECHAZADO',
            
            // Campos específicos de desbloqueos
            'desbloqueoApp' => $row['bloqueo_app'],
            'desbloqueoRutPay' => $row['bloqueo_rutpay'],
            'autenticado' => $row['autenticado'],
            'tipoAutenticado' => $row['tipo_autenticado'],
            
            // Estado operativo (para gestión)
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
