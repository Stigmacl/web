<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT * FROM sponsors WHERE is_active = 1 ORDER BY display_order ASC, created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();

    $sponsors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $sponsors
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener sponsors: ' . $e->getMessage()
    ]);
}
