-- Tabla para gestionar desbloqueos de APP
-- Estructura basada en el Excel BloqueoAPP-copia.xlsx

CREATE TABLE IF NOT EXISTS tbl_desbloqueoapp (
    id_desbloqueo INT AUTO_INCREMENT PRIMARY KEY,
    rut_cliente VARCHAR(20) NOT NULL,
    nombre_cliente VARCHAR(255),
    tipo VARCHAR(100),
    motivo VARCHAR(255),
    
    -- EAT (Ejecutivo de Atención Técnica) - Filtro clave para asignar al supervisor
    eat_rut VARCHAR(20) NOT NULL,
    eat_username VARCHAR(100),
    fecha_registro_eat DATETIME,
    
    -- Estados de bloqueo
    bloqueo_app VARCHAR(10),
    bloqueo_rutpay VARCHAR(10),
    autenticado VARCHAR(10),
    tipo_autenticado VARCHAR(255),
    multicanalidad VARCHAR(255),
    
    -- Información de origen
    comentario_origen TEXT,
    
    -- Información de revisión/callback
    revision_callback VARCHAR(100),
    fecha_revision_callback DATETIME,
    usuario_callback VARCHAR(100),
    comentario_callback TEXT,
    
    -- Campos de control para integración con el sistema de errores
    estado_desbloqueo VARCHAR(50) DEFAULT 'RECHAZADO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para búsqueda y filtrado
    INDEX idx_eat_rut (eat_rut),
    INDEX idx_rut_cliente (rut_cliente),
    INDEX idx_estado (estado_desbloqueo),
    INDEX idx_fecha_registro (fecha_registro_eat),
    UNIQUE KEY unique_desbloqueo (rut_cliente, eat_rut, fecha_registro_eat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
