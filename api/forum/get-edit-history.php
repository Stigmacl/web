<?php
error_reporting(0);
ini_set('display_errors', 0);

require_once '../config/database.php';

startSecureSession();

if (!isset($_SESSION['user_id'])) {
    jsonResponse([
        'success' => false,
        'message' => 'No autorizado'
    ], 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse([
        'success' => false,
        'message' => 'Método no permitido'
    ], 405);
}

if (!isset($_GET['replyId'])) {
    jsonResponse([
        'success' => false,
        'message' => 'ID de la respuesta es requerido'
    ], 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que la tabla existe
    $checkTable = "SHOW TABLES LIKE 'forum_reply_edit_history'";
    $tableExists = $db->query($checkTable);

    if ($tableExists->rowCount() == 0) {
        jsonResponse([
            'success' => true,
            'history' => []
        ]);
        return;
    }

    $query = "SELECT eh.*, u.username, u.avatar
              FROM forum_reply_edit_history eh
              JOIN users u ON eh.user_id = u.id
              WHERE eh.reply_id = :reply_id
              ORDER BY eh.edited_at DESC";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':reply_id', $_GET['replyId']);
    $stmt->execute();

    $history = [];
    while ($row = $stmt->fetch()) {
        $history[] = [
            'id' => $row['id'],
            'oldContent' => $row['old_content'],
            'newContent' => $row['new_content'],
            'editedAt' => $row['edited_at'],
            'editor' => [
                'username' => $row['username'],
                'avatar' => $row['avatar']
            ]
        ];
    }

    jsonResponse([
        'success' => true,
        'history' => $history
    ]);

} catch (Exception $e) {
    error_log("Error en get-edit-history.php: " . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>
