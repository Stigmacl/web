-- ============================================================
-- Migración: Ampliar estado_dotacion de ENUM a VARCHAR(50)
-- Para soportar los estados de todas las hojas del Excel:
--   FUSION           → 'Activo'
--   FUERA FALTA GRAVE→ 'Fuera Falta Grave'
--   RENUNCIAS        → 'Renuncia/Termino'
--   APOYOS-LICENCIAS → 'Apoyo/Licencia'
-- ============================================================
USE gestion_operativa;

-- Cambiar la columna de ENUM a VARCHAR(50) manteniendo el valor por defecto
ALTER TABLE tbl_dotacion 
    MODIFY COLUMN estado_dotacion VARCHAR(50) NOT NULL DEFAULT 'Activo';

-- Agregar índice para consultas por estado (si no existe)
ALTER TABLE tbl_dotacion 
    ADD INDEX IF NOT EXISTS idx_estado (estado_dotacion);

-- Verificar resultado
DESCRIBE tbl_dotacion;
