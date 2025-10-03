<?php
/**
 * Script para crear la tabla de notificaciones
 * Ejecutar este archivo una sola vez desde el navegador
 */

require_once 'api/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "<h2>Creando tabla de notificaciones...</h2>";

    $sql = "CREATE TABLE IF NOT EXISTS `notifications` (
      `id` VARCHAR(36) PRIMARY KEY,
      `user_id` VARCHAR(255) NOT NULL,
      `type` ENUM('forum_reply', 'forum_quote', 'post_reply') NOT NULL,
      `reference_id` VARCHAR(255) NOT NULL,
      `reference_type` ENUM('forum_topic', 'user_post') NOT NULL,
      `from_user_id` VARCHAR(255) NOT NULL,
      `from_username` VARCHAR(255) NOT NULL,
      `title` TEXT NOT NULL,
      `message` TEXT NOT NULL,
      `is_read` TINYINT(1) DEFAULT 0,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      `read_at` TIMESTAMP NULL DEFAULT NULL,
      INDEX `idx_user_id` (`user_id`),
      INDEX `idx_created_at` (`created_at` DESC),
      INDEX `idx_is_read` (`is_read`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $db->exec($sql);

    echo "<p style='color: green; font-weight: bold;'>✓ Tabla 'notifications' creada exitosamente!</p>";

    // Verificar que la tabla existe
    $checkTable = $db->query("SHOW TABLES LIKE 'notifications'")->rowCount();

    if ($checkTable > 0) {
        echo "<p style='color: green;'>✓ Verificación: La tabla existe en la base de datos</p>";

        // Mostrar estructura de la tabla
        echo "<h3>Estructura de la tabla:</h3>";
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
        echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th></tr>";

        $columns = $db->query("DESCRIBE notifications");
        while ($column = $columns->fetch()) {
            echo "<tr>";
            echo "<td>{$column['Field']}</td>";
            echo "<td>{$column['Type']}</td>";
            echo "<td>{$column['Null']}</td>";
            echo "<td>{$column['Key']}</td>";
            echo "<td>{$column['Default']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color: red;'>✗ Error: La tabla no se pudo crear</p>";
    }

    echo "<hr>";
    echo "<p><strong>¡Listo!</strong> Ahora puedes usar el sistema de notificaciones.</p>";
    echo "<p><small>Puedes eliminar este archivo (create-notifications-table.php) después de ejecutarlo.</small></p>";

} catch (Exception $e) {
    echo "<p style='color: red; font-weight: bold;'>Error: " . $e->getMessage() . "</p>";
    echo "<p>Detalles técnicos: " . $e->getTraceAsString() . "</p>";
}
?>
