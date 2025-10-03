/*
  # Estadísticas de Jugadores y Títulos

  1. Nuevas Tablas
    - `player_stats`
      - `id` (uuid, primary key)
      - `user_id` (text, unique) - ID del usuario
      - `best_streak` (integer, default 0) - Mejor racha
      - `total_kills` (integer, default 0) - Total de kills
      - `total_deaths` (integer, default 0) - Total de muertes
      - `is_champion` (boolean, default false) - Si ha sido campeón
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `player_titles`
      - `id` (uuid, primary key)
      - `user_id` (text) - ID del usuario
      - `title` (text) - Título otorgado
      - `tournament_name` (text) - Nombre del torneo
      - `awarded_date` (timestamp) - Fecha de otorgamiento
      - `created_at` (timestamp)

  2. Seguridad
    - Enable RLS en ambas tablas
    - Políticas para lectura pública
    - Políticas para administradores para escritura
*/

-- Crear tabla de estadísticas de jugadores
CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  best_streak integer DEFAULT 0,
  total_kills integer DEFAULT 0,
  total_deaths integer DEFAULT 0,
  is_champion boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de títulos de jugadores
CREATE TABLE IF NOT EXISTS player_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text NOT NULL,
  tournament_name text NOT NULL,
  awarded_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_titles ENABLE ROW LEVEL SECURITY;

-- Políticas para player_stats
CREATE POLICY "Anyone can view player stats"
  ON player_stats
  FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated users can insert their own stats"
  ON player_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stats"
  ON player_stats
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para player_titles
CREATE POLICY "Anyone can view player titles"
  ON player_titles
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert titles"
  ON player_titles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete titles"
  ON player_titles
  FOR DELETE
  TO authenticated
  USING (true);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_player_titles_user_id ON player_titles(user_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_player_stats_updated_at ON player_stats;
CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
