-- --------------------------------------------------------
-- Base de Datos Corporativa: Gestión Operativa de Errores
-- Destino: XAMPP MySQL -> (Futuro: Azure SQL)
-- --------------------------------------------------------

CREATE DATABASE IF NOT EXISTS gestion_operativa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_operativa;

-- --------------------------------------------------------
-- 1. TABLA MADRE: Dotación de Ejecutivos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_dotacion (
    id_ejecutivo INT AUTO_INCREMENT PRIMARY KEY,
    rut VARCHAR(20) NOT NULL UNIQUE,
    nombre_completo VARCHAR(255) NOT NULL,
    usuario_login VARCHAR(100),
    supervisor_asignado VARCHAR(255),
    estado_dotacion VARCHAR(50) DEFAULT 'Activo',
    /* Valores posibles: 'Activo', 'Fuera Falta Grave', 'Renuncia/Termino', 'Apoyo/Licencia', 'Inactivo' */
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rut (rut),
    INDEX idx_usuario (usuario_login),
    INDEX idx_supervisor (supervisor_asignado),
    INDEX idx_estado (estado_dotacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. TABLA INGESTA: Repositorio en crudo de todos los Excel
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_errores_ingesta (
    id_reporte VARCHAR(255) PRIMARY KEY, /* Generado en frontend (ej: man-927230461-171295) */
    categoria VARCHAR(100) NOT NULL,     /* 'Agendamientos', 'Ley Fraude', 'ONP', 'Desbloqueos APP' */
    fecha_origen DATETIME NOT NULL,
    n_ot VARCHAR(100),
    rut_cliente VARCHAR(20),
    nombre_ejecutivo VARCHAR(255),
    rut_ejecutivo VARCHAR(20),           /* Crítico para el cruce de Desbloqueo APP */
    nombre_supervisor VARCHAR(255),
    estado_origen VARCHAR(100),          /* Para diferenciar RECHAZADO en Agendamientos */
    observacion_cruda TEXT, 
    tipificacion TEXT,
    campos_especificos JSON,             /* Data extra de los exceles que varía por origen */
    fecha_importacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fecha (fecha_origen),
    INDEX idx_rut_ej (rut_ejecutivo),
    INDEX idx_nom_ej (nombre_ejecutivo),
    INDEX idx_categoria (categoria),
    INDEX idx_estado_org (estado_origen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------
-- 3. TABLA OPERATIVA: Acciones humanas de la interfaz
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_gestiones_operativas (
    id_gestion INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_reporte VARCHAR(255) NOT NULL,
    autor_gestion VARCHAR(255) NOT NULL,
    estado_operativo VARCHAR(100) NOT NULL DEFAULT 'pendiente', /* 'pendiente', 'realizado', 'resuelto' */
    nota_auditoria TEXT,
    fecha_gestion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_gestion_reporte (fk_id_reporte), /* Garantiza estado 1:1, evita duplicidad de gestiones del mismo error */
    FOREIGN KEY (fk_id_reporte) REFERENCES tbl_errores_ingesta(id_reporte) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. USUARIOS (Administradores/Supervisores - Base para Autenticación)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_usuarios_dashboard (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_login VARCHAR(255) NOT NULL UNIQUE,
    rol ENUM('ADMIN', 'JEFATURA', 'SUPERVISOR') NOT NULL,
    clave_acceso VARCHAR(255) NOT NULL,
    estado ENUM('Vigente', 'Suspendido') DEFAULT 'Vigente',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
