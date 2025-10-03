<?php
/**
 * Configuración de Base de Datos para Tactical Ops 3.5 Chile
 * Configurado para XAMPP con MySQL
 */

// Deshabilitar la visualización de errores para evitar HTML en respuestas JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Configuración de sesión para evitar que se pierda con F5
ini_set('session.cookie_lifetime', 86400); // 24 horas
ini_set('session.gc_maxlifetime', 86400); // 24 horas
ini_set('session.cookie_httponly', 1); // Solo HTTP
ini_set('session.cookie_samesite', 'Lax'); // Protección CSRF
ini_set('session.use_strict_mode', 1); // Seguridad adicional

class Database {
    private $host = 'localhost';
    private $db_name = 'tactica2_tactical_ops_chile';
    private $username = 'tactica2_root';
    private $password = 'Trini3915..';
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }

        return $this->conn;
    }

    public function closeConnection() {
        $this->conn = null;
    }
}

// Configuración de CORS para desarrollo
header('Access-Control-Allow-Origin: http://localhost');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de respuesta JSON
header('Content-Type: application/json; charset=utf-8');

// Función helper para respuestas JSON
function jsonResponse($data, $status = 200) {
    // Limpiar cualquier output buffer que pueda contener errores HTML
    if (ob_get_level()) {
        ob_clean();
    }
    
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

// Función helper para errores
function errorResponse($message, $status = 400) {
    jsonResponse(['error' => $message], $status);
}

// Función helper para validar entrada JSON
function getJsonInput() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        errorResponse('JSON inválido', 400);
    }
    
    return $data;
}

// Función para manejar errores fatales
function handleFatalError() {
    $error = error_get_last();
    if ($error !== NULL && $error['type'] === E_ERROR) {
        // Limpiar cualquier output
        if (ob_get_level()) {
            ob_clean();
        }
        
        // Enviar respuesta JSON de error
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error interno del servidor'
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Registrar el manejador de errores fatales
register_shutdown_function('handleFatalError');
?>