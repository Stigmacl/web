<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El email es requerido']);
    exit();
}

try {
    $db = getDBConnection();

    // Verificar si el email existe
    $stmt = $db->prepare('SELECT id, username FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Por seguridad, no revelar si el email existe o no
        echo json_encode([
            'success' => true,
            'message' => 'Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña'
        ]);
        exit();
    }

    // Generar token de recuperación
    $token = bin2hex(random_bytes(32));
    $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Guardar token en la base de datos
    $stmt = $db->prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?');
    $stmt->execute([$token, $expiry, $user['id']]);

    // En un entorno real, aquí enviarías un email con el token
    // Por ahora, solo confirmamos que se procesó la solicitud

    echo json_encode([
        'success' => true,
        'message' => 'Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña',
        'token' => $token // En producción, esto NO debe enviarse, solo por email
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al procesar la solicitud']);
}
