<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = getJsonInput();

if (!isset($data['id'])) {
    errorResponse('id es requerido');
}

$titleId = $data['id'];

try {
    $query = "DELETE FROM player_titles WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $titleId);

    if ($stmt->execute()) {
        jsonResponse([
            'success' => true,
            'message' => 'Título eliminado correctamente'
        ]);
    } else {
        errorResponse('Error al eliminar título');
    }
} catch (Exception $e) {
    errorResponse('Error: ' . $e->getMessage(), 500);
}
?>
