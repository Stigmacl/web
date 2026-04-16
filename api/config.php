<?php
// api/config.php
// Configuración centralizada de XAMPP para el Backend API

// Forzar visualización de errores solo en entornos de desarrollo local
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Configuración de la zona horaria de Chile
date_default_timezone_set('America/Santiago');

// Parámetros nativos de XAMPP MySQL
define('DB_HOST', '127.0.0.1');
define('DB_USER', 'root');
define('DB_PASS', ''); // Por defecto XAMPP no tiene contraseña en root
define('DB_NAME', 'gestion_operativa');

class Database {
    private static $conexion = null;

    public static function conectar() {
        if (self::$conexion == null) {
            try {
                // PDO asegurando que trabaje perfectamente con utf8mb4 (emojis, tildes, caracteres especiales)
                self::$conexion = new PDO(
                    "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                    DB_USER,
                    DB_PASS,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Directo a array asociativo listo para JSON
                        PDO::ATTR_EMULATE_PREPARES => false // Mejor seguridad vs inyecciones y tipos de datos precisos
                    ]
                );
            } catch(PDOException $e) {
                // Si la BD se cae, el Frontend de JS recibirá este JSON para poder arrojar su alerta gráfica
                http_response_code(500);
                echo json_encode([
                    "status" => "error", 
                    "message" => "Ocurrió un problema conectándose al servidor de bases de datos.", 
                    "sys_err" => $e->getMessage()
                ]);
                exit; // Cortafuegos
            }
        }
        return self::$conexion;
    }
}
?>
