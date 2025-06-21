<?php
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que las tablas existen, si no, crearlas
    $checkConfigTable = "SHOW TABLES LIKE 'banner_config'";
    $configTableExists = $db->query($checkConfigTable);
    
    if ($configTableExists->rowCount() == 0) {
        // Crear tabla de configuración del banner
        $createConfigTable = "
        CREATE TABLE `banner_config` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $db->exec($createConfigTable);
        
        // Insertar configuración inicial
        $insertConfig = "INSERT INTO `banner_config` (`is_enabled`) VALUES (1)";
        $db->exec($insertConfig);
    }

    $checkItemsTable = "SHOW TABLES LIKE 'banner_items'";
    $itemsTableExists = $db->query($checkItemsTable);
    
    if ($itemsTableExists->rowCount() == 0) {
        // Crear tabla de elementos del banner
        $createItemsTable = "
        CREATE TABLE `banner_items` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `banner_id` varchar(50) NOT NULL,
          `type` enum('image','video') NOT NULL,
          `url` text NOT NULL,
          `link` text DEFAULT NULL,
          `title` varchar(255) DEFAULT NULL,
          `description` text DEFAULT NULL,
          `autoplay` tinyint(1) DEFAULT 1,
          `muted` tinyint(1) DEFAULT 1,
          `duration` int(11) DEFAULT 5,
          `object_fit` enum('cover','contain','fill','scale-down','none') DEFAULT 'cover',
          `object_position` varchar(50) DEFAULT 'center center',
          `scale_percent` int(11) DEFAULT 100,
          `brightness` int(11) DEFAULT 100,
          `contrast` int(11) DEFAULT 100,
          `blur` int(11) DEFAULT 0,
          `sort_order` int(11) DEFAULT 0,
          `is_active` tinyint(1) NOT NULL DEFAULT 1,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`),
          KEY `idx_banner_id` (`banner_id`),
          KEY `idx_sort_order` (`sort_order`),
          KEY `idx_is_active` (`is_active`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $db->exec($createItemsTable);
        
        // Insertar elementos por defecto
        $insertItems = "
        INSERT INTO `banner_items` (
          `banner_id`, `type`, `url`, `title`, `description`, `duration`, 
          `object_fit`, `object_position`, `scale_percent`, `brightness`, `contrast`, `blur`, `sort_order`
        ) VALUES 
        (
          '1', 'image', 
          'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop',
          '¡Bienvenido a Tactical Ops 3.5 Chile!',
          'La comunidad más activa de Tactical Ops en Chile',
          6, 'cover', 'center center', 100, 100, 100, 0, 1
        ),
        (
          '2', 'image',
          'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop',
          'Únete a la Batalla',
          'Servidores activos 24/7 con la mejor experiencia de juego',
          5, 'cover', 'center center', 100, 100, 100, 0, 2
        ),
        (
          '3', 'image',
          'https://images.pexels.com/photos/1293269/pexels-photo-1293269.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop',
          'Comunidad Activa',
          'Más de 1000 jugadores registrados y creciendo',
          7, 'cover', 'center center', 100, 100, 100, 0, 3
        )";
        
        $db->exec($insertItems);
    }

    // Obtener configuración del banner
    $configQuery = "SELECT is_enabled FROM banner_config ORDER BY id DESC LIMIT 1";
    $configStmt = $db->prepare($configQuery);
    $configStmt->execute();
    $config = $configStmt->fetch();
    
    $isEnabled = $config ? (bool)$config['is_enabled'] : true;

    // Obtener elementos del banner
    $itemsQuery = "SELECT * FROM banner_items WHERE is_active = 1 ORDER BY sort_order ASC";
    $itemsStmt = $db->prepare($itemsQuery);
    $itemsStmt->execute();

    $items = [];
    while ($row = $itemsStmt->fetch()) {
        $items[] = [
            'id' => $row['banner_id'],
            'type' => $row['type'],
            'url' => $row['url'],
            'link' => $row['link'],
            'title' => $row['title'],
            'description' => $row['description'],
            'autoplay' => (bool)$row['autoplay'],
            'muted' => (bool)$row['muted'],
            'duration' => (int)$row['duration'],
            'imageSettings' => [
                'objectFit' => $row['object_fit'],
                'objectPosition' => $row['object_position'],
                'scale' => (int)$row['scale_percent'],
                'brightness' => (int)$row['brightness'],
                'contrast' => (int)$row['contrast'],
                'blur' => (int)$row['blur']
            ]
        ];
    }

    jsonResponse([
        'success' => true,
        'isEnabled' => $isEnabled,
        'items' => $items
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], 500);
}
?>