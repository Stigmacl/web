<?php
require_once '../config/database.php';

startSecureSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'No autorizado'
    ], 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse([
        'success' => false,
        'message' => 'Método no permitido'
    ], 405);
}

$data = getJsonInput();

if (!isset($data['isEnabled']) && !isset($data['items'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Datos requeridos faltantes'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar si el usuario es administrador
    $userQuery = "SELECT role FROM users WHERE id = :id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindValue(':id', $_SESSION['user_id']);
    $userStmt->execute();
    $user = $userStmt->fetch();

    if (!$user || $user['role'] !== 'admin') {
        jsonResponse([
            'success' => false,
            'message' => 'No tienes permisos para modificar el banner'
        ], 403);
    }

    $db->beginTransaction();

    // Actualizar configuración de estado
    if (isset($data['isEnabled'])) {
        $updateConfig = $db->prepare("UPDATE banner_config SET is_enabled = :is_enabled WHERE id = 1");
        $updateConfig->bindValue(':is_enabled', $data['isEnabled'] ? 1 : 0, PDO::PARAM_INT);
        $updateConfig->execute();
    }

    // Procesar los elementos del banner
    if (isset($data['items']) && is_array($data['items'])) {
        $db->exec("UPDATE banner_items SET is_active = 0");

        foreach ($data['items'] as $index => $item) {
            $imageSettings = $item['imageSettings'] ?? [];

            // Verificar existencia
            $check = $db->prepare("SELECT id FROM banner_items WHERE banner_id = :banner_id");
            $check->bindValue(':banner_id', $item['id']);
            $check->execute();

            $isExisting = $check->fetch();

            if ($isExisting) {
                $sql = "
                UPDATE banner_items SET 
                    type = :type,
                    url = :url,
                    link = :link,
                    title = :title,
                    description = :description,
                    autoplay = :autoplay,
                    muted = :muted,
                    duration = :duration,
                    object_fit = :object_fit,
                    object_position = :object_position,
                    scale_percent = :scale_percent,
                    brightness = :brightness,
                    contrast = :contrast,
                    blur = :blur,
                    sort_order = :sort_order,
                    is_active = 1,
                    updated_at = NOW()
                WHERE banner_id = :banner_id";
            } else {
                $sql = "
                INSERT INTO banner_items (
                    banner_id, type, url, link, title, description, autoplay, muted, duration,
                    object_fit, object_position, scale_percent, brightness, contrast, blur,
                    sort_order, is_active
                ) VALUES (
                    :banner_id, :type, :url, :link, :title, :description, :autoplay, :muted, :duration,
                    :object_fit, :object_position, :scale_percent, :brightness, :contrast, :blur,
                    :sort_order, 1
                )";
            }

            $stmt = $db->prepare($sql);
            $stmt->bindValue(':banner_id', $item['id']);
            $stmt->bindValue(':type', $item['type']);
            $stmt->bindValue(':url', $item['url']);
            $stmt->bindValue(':link', $item['link'] ?? null);
            $stmt->bindValue(':title', $item['title'] ?? null);
            $stmt->bindValue(':description', $item['description'] ?? null);
            $stmt->bindValue(':autoplay', isset($item['autoplay']) ? (int)$item['autoplay'] : 1, PDO::PARAM_INT);
            $stmt->bindValue(':muted', isset($item['muted']) ? (int)$item['muted'] : 1, PDO::PARAM_INT);
            $stmt->bindValue(':duration', $item['duration'] ?? 5, PDO::PARAM_INT);
            $stmt->bindValue(':object_fit', $imageSettings['objectFit'] ?? 'cover');
            $stmt->bindValue(':object_position', $imageSettings['objectPosition'] ?? 'center center');
            $stmt->bindValue(':scale_percent', $imageSettings['scale'] ?? 100, PDO::PARAM_INT);
            $stmt->bindValue(':brightness', $imageSettings['brightness'] ?? 100, PDO::PARAM_INT);
            $stmt->bindValue(':contrast', $imageSettings['contrast'] ?? 100, PDO::PARAM_INT);
            $stmt->bindValue(':blur', $imageSettings['blur'] ?? 0, PDO::PARAM_INT);
            $stmt->bindValue(':sort_order', $index + 1, PDO::PARAM_INT);
            $stmt->execute();
        }
    }

    $db->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Configuración del banner actualizada exitosamente'
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }

    error_log("Error en update-banner-config.php: " . $e->getMessage());

    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ], 500);
}
?>
