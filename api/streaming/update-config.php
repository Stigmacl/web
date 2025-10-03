<?php
require_once '../config/database.php';

startSecureSession();

if (!isset($_SESSION['user_id'])) {
    errorResponse('No autorizado - Sesión no válida', 401);
}

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    errorResponse('No autorizado - Se requieren permisos de administrador', 403);
}

$data = getJsonInput();

if (!isset($data['stream_url']) || !isset($data['is_active'])) {
    errorResponse('Datos incompletos', 400);
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    $query = "INSERT INTO streaming_config (id, stream_url, is_active, updated_by, updated_at)
              VALUES (1, :stream_url, :is_active, :updated_by, NOW())
              ON DUPLICATE KEY UPDATE
              stream_url = :stream_url,
              is_active = :is_active,
              updated_by = :updated_by,
              updated_at = NOW()";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':stream_url', $data['stream_url']);
    $stmt->bindParam(':is_active', $data['is_active'], PDO::PARAM_BOOL);
    $stmt->bindParam(':updated_by', $_SESSION['user_id'], PDO::PARAM_INT);

    if ($stmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Configuración de streaming actualizada correctamente'
        ]);
    } else {
        errorResponse('Error al actualizar la configuración', 500);
    }

} catch (Exception $e) {
    error_log("Error updating streaming config: " . $e->getMessage());
    errorResponse('Error al actualizar la configuración de streaming', 500);
}
?>
