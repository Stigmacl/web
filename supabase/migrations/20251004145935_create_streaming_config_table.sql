/*
  # Create streaming_config table

  1. New Tables
    - `streaming_config`
      - `id` (integer, primary key) - Always 1 (singleton table)
      - `stream_url` (text) - URL of the live stream (Twitch, YouTube, Kick)
      - `is_active` (boolean) - Whether the stream is currently live
      - `descriptive_text` (text) - Custom message when stream is not active
      - `updated_at` (timestamptz) - Last update timestamp
      - `updated_by` (integer) - User ID who made the last update

  2. Security
    - Enable RLS on `streaming_config` table
    - Add policy for anyone to read the configuration (public data)
    - Add policy for authenticated admins to update the configuration

  3. Notes
    - This is a singleton table (only one row with id=1)
    - descriptive_text allows customizing the offline message
*/

-- Create streaming_config table
CREATE TABLE IF NOT EXISTS streaming_config (
  id integer PRIMARY KEY DEFAULT 1,
  stream_url text DEFAULT '',
  is_active boolean DEFAULT false,
  descriptive_text text DEFAULT 'Vuelve pronto para ver contenido en vivo',
  updated_at timestamptz DEFAULT now(),
  updated_by integer,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE streaming_config ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read streaming config (public data)
CREATE POLICY "Anyone can read streaming config"
  ON streaming_config
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can update streaming config
CREATE POLICY "Authenticated users can update streaming config"
  ON streaming_config
  FOR UPDATE
  TO authenticated
  USING (id = 1)
  WITH CHECK (id = 1);

-- Policy: Only authenticated users can insert streaming config
CREATE POLICY "Authenticated users can insert streaming config"
  ON streaming_config
  FOR INSERT
  TO authenticated
  WITH CHECK (id = 1);

-- Insert default configuration row
INSERT INTO streaming_config (id, stream_url, is_active, descriptive_text, updated_at)
VALUES (1, '', false, 'Vuelve pronto para ver contenido en vivo', now())
ON CONFLICT (id) DO NOTHING;