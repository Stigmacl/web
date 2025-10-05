<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'No autorizado'
    ]);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['id'])) {
        throw new Exception('ID del sponsor es requerido');
    }

    $database = new Database();
    $db = $database->getConnection();

    $fields = [];
    $params = [':id' => $data['id']];

    if (isset($data['name'])) {
        $fields[] = "name = :name";
        $params[':name'] = $data['name'];
    }
    if (isset($data['logo'])) {
        $fields[] = "logo = :logo";
        $params[':logo'] = $data['logo'];
    }
    if (isset($data['website'])) {
        $fields[] = "website = :website";
        $params[':website'] = $data['website'];
    }
    if (isset($data['whatsapp'])) {
        $fields[] = "whatsapp = :whatsapp";
        $params[':whatsapp'] = $data['whatsapp'];
    }
    if (isset($data['instagram'])) {
        $fields[] = "instagram = :instagram";
        $params[':instagram'] = $data['instagram'];
    }
    if (isset($data['facebook'])) {
        $fields[] = "facebook = :facebook";
        $params[':facebook'] = $data['facebook'];
    }
    if (isset($data['youtube'])) {
        $fields[] = "youtube = :youtube";
        $params[':youtube'] = $data['youtube'];
    }
    if (isset($data['twitch'])) {
        $fields[] = "twitch = :twitch";
        $params[':twitch'] = $data['twitch'];
    }
    if (isset($data['kick'])) {
        $fields[] = "kick = :kick";
        $params[':kick'] = $data['kick'];
    }
    if (isset($data['is_active'])) {
        $fields[] = "is_active = :is_active";
        $params[':is_active'] = $data['is_active'];
    }
    if (isset($data['display_order'])) {
        $fields[] = "display_order = :display_order";
        $params[':display_order'] = $data['display_order'];
    }

    if (empty($fields)) {
        throw new Exception('No hay campos para actualizar');
    }

    $query = "UPDATE sponsors SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    $stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Sponsor actualizado exitosamente'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar sponsor: ' . $e->getMessage()
    ]);
}
