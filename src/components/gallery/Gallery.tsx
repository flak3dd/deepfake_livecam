import React, { useState, useEffect } from 'react';
import { Trash2, Download, Play } from 'lucide-react';
import { getMediaItems, deleteMedia, getMediaUrl } from '../../lib/services/supabase';

interface MediaItem {
  id: string;
  media_type: 'photo' | 'video';
  file_path: string;
  file_size: number;
  created_at: string;
}

interface GalleryProps {
  userId?: string;
}

export const Gallery: React.FC<GalleryProps> = ({ userId }) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (userId) {
      loadMedia();
    }
  }, [userId]);

  const loadMedia = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const items = await getMediaItems(userId);
      setMedia(items);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    try {
      await deleteMedia(item.id, item.file_path, item.media_type);
      setMedia(media.filter((m) => m.id !== item.id));
    } catch (error) {
      console.error('Failed to delete media:', error);
    }
  };

  const handleDownload = (item: MediaItem) => {
    const bucket = item.media_type === 'photo' ? 'photos' : 'videos';
    const url = getMediaUrl(bucket, item.file_path);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.media_type}-${Date.now()}`;
    link.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!userId) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Sign in to view your gallery</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading gallery...</p>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No photos or videos yet</p>
        <p className="text-sm text-gray-400 mt-2">Take your first capture to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {media.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
          >
            <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
              {item.media_type === 'photo' ? (
                <img
                  src={getMediaUrl('photos', item.file_path)}
                  alt="Captured photo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23333%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E';
                  }}
                />
              ) : (
                <>
                  <video
                    src={getMediaUrl('videos', item.file_path)}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setSelectedVideo(item)}
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-60 transition"
                  >
                    <Play size={40} className="text-white" />
                  </button>
                </>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  {item.media_type}
                </p>
                <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
                <p className="text-xs text-gray-400">{formatFileSize(item.file_size)}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(item)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium transition"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-medium transition"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="bg-black rounded-lg max-w-2xl w-full aspect-video">
            <video
              src={getMediaUrl('videos', selectedVideo.file_path)}
              controls
              autoPlay
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
