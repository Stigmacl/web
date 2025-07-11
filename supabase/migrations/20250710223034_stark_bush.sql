-- SQL para agregar la columna 'draws' a la tabla tournament_participants
-- Ejecutar en phpMyAdmin en la base de datos tactical_ops_chile

-- Verificar si la columna ya existe antes de agregarla
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'tactical_ops_chile' 
    AND TABLE_NAME = 'tournament_participants' 
    AND COLUMN_NAME = 'draws'
);

-- Solo agregar la columna si no existe
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE tournament_participants ADD COLUMN draws int(11) DEFAULT 0 AFTER losses;',
    'SELECT "La columna draws ya existe" as mensaje;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar que la columna se agregó correctamente
DESCRIBE tournament_participants;