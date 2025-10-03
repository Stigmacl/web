-- Tabla de Notificaciones para MySQL
-- Ejecutar este script en PHPMyAdmin

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
