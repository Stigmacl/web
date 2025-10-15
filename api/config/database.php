<?php
/**
 * Configuración de Base de Datos para Tactical Ops 3.5 Chile
 * Configurado para XAMPP con MySQL
 */

// Deshabilitar la visualización de errores para evitar HTML en respuestas JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Configuración de sesión - 20 minutos con extensión automática
ini_set('session.cookie_lifetime', 1200); // 20 minutos (1200 segundos)
ini_set('session.gc_maxlifetime', 1200); // 20 minutos (1200 segundos)
ini_set('session.cookie_httponly', 1); // Solo HTTP
ini_set('session.cookie_samesite', 'Lax'); // Protección CSRF
ini_set('session.use_strict_mode', 1); // Seguridad adicional
ini_set('session.gc_probability', 1); // Activar limpieza de sesiones
ini_set('session.gc_divisor', 100); // Probabilidad 1%

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

// Configuración de CORS - permitir origen actual
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header('Access-Control-Allow-Origin: ' . $origin);
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

// Deshabilitar caché para todas las respuestas de API
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Expires: 0');

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

// Función helper para iniciar sesión de forma segura y persistente
function startSecureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        // Configurar parámetros de cookie antes de iniciar sesión - 20 minutos
        $sessionLifetime = 1200; // 20 minutos (1200 segundos)
        // Detectar si estamos en HTTPS
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
                   || $_SERVER['SERVER_PORT'] == 443
                   || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

        session_set_cookie_params([
            'lifetime' => $sessionLifetime,
            'path' => '/',
            'domain' => '',
            'secure' => $isHttps, // Automático según el entorno
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        session_start();

        // Extender la sesión en cada petición
        if (isset($_SESSION['last_activity'])) {
            $now = time();
            $inactiveTime = $now - $_SESSION['last_activity'];

            // Si han pasado más de 20 minutos sin actividad, destruir sesión
            if ($inactiveTime > 1200) {
                session_unset();
                session_destroy();
                return false;
            }

            // Actualizar última actividad y extender cookie
            $_SESSION['last_activity'] = $now;

            // IMPORTANTE: Renovar la cookie de sesión en cada petición para evitar expiración
            // Esto soluciona el problema de F5 en desktop
            setcookie(
                session_name(),
                session_id(),
                [
                    'expires' => time() + $sessionLifetime,
                    'path' => '/',
                    'domain' => '',
                    'secure' => $isHttps,
                    'httponly' => true,
                    'samesite' => 'Lax'
                ]
            );
        } else {
            // Primera vez, establecer última actividad
            $_SESSION['last_activity'] = time();
        }
    } else {
        // Si la sesión ya está iniciada, aún así extender la cookie
        if (isset($_SESSION['last_activity'])) {
            $now = time();
            $inactiveTime = $now - $_SESSION['last_activity'];

            if ($inactiveTime > 1200) {
                session_unset();
                session_destroy();
                return false;
            }

            $_SESSION['last_activity'] = $now;

            $sessionLifetime = 1200;
            $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
                       || $_SERVER['SERVER_PORT'] == 443
                       || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

            setcookie(
                session_name(),
                session_id(),
                [
                    'expires' => time() + $sessionLifetime,
                    'path' => '/',
                    'domain' => '',
                    'secure' => $isHttps,
                    'httponly' => true,
                    'samesite' => 'Lax'
                ]
            );
        }
    }

    return true;
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