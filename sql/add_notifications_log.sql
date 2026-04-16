-- ============================================================
-- MIGRACIÓN: Sistema de Notificaciones y Log de Auditoría
-- Base de datos: gestion_operativa
-- Ejecutar sobre la BD existente DESPUÉS de create_requests_table.sql
-- ============================================================

-- 1. Agregar columna de comentario del administrador en solicitudes
--    (si no existe ya)
ALTER TABLE tbl_solicitudes_dotacion
    ADD COLUMN IF NOT EXISTS comentario_admin TEXT NULL AFTER admin_nombre;

-- 2. Tabla de log/auditoría de acciones sobre solicitudes
--    Cada acción (crear, aprobar, rechazar, reincorporar) queda registrada
--    y es visible para TODOS los administradores.
CREATE TABLE IF NOT EXISTS tbl_log_solicitudes (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    solicitud_id  INT NOT NULL,
    accion        ENUM('CREADA','APROBADA','RECHAZADA','REINCORPORADA') NOT NULL,
    actor_nombre  VARCHAR(255) NOT NULL COMMENT 'Nombre del usuario que realizó la acción',
    actor_rol     ENUM('SUPERVISOR','ADMIN') NOT NULL DEFAULT 'ADMIN',
    comentario    TEXT NULL COMMENT 'Comentario obligatorio en aprobación/rechazo/reincorporación',
    timestamp     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitud_id) REFERENCES tbl_solicitudes_dotacion(id) ON DELETE CASCADE,
    INDEX idx_solicitud (solicitud_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de notificaciones persistentes en BD
--    Permite que todos los admins vean las mismas notificaciones
--    y que el supervisor vea el estado de su solicitud.
CREATE TABLE IF NOT EXISTS tbl_notificaciones (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    tipo          ENUM('NUEVA_SOLICITUD','SOLICITUD_APROBADA','SOLICITUD_RECHAZADA','REINCORPORACION') NOT NULL,
    titulo        VARCHAR(255) NOT NULL,
    mensaje       TEXT NOT NULL,
    target_rol    ENUM('ADMIN','SUPERVISOR') NOT NULL COMMENT 'ADMIN = todos los admins, SUPERVISOR = supervisor específico',
    target_nombre VARCHAR(255) NULL COMMENT 'Nombre del supervisor destino (solo cuando target_rol=SUPERVISOR)',
    solicitud_id  INT NULL,
    visto         BOOLEAN DEFAULT FALSE,
    timestamp     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_target (target_rol, target_nombre),
    INDEX idx_visto (visto),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
