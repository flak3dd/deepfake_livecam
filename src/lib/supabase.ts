import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadMedia = async (
  userId: string,
  file: Blob,
  fileName: string,
  mediaType: 'photo' | 'video'
) => {
  const bucket = mediaType === 'photo' ? 'photos' : 'videos';
  const filePath = `${userId}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) throw error;

  const { data: mediaData, error: mediaError } = await supabase
    .from('media_items')
    .insert({
      user_id: userId,
      media_type: mediaType,
      file_path: filePath,
      file_size: file.size,
    })
    .select();

  if (mediaError) throw mediaError;

  return { path: filePath, media: mediaData[0] };
};

export const getMediaItems = async (userId: string) => {
  const { data, error } = await supabase
    .from('media_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const deleteMedia = async (mediaId: string, filePath: string, mediaType: 'photo' | 'video') => {
  const bucket = mediaType === 'photo' ? 'photos' : 'videos';

  await supabase.storage.from(bucket).remove([filePath]);
  await supabase.from('media_items').delete().eq('id', mediaId);
};

export const getMediaUrl = (bucket: string, path: string) => {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};
