<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../../vendor/autoload.php';

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
        return true;
    } catch (Exception $e) {
        error_log("Error al enviar email: {$mail->ErrorInfo}");
        return false;
    }
}
