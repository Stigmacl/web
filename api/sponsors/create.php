<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
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

    if (empty($data['name']) || empty($data['logo'])) {
        throw new Exception('Nombre y logo son requeridos');
    }

    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM sponsors";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $displayOrder = $result['next_order'];

    $query = "INSERT INTO sponsors (
        name, logo, website, whatsapp, instagram,
        facebook, youtube, twitch, kick, display_order, is_active
    ) VALUES (
        :name, :logo, :website, :whatsapp, :instagram,
        :facebook, :youtube, :twitch, :kick, :display_order, :is_active
    )";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':name', $data['name']);
    $stmt->bindParam(':logo', $data['logo']);
    $stmt->bindParam(':website', $data['website']);
    $stmt->bindParam(':whatsapp', $data['whatsapp']);
    $stmt->bindParam(':instagram', $data['instagram']);
    $stmt->bindParam(':facebook', $data['facebook']);
    $stmt->bindParam(':youtube', $data['youtube']);
    $stmt->bindParam(':twitch', $data['twitch']);
    $stmt->bindParam(':kick', $data['kick']);
    $stmt->bindParam(':display_order', $displayOrder);
    $isActive = $data['is_active'] ?? true;
    $stmt->bindParam(':is_active', $isActive, PDO::PARAM_BOOL);

    $stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Sponsor creado exitosamente',
        'id' => $db->lastInsertId()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al crear sponsor: ' . $e->getMessage()
    ]);
}
