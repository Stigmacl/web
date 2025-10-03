<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Método no permitido', 405);
}

$data = getJsonInput();

if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
    errorResponse('Usuario, email y contraseña son requeridos');
}

if (strlen($data['password']) < 6) {
    errorResponse('La contraseña debe tener al menos 6 caracteres');
}

if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    errorResponse('Email inválido');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar si usuario o email ya existen
    $checkQuery = "SELECT id FROM users WHERE username = :username OR email = :email";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':username', $data['username']);
    $checkStmt->bindParam(':email', $data['email']);
    $checkStmt->execute();

    if ($checkStmt->fetch()) {
        errorResponse('El usuario o email ya existe');
    }

    // Crear nuevo usuario
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    $defaultAvatar = 'https://i.ibb.co/SD0ZjMMF/Logo-Comunidad.png?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop';

    $insertQuery = "INSERT INTO users (username, email, password, avatar, status, is_online) 
                    VALUES (:username, :email, :password, :avatar, :status, 1)";
    
    $stmt = $db->prepare($insertQuery);
    $stmt->bindParam(':username', $data['username']);
    $stmt->bindParam(':email', $data['email']);
    $stmt->bindParam(':password', $hashedPassword);
    $stmt->bindParam(':avatar', $defaultAvatar);
    $status = 'Tacticals Ops Comunidad Chilena';
    $stmt->bindParam(':status', $status);
    $stmt->execute();

    $userId = $db->lastInsertId();

    // Crear estadísticas iniciales
    $statsQuery = "INSERT INTO user_stats (user_id) VALUES (:user_id)";
    $statsStmt = $db->prepare($statsQuery);
    $statsStmt->bindParam(':user_id', $userId);
    $statsStmt->execute();

    // Otorgar logro de primera conexión
    $achievementQuery = "INSERT INTO user_achievements (user_id, achievement_id) 
                        SELECT :user_id, id FROM achievements WHERE name = 'Primera Conexión'";
    $achievementStmt = $db->prepare($achievementQuery);
    $achievementStmt->bindParam(':user_id', $userId);
    $achievementStmt->execute();

    // Obtener datos del usuario creado
    $getUserQuery = "SELECT id, username, email, role, avatar, status, clan, is_active 
                     FROM users WHERE id = :id";
    $getUserStmt = $db->prepare($getUserQuery);
    $getUserStmt->bindParam(':id', $userId);
    $getUserStmt->execute();
    $user = $getUserStmt->fetch();

    $user['isOnline'] = true;
    $user['isActive'] = true;
    $user['lastLogin'] = date('c');
    $user['createdAt'] = date('c');

    // Iniciar sesión automáticamente
    startSecureSession();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];

    jsonResponse([
        'success' => true,
        'user' => $user,
        'message' => 'Registro exitoso'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>