<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = getJsonInput();

if (!isset($data['user_id'])) {
    errorResponse('user_id es requerido');
}

$userId = $data['user_id'];
$bestStreak = $data['best_streak'] ?? 0;
$totalKills = $data['total_kills'] ?? 0;
$totalDeaths = $data['total_deaths'] ?? 0;
$isChampion = isset($data['is_champion']) ? ($data['is_champion'] ? 1 : 0) : 0;

try {
    $checkQuery = "SELECT id FROM player_stats WHERE user_id = :user_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':user_id', $userId);
    $checkStmt->execute();
    $exists = $checkStmt->fetch();

    if ($exists) {
        $query = "UPDATE player_stats
                  SET best_streak = :best_streak,
                      total_kills = :total_kills,
                      total_deaths = :total_deaths,
                      is_champion = :is_champion,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE user_id = :user_id";
    } else {
        $query = "INSERT INTO player_stats (user_id, best_streak, total_kills, total_deaths, is_champion)
                  VALUES (:user_id, :best_streak, :total_kills, :total_deaths, :is_champion)";
    }

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':best_streak', $bestStreak);
    $stmt->bindParam(':total_kills', $totalKills);
    $stmt->bindParam(':total_deaths', $totalDeaths);
    $stmt->bindParam(':is_champion', $isChampion);

    if ($stmt->execute()) {
        $getQuery = "SELECT * FROM player_stats WHERE user_id = :user_id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(':user_id', $userId);
        $getStmt->execute();
        $result = $getStmt->fetch();

        jsonResponse([
            'success' => true,
            'message' => 'Estadísticas actualizadas correctamente',
            'data' => $result
        ]);
    } else {
        errorResponse('Error al actualizar estadísticas');
    }
} catch (Exception $e) {
    errorResponse('Error: ' . $e->getMessage(), 500);
}
?>
