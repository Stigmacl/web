/*
  # Sistema de Notificaciones

  1. Nueva Tabla
    - `notifications`
      - `id` (uuid, primary key) - Identificador único de notificación
      - `user_id` (text) - ID del usuario que recibe la notificación
      - `type` (text) - Tipo de notificación: 'forum_reply', 'forum_quote', 'post_reply'
      - `reference_id` (text) - ID de referencia (topic_id, post_id, etc.)
      - `reference_type` (text) - Tipo de referencia: 'forum_topic', 'user_post'
      - `from_user_id` (text) - ID del usuario que genera la notificación
      - `from_username` (text) - Nombre del usuario que genera la notificación
      - `title` (text) - Título de la notificación
      - `message` (text) - Mensaje de la notificación
      - `is_read` (boolean) - Indica si la notificación fue leída
      - `created_at` (timestamptz) - Fecha de creación
      - `read_at` (timestamptz) - Fecha de lectura

  2. Security
    - Enable RLS on `notifications` table
    - Add policy for users to read their own notifications
    - Add policy for authenticated users to mark notifications as read
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('forum_reply', 'forum_quote', 'post_reply')),
  reference_id text NOT NULL,
  reference_type text NOT NULL CHECK (reference_type IN ('forum_topic', 'user_post')),
  from_user_id text NOT NULL,
  from_username text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);