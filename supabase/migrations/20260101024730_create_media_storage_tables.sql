/*
  # Create Media Storage Tables

  1. New Tables
    - `media_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `media_type` (text: 'photo' or 'video')
      - `file_path` (text, path in Supabase storage)
      - `file_size` (bigint)
      - `duration` (integer, seconds, null for photos)
      - `thumbnail_path` (text, optional thumbnail path)
      - `created_at` (timestamp)
    - `capture_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `filter_name` (text: 'none', 'blur', 'brightness', 'contrast')
      - `filter_value` (numeric)
      - `face_detection_enabled` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Only authenticated users can manage their own media
    - Public users can read public shared media (for future extension)
*/

CREATE TABLE IF NOT EXISTS media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video')),
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  duration integer,
  thumbnail_path text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS capture_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filter_name text NOT NULL DEFAULT 'none',
  filter_value numeric DEFAULT 0,
  face_detection_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own media"
  ON media_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media"
  ON media_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media"
  ON media_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their capture settings"
  ON capture_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert capture settings"
  ON capture_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update capture settings"
  ON capture_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);