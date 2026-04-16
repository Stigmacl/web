CREATE TABLE IF NOT EXISTS tbl_solicitudes_dotacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut VARCHAR(20) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    supervisor VARCHAR(255) NOT NULL,
    fecha_egreso DATE NOT NULL,
    categoria_propuesta VARCHAR(100) NOT NULL,
    motivo TEXT NOT NULL,
    status ENUM('PENDIENTE', 'APROBADA', 'RECHAZADA', 'REINCORPORADA') DEFAULT 'PENDIENTE',
    categoria_final VARCHAR(100),
    admin_nombre VARCHAR(255),
    motivo_reincorporacion TEXT,
    reincorporador_nombre VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    visto_admin BOOLEAN DEFAULT FALSE,
    visto_supervisor BOOLEAN DEFAULT FALSE
);
