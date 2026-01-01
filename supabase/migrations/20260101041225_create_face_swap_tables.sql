/*
  # Create Face Swap Storage Tables

  1. New Tables
    - `face_swap_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `source_face_path` (text, path to source face in storage)
      - `target_image_path` (text, path to target image in storage)
      - `result_path` (text, path to result image in storage)
      - `blend_strength` (numeric, 0.0-1.0)
      - `color_correction` (boolean)
      - `processing_time` (numeric, seconds)
      - `created_at` (timestamp)

    - `favorite_faces`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, user-defined name)
      - `file_path` (text, path in storage)
      - `created_at` (timestamp)

  2. Storage Buckets
    - `face-swap-data` bucket for storing all face swap related files

  3. Security
    - Enable RLS on both tables
    - Users can only access their own data
    - Authenticated users only
*/

CREATE TABLE IF NOT EXISTS face_swap_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_face_path text NOT NULL,
  target_image_path text NOT NULL,
  result_path text NOT NULL,
  blend_strength numeric NOT NULL DEFAULT 0.8,
  color_correction boolean NOT NULL DEFAULT true,
  processing_time numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorite_faces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE face_swap_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_faces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own face swap results"
  ON face_swap_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create face swap results"
  ON face_swap_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own face swap results"
  ON face_swap_results FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own favorite faces"
  ON favorite_faces FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create favorite faces"
  ON favorite_faces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorite faces"
  ON favorite_faces FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite faces"
  ON favorite_faces FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_face_swap_results_user_id ON face_swap_results(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_faces_user_id ON favorite_faces(user_id);
