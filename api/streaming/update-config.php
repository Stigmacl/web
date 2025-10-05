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

if (!isset($data['is_active']) || !isset($data['descriptive_text'])) {
    errorResponse('Datos incompletos', 400);
}

// Permitir stream_url vacío
if (!isset($data['stream_url'])) {
    $data['stream_url'] = '';
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    $query = "INSERT INTO streaming_config (id, stream_url, is_active, descriptive_text, updated_by, updated_at)
              VALUES (1, :stream_url_ins, :is_active_ins, :descriptive_text_ins, :updated_by_ins, NOW())
              ON DUPLICATE KEY UPDATE
              stream_url = :stream_url_upd,
              is_active = :is_active_upd,
              descriptive_text = :descriptive_text_upd,
              updated_by = :updated_by_upd,
              updated_at = NOW()";

    $stmt = $conn->prepare($query);

    // valores para INSERT
    $stmt->bindParam(':stream_url_ins', $data['stream_url']);
    $stmt->bindParam(':is_active_ins', $data['is_active'], PDO::PARAM_BOOL);
    $stmt->bindParam(':descriptive_text_ins', $data['descriptive_text']);
    $stmt->bindParam(':updated_by_ins', $_SESSION['user_id'], PDO::PARAM_INT);

    // valores para UPDATE
    $stmt->bindParam(':stream_url_upd', $data['stream_url']);
    $stmt->bindParam(':is_active_upd', $data['is_active'], PDO::PARAM_BOOL);
    $stmt->bindParam(':descriptive_text_upd', $data['descriptive_text']);
    $stmt->bindParam(':updated_by_upd', $_SESSION['user_id'], PDO::PARAM_INT);

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
