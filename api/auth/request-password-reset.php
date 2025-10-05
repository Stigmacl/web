<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/mailer.php'; // Ajusta si tu mailer está en otra ruta

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Obtener datos del cuerpo JSON
$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El email es requerido']);
    exit();
}

try {
    // Conexión a la base de datos
    $database = new Database();
    $db = $database->getConnection();

    // Verificar si el email existe
    $stmt = $db->prepare('SELECT id, username FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // No revelar si el email existe o no por motivos de seguridad
    if (!$user) {
        echo json_encode([
            'success' => true,
            'message' => 'Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña'
        ]);
        exit();
    }

    // Generar token de recuperación
    $token = bin2hex(random_bytes(32));
    $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Guardar token y fecha de expiración
    $stmt = $db->prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?');
    $stmt->execute([$token, $expiry, $user['id']]);

    // Construir enlace de restablecimiento
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'tacticalopschile.cl';
    $baseUrl = $protocol . '://' . $host;
    $resetLink = "$baseUrl/reset-password?token=$token";

    // Crear contenido del correo
    $htmlBody = '
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
    </head>
    <body style="margin:0; padding:0; font-family:Arial,sans-serif; background-color:#0f172a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a; padding:40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%); border-radius:16px; border:1px solid #1e40af; box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                        <tr>
                            <td style="padding:40px 40px 20px; text-align:center; background:linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%); border-radius:16px 16px 0 0;">
                                <img src="http://tacticalopschile.cl/Correo.png" alt="Tactical Ops Chile" style="max-width:200px; height:auto; margin-bottom:20px;">
                                <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:bold;">Recuperación de Contraseña</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:40px;">
                                <p style="color:#cbd5e1; font-size:16px;">Hola <strong style="color:#60a5fa;">' . htmlspecialchars($user['username']) . '</strong>,</p>
                                <p style="color:#cbd5e1; font-size:16px;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Tactical Ops Chile</strong>.</p>
                                <p style="color:#cbd5e1; font-size:16px;">Para restablecer tu contraseña, haz clic en el siguiente botón:</p>
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding:20px 0;">
                                            <a href="' . $resetLink . '" style="display:inline-block; padding:16px 40px; background:linear-gradient(135deg,#2563eb 0%,#1e40af 100%); color:#ffffff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px;">Restablecer Contraseña</a>
                                        </td>
                                    </tr>
                                </table>
                                <div style="background-color:#1e293b; border-left:4px solid #f59e0b; padding:20px; border-radius:8px; margin:30px 0;">
                                    <p style="color:#fbbf24; font-size:14px; font-weight:bold; margin:0 0 10px;">⚠️ Información Importante</p>
                                    <p style="color:#cbd5e1; font-size:14px;">Este enlace es válido solo por <strong style="color:#60a5fa;">1 hora</strong>. Si no solicitaste este cambio, puedes ignorar este correo.</p>
                                </div>
                                <p style="color:#94a3b8; font-size:14px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                                <p style="color:#60a5fa; font-size:13px; word-break:break-all;">' . $resetLink . '</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:30px 40px; background-color:#0f172a; border-radius:0 0 16px 16px; border-top:1px solid #1e40af; text-align:center;">
                                <p style="color:#64748b; font-size:13px;">Este es un correo automático, por favor no respondas.</p>
                                <p style="color:#64748b; font-size:13px;">© 2025 Tactical Ops Chile - Comunidad Oficial</p>
                                <p><a href="http://tacticalopschile.cl" style="color:#3b82f6; font-size:12px; text-decoration:none;">tacticalopschile.cl</a></p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    ';

    $textBody = "Hola {$user['username']},\n\n"
              . "Para restablecer tu contraseña, visita este enlace:\n"
              . "$resetLink\n\n"
              . "El enlace expira en 1 hora.\n\n"
              . "Si no solicitaste este cambio, puedes ignorar este correo.\n\n"
              . "Equipo de Tactical Ops Chile";

    // Enviar correo
    $emailSent = sendEmail($email, $user['username'], 'Recuperación de Contraseña - Tactical Ops Chile', $htmlBody, $textBody);

    if (!$emailSent) {
        error_log("[PASSWORD RESET] ERROR: No se pudo enviar email a: $email");
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al enviar el correo. Verifica la configuración SMTP o los logs.'
        ]);
        exit();
    }

    echo json_encode([
        'success' => true,
        'message' => 'Si el email existe en nuestro sistema, recibirás un correo con instrucciones para restablecer tu contraseña'
    ]);

} catch (Exception $e) {
    error_log("[PASSWORD RESET] Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al procesar la solicitud']);
}
