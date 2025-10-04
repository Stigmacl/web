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

    // Enviar email con el token de recuperación
    require_once '../config/mailer.php';

    $resetLink = "http://tacticalopschile.cl/reset-password?token=$token";

    $htmlBody = '
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0f172a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid #1e40af; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                        <!-- Header con Logo -->
                        <tr>
                            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); border-radius: 16px 16px 0 0;">
                                <img src="http://tacticalopschile.cl/Tactical_Ops_Logo.png" alt="Tactical Ops Chile" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                    Recuperación de Contraseña
                                </h1>
                            </td>
                        </tr>

                        <!-- Contenido -->
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                    Hola <strong style="color: #60a5fa;">' . htmlspecialchars($user['username']) . '</strong>,
                                </p>

                                <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                    Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Tactical Ops Chile</strong>.
                                </p>

                                <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                    Para restablecer tu contraseña, haz clic en el siguiente botón:
                                </p>

                                <!-- Botón de Acción -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding: 20px 0;">
                                            <a href="' . $resetLink . '" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);">
                                                Restablecer Contraseña
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Información adicional -->
                                <div style="background-color: #1e293b; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                    <p style="color: #fbbf24; font-size: 14px; font-weight: bold; margin: 0 0 10px;">
                                        ⚠️ Información Importante
                                    </p>
                                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin: 0;">
                                        Este enlace es válido solo por <strong style="color: #60a5fa;">1 hora</strong>. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
                                    </p>
                                </div>

                                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                                    Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
                                </p>
                                <p style="color: #60a5fa; font-size: 13px; word-break: break-all; margin: 10px 0 0;">
                                    ' . $resetLink . '
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 30px 40px; background-color: #0f172a; border-radius: 0 0 16px 16px; border-top: 1px solid #1e40af;">
                                <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 10px; text-align: center;">
                                    Este es un correo automático, por favor no respondas a este mensaje.
                                </p>
                                <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                                    © 2024 Tactical Ops Chile - Comunidad Oficial
                                </p>
                                <p style="color: #475569; font-size: 12px; margin: 15px 0 0; text-align: center;">
                                    <a href="http://tacticalopschile.cl" style="color: #3b82f6; text-decoration: none;">tacticalopschile.cl</a>
                                </p>
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
              . "Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Tactical Ops Chile.\n\n"
              . "Para restablecer tu contraseña, visita el siguiente enlace:\n"
              . "$resetLink\n\n"
              . "Este enlace es válido solo por 1 hora.\n\n"
              . "Si no solicitaste este cambio, puedes ignorar este correo de forma segura.\n\n"
              . "Saludos,\n"
              . "Equipo de Tactical Ops Chile";

    $emailSent = sendEmail($email, $user['username'], 'Recuperación de Contraseña - Tactical Ops Chile', $htmlBody, $textBody);

    if (!$emailSent) {
        error_log("Error al enviar email de recuperación a: $email");
    }

    echo json_encode([
        'success' => true,
        'message' => 'Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al procesar la solicitud']);
}
