# Instalación de PHPMailer

Para habilitar el envío de correos electrónicos de recuperación de contraseña, necesitas instalar PHPMailer usando Composer.

## Requisitos

- PHP 7.4 o superior
- Composer instalado en tu servidor

## Instalación

1. Abre una terminal en el directorio raíz del proyecto
2. Ejecuta el siguiente comando:

```bash
composer install
```

Este comando instalará PHPMailer y todas las dependencias necesarias en la carpeta `vendor/`.

## Verificación

Después de ejecutar el comando, deberías ver una carpeta `vendor/` en el directorio raíz del proyecto con las dependencias de PHPMailer instaladas.

## Configuración SMTP

La configuración SMTP ya está incluida en el archivo `api/config/mailer.php` con los siguientes parámetros:

- Host: mail.tacticalopschile.cl
- Usuario: password@tacticalopschile.cl
- Contraseña: tacticalopschile1
- Puerto: 587 (STARTTLS)

## Nota de Seguridad

Es importante que mantengas las credenciales SMTP seguras y no las compartas públicamente.
