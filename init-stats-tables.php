<?php
require_once 'api/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "Creando tablas player_stats y player_titles...\n\n";

try {
    $db->exec("CREATE TABLE IF NOT EXISTS player_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE NOT NULL,
        best_streak INT DEFAULT 0,
        total_kills INT DEFAULT 0,
        total_deaths INT DEFAULT 0,
        is_champion BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    echo "✓ Tabla player_stats creada exitosamente\n";

    $db->exec("CREATE TABLE IF NOT EXISTS player_titles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        tournament_name VARCHAR(255) NOT NULL,
        awarded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    echo "✓ Tabla player_titles creada exitosamente\n\n";
    echo "Las tablas se crearon correctamente en la base de datos MySQL.\n";
} catch (Exception $e) {
    echo "✗ Error al crear tablas: " . $e->getMessage() . "\n";
    exit(1);
}
?>
