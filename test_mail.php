<?php
// test_mail.php
// Archivo de prueba para verificar PHPMailer desde cPanel

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Incluir PHPMailer (ajustado para tu estructura)
require_once __DIR__ . '/api/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/api/PHPMailer/src/SMTP.php';
require_once __DIR__ . '/api/PHPMailer/src/Exception.php';

$mail = new PHPMailer(true);

try {
    // Configuración SMTP del correo en cPanel
    $mail->isSMTP();
    $mail->Host       = 'mail.tacticalopschile.cl'; // servidor SMTP
    $mail->SMTPAuth   = true;
    $mail->Username   = 'password@tacticalopschile.cl'; // tu correo completo
    $mail->Password   = 'tacticalopschile1'; // clave del correo
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // TLS (puedes probar ENCRYPTION_SMTPS con puerto 465)
    $mail->Port       = 587; // puerto SMTP

    // Remitente
    $mail->setFrom('password@tacticalopschile.cl', 'Tactical Ops Chile');

    // Destinatario (cambia este correo por el tuyo personal para probar)
    $mail->addAddress('ignaacioantonio@gmail.com', 'Prueba de correo');

    // Contenido del correo
    $mail->isHTML(true);
    $mail->CharSet = 'UTF-8';
    $mail->Subject = 'Prueba de envío PHPMailer desde tacticalopschile.cl';
    $mail->Body    = '<h2>✅ ¡Correo de prueba enviado correctamente!</h2><p>Si ves este mensaje, tu configuración SMTP funciona perfecto.</p>';
    $mail->AltBody = 'Correo de prueba enviado correctamente.';

    // Enviar correo
    $mail->send();

    echo '<h3 style="color:green;">✅ Correo enviado correctamente. Revisa tu bandeja de entrada o spam.</h3>';

} catch (Exception $e) {
    echo '<h3 style="color:red;">❌ Error al enviar correo:</h3>';
    echo '<pre>' . $mail->ErrorInfo . '</pre>';
}
