<?php
require_once '../config/database.php';

startSecureSession();

try {
    $database = new Database();
    $conn = $database->getConnection();

    $query = "SELECT stream_url, is_active, descriptive_text, updated_at FROM streaming_config WHERE id = 1";
    $stmt = $conn->prepare($query);
    $stmt->execute();

    $config = $stmt->fetch();

    if ($config) {
        jsonResponse([
            'success' => true,
            'config' => $config
        ]);
    } else {
        jsonResponse([
            'success' => true,
            'config' => [
                'stream_url' => '',
                'is_active' => false,
                'descriptive_text' => 'Vuelve pronto para ver contenido en vivo',
                'updated_at' => null
            ]
        ]);
    }

} catch (Exception $e) {
    error_log("Error getting streaming config: " . $e->getMessage());
    errorResponse('Error al obtener la configuración de streaming', 500);
}
?>
