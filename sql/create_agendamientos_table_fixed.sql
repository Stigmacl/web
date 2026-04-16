-- ============================================================
-- TABLA: tbl_agendamientos (VERSIÓN CORREGIDA)
-- Descripción: Registro de agendamientos de atención al cliente
-- Estados: RECHAZADO (negativo/pendiente), EJECUTADO (positivo), EJECUTADOCONLLAMADO (positivo)
-- 
-- CAMBIO: Se removió la FK rígida que causaba error de integridad
-- El supervisor se vincula por nombre pero sin restricción obligatoria
-- ============================================================

-- Primero, eliminar la tabla si existe (para actualizar)
DROP TABLE IF EXISTS tbl_agendamientos;

CREATE TABLE tbl_agendamientos (
    id                          INT AUTO_INCREMENT PRIMARY KEY,
    id_agendamiento             VARCHAR(50) UNIQUE NOT NULL COMMENT 'ID único del agendamiento del sistema origen',
    
    -- Información de Fecha y Hora
    fecha_creacion              DATE NOT NULL,
    hora_creacion               TIME,
    fecha_agendamiento          DATE NOT NULL,
    
    -- Información del Cliente
    rut_cliente                 VARCHAR(20) NOT NULL COMMENT 'RUT del cliente (sin DV)',
    dv_cliente                  VARCHAR(1),
    nombre_contacto             VARCHAR(255),
    email                       VARCHAR(255),
    telefono_contacto           VARCHAR(20),
    telefono_movil              VARCHAR(20),
    
    -- Información del Servicio
    servicio                    VARCHAR(255) COMMENT 'Tipo de servicio (DESBLOQUEOS TARJETAS, ELIMINACION DE PAC/PAT, etc)',
    tipo                        VARCHAR(100) COMMENT 'Tipo de transacción',
    desbloqueo_tarjetas         VARCHAR(255),
    reseteo_tarjetas            VARCHAR(255),
    observaciones               TEXT,
    
    -- Estado y Resultado
    estado                      ENUM('RECHAZADO','EJECUTADO','EJECUTADOCONLLAMADO') NOT NULL DEFAULT 'RECHAZADO' COMMENT 'RECHAZADO=pendiente, EJECUTADO/EJECUTADOCONLLAMADO=positivos',
    
    -- Información de Gestión
    id_usuario                  VARCHAR(50),
    supervisor                  VARCHAR(255) COMMENT 'Supervisor responsable (vinculado a tbl_dotacion por nombre)',
    usuario_crea                VARCHAR(255),
    usuario_callback            VARCHAR(255),
    comentario_callback         TEXT,
    fecha_cierre_callback       DATETIME,
    
    -- Detalles de Producto/Servicio
    tipo_pac                    VARCHAR(100),
    tarjeta_credito_pac         VARCHAR(50),
    cuenta_cargo_pac            VARCHAR(50),
    tipo_bloqueo_tc             VARCHAR(100),
    tipo_canal_tc               VARCHAR(100),
    tipo_reseteo_atm            VARCHAR(100),
    modalidad_reseteo_atm       VARCHAR(100),
    numero_tarjeta_bloqueo      VARCHAR(50),
    numero_operacion            VARCHAR(50),
    numero_cuenta               VARCHAR(50),
    
    -- Información de Seguros
    rut_titular_seguro          VARCHAR(20),
    numero_atencion_denuncio    VARCHAR(50),
    tipo_problema_seguro        VARCHAR(255),
    
    -- Documentación
    fecha_envio_documentacion   DATETIME,
    medio_envio_documentacion   VARCHAR(100),
    documentos_enviados         VARCHAR(255),
    
    -- Modificaciones de Denuncio
    modificacion_denuncio_atencion  VARCHAR(50),
    modificacion_denuncio_autentica VARCHAR(100),
    modificacion_denuncio_correo    VARCHAR(255),
    modificacion_denuncio_direccion VARCHAR(255),
    modificacion_denuncio_nombre    VARCHAR(255),
    modificacion_denuncio_rut       VARCHAR(20),
    modificacion_denuncio_seguro    VARCHAR(100),
    modificacion_denuncio_telefono  VARCHAR(20),
    
    -- Auditoría
    timestamp_creacion          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    timestamp_actualizacion     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para búsqueda y cruce con dotación
    INDEX idx_rut_cliente (rut_cliente),
    INDEX idx_supervisor (supervisor),
    INDEX idx_estado (estado),
    INDEX idx_fecha_agendamiento (fecha_agendamiento),
    INDEX idx_id_agendamiento (id_agendamiento)
    
    -- SIN FOREIGN KEY RÍGIDA - Se vincula por nombre pero sin restricción obligatoria
    -- Esto permite insertar agendamientos incluso si el supervisor no existe exactamente en tbl_dotacion
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VISTA: vw_agendamientos_pendientes
-- Retorna solo los agendamientos con estado RECHAZADO (negativos)
-- para que aparezcan en el Index del supervisor como errores
-- ============================================================
CREATE OR REPLACE VIEW vw_agendamientos_pendientes AS
SELECT 
    id,
    id_agendamiento,
    fecha_creacion,
    fecha_agendamiento,
    rut_cliente,
    nombre_contacto,
    servicio,
    tipo,
    observaciones,
    estado,
    supervisor,
    usuario_crea,
    comentario_callback,
    timestamp_creacion
FROM tbl_agendamientos
WHERE estado = 'RECHAZADO'
ORDER BY fecha_agendamiento DESC;

-- ============================================================
-- VISTA: vw_agendamientos_positivos
-- Retorna los agendamientos exitosos (EJECUTADO, EJECUTADOCONLLAMADO)
-- ============================================================
CREATE OR REPLACE VIEW vw_agendamientos_positivos AS
SELECT 
    id,
    id_agendamiento,
    fecha_creacion,
    fecha_agendamiento,
    rut_cliente,
    nombre_contacto,
    servicio,
    tipo,
    estado,
    supervisor,
    usuario_crea,
    timestamp_creacion
FROM tbl_agendamientos
WHERE estado IN ('EJECUTADO', 'EJECUTADOCONLLAMADO')
ORDER BY fecha_agendamiento DESC;
