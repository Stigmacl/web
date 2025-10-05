<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = getJsonInput();

if (!isset($data['user_id']) || !isset($data['title']) || !isset($data['tournament_name'])) {
    errorResponse('user_id, title y tournament_name son requeridos');
}

$userId = $data['user_id'];
$title = trim($data['title']);
$tournamentName = trim($data['tournament_name']);

if (empty($title) || empty($tournamentName)) {
    errorResponse('El título y el nombre del torneo no pueden estar vacíos');
}

try {
    $query = "INSERT INTO player_titles (user_id, title, tournament_name)
              VALUES (:user_id, :title, :tournament_name)";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':tournament_name', $tournamentName);

    if ($stmt->execute()) {
        $newId = $db->lastInsertId();

        $getQuery = "SELECT * FROM player_titles WHERE id = :id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(':id', $newId);
        $getStmt->execute();
        $result = $getStmt->fetch();

        jsonResponse([
            'success' => true,
            'message' => 'Título agregado correctamente',
            'data' => $result
        ]);
    } else {
        errorResponse('Error al agregar título');
    }
} catch (Exception $e) {
    errorResponse('Error: ' . $e->getMessage(), 500);
}
?>
