-- Agregar columna player_name a la tabla users para vincular con el ranking
ALTER TABLE users ADD COLUMN IF NOT EXISTS player_name VARCHAR(255) DEFAULT NULL;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_player_name ON users(player_name);
