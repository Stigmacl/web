<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../PHPMailer/src/Exception.php';
require_once __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../PHPMailer/src/SMTP.php';

function sendEmail($toEmail, $toName, $subject, $htmlBody, $textBody = '') {
    $mail = new PHPMailer(true);

    try {
        // Configuración SMTP de cPanel
        $mail->isSMTP();
        $mail->Host       = 'mail.tacticalopschile.cl';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'password@tacticalopschile.cl';
        $mail->Password   = 'tacticalopschile1';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->Timeout    = 30;

        // Opciones adicionales para mejor compatibilidad
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );

        // Configuración del remitente
        $mail->setFrom('password@tacticalopschile.cl', 'Tactical Ops Chile');
        $mail->addAddress($toEmail, $toName);

        // Configuración del correo
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = $textBody ?: strip_tags($htmlBody);

        // Enviar correo
        $mail->send();
        error_log("[MAILER] Correo enviado exitosamente a: $toEmail");
        return true;
    } catch (Exception $e) {
        error_log("[MAILER] Error al enviar email a $toEmail: {$mail->ErrorInfo}");
        error_log("[MAILER] Excepción completa: " . $e->getMessage());
        return false;
    }
}

/**
 * Función alternativa para enviar emails con puerto SSL (465)
 * Úsala si el puerto 587 no funciona en tu servidor
 */
function sendEmailSSL($toEmail, $toName, $subject, $htmlBody, $textBody = '') {
    $mail = new PHPMailer(true);

    try {
        // Configuración SMTP de cPanel con SSL
        $mail->isSMTP();
        $mail->Host       = 'mail.tacticalopschile.cl';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'password@tacticalopschile.cl';
        $mail->Password   = 'tacticalopschile1';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;  // SSL en lugar de STARTTLS
        $mail->Port       = 465;  // Puerto SSL
        $mail->Timeout    = 30;

        // Opciones adicionales
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );

        // Configuración del remitente
        $mail->setFrom('password@tacticalopschile.cl', 'Tactical Ops Chile');
        $mail->addAddress($toEmail, $toName);

        // Configuración del correo
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = $textBody ?: strip_tags($htmlBody);

        // Enviar correo
        $mail->send();
        error_log("[MAILER-SSL] Correo enviado exitosamente a: $toEmail");
        return true;
    } catch (Exception $e) {
        error_log("[MAILER-SSL] Error al enviar email a $toEmail: {$mail->ErrorInfo}");
        error_log("[MAILER-SSL] Excepción completa: " . $e->getMessage());
        return false;
    }
}
