import { supabase } from './supabase';

export interface SwapResult {
  id: string;
  user_id: string;
  source_face_path: string;
  target_image_path: string;
  result_path: string;
  blend_strength: number;
  color_correction: boolean;
  processing_time: number;
  created_at: string;
}

export const uploadFaceSwapResult = async (
  userId: string,
  sourceFile: Blob,
  targetFile: Blob,
  resultFile: Blob,
  blendStrength: number,
  colorCorrection: boolean,
  processingTime: number
) => {
  const timestamp = Date.now();

  const sourcePath = `${userId}/sources/${timestamp}-source.png`;
  const targetPath = `${userId}/targets/${timestamp}-target.png`;
  const resultPath = `${userId}/results/${timestamp}-result.png`;

  const { error: sourceError } = await supabase.storage
    .from('face-swap-data')
    .upload(sourcePath, sourceFile);

  if (sourceError) throw sourceError;

  const { error: targetError } = await supabase.storage
    .from('face-swap-data')
    .upload(targetPath, targetFile);

  if (targetError) throw targetError;

  const { error: resultError } = await supabase.storage
    .from('face-swap-data')
    .upload(resultPath, resultFile);

  if (resultError) throw resultError;

  const { data, error } = await supabase
    .from('face_swap_results')
    .insert({
      user_id: userId,
      source_face_path: sourcePath,
      target_image_path: targetPath,
      result_path: resultPath,
      blend_strength: blendStrength,
      color_correction: colorCorrection,
      processing_time: processingTime,
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const getFaceSwapResults = async (userId: string): Promise<SwapResult[]> => {
  const { data, error } = await supabase
    .from('face_swap_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const deleteFaceSwapResult = async (resultId: string) => {
  const { data: result, error: fetchError } = await supabase
    .from('face_swap_results')
    .select('source_face_path, target_image_path, result_path')
    .eq('id', resultId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!result) throw new Error('Result not found');

  await supabase.storage.from('face-swap-data').remove([
    result.source_face_path,
    result.target_image_path,
    result.result_path,
  ]);

  const { error: deleteError } = await supabase
    .from('face_swap_results')
    .delete()
    .eq('id', resultId);

  if (deleteError) throw deleteError;
};

export const getResultUrl = (path: string) => {
  return supabase.storage.from('face-swap-data').getPublicUrl(path).data.publicUrl;
};

export const saveFavoriteSourceFace = async (
  userId: string,
  file: Blob,
  name: string
) => {
  const timestamp = Date.now();
  const filePath = `${userId}/favorites/${timestamp}-${name}.png`;

  const { error: uploadError } = await supabase.storage
    .from('face-swap-data')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('favorite_faces')
    .insert({
      user_id: userId,
      name: name,
      file_path: filePath,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getFavoriteFaces = async (userId: string) => {
  const { data, error } = await supabase
    .from('favorite_faces')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const deleteFavoriteFace = async (faceId: string) => {
  const { data: face, error: fetchError } = await supabase
    .from('favorite_faces')
    .select('file_path')
    .eq('id', faceId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!face) throw new Error('Face not found');

  await supabase.storage.from('face-swap-data').remove([face.file_path]);

  const { error: deleteError } = await supabase
    .from('favorite_faces')
    .delete()
    .eq('id', faceId);

  if (deleteError) throw deleteError;
};
