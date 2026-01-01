/*
  # Create Performance Settings Table

  1. New Tables
    - `performance_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `device_type` (text: 'apple_silicon', 'nvidia_gpu', 'amd_gpu', 'cpu')
      - `optimization_mode` (text: 'balanced', 'performance', 'quality', 'battery')
      - `use_gpu_acceleration` (boolean)
      - `max_resolution` (integer, max processing resolution)
      - `thread_count` (integer, for CPU processing)
      - `memory_limit_mb` (integer, optional memory limit)
      - `enable_metal` (boolean, for Apple Silicon MPS)
      - `enable_tensorrt` (boolean, for NVIDIA TensorRT)
      - `batch_size` (integer, processing batch size)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on table
    - Users can only manage their own settings
    - Authenticated users only

  3. Notes
    - Settings are detected automatically but user can override
    - Optimizations applied both in backend and frontend processing
    - Default values based on detected hardware
*/

CREATE TABLE IF NOT EXISTS performance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type text NOT NULL DEFAULT 'cpu',
  optimization_mode text NOT NULL DEFAULT 'balanced',
  use_gpu_acceleration boolean NOT NULL DEFAULT false,
  max_resolution integer NOT NULL DEFAULT 1920,
  thread_count integer NOT NULL DEFAULT 4,
  memory_limit_mb integer,
  enable_metal boolean NOT NULL DEFAULT false,
  enable_tensorrt boolean NOT NULL DEFAULT false,
  batch_size integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE performance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own performance settings"
  ON performance_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert performance settings"
  ON performance_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance settings"
  ON performance_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own performance settings"
  ON performance_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_performance_settings_user_id ON performance_settings(user_id);

CREATE OR REPLACE FUNCTION update_performance_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_performance_settings_updated_at
  BEFORE UPDATE ON performance_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_performance_settings_updated_at();
