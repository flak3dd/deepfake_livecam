import React, { useEffect, useState } from 'react';
import { Camera, Video, Square, Download } from 'lucide-react';

interface CameraControlsProps {
  canvasRef: HTMLCanvasElement | null;
  isRecording: boolean;
  onTakePhoto: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recordingTime: number;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  canvasRef,
  isRecording,
  onTakePhoto,
  onStartRecording,
  onStopRecording,
  recordingTime,
}) => {
  const [downloadReady, setDownloadReady] = useState(false);

  useEffect(() => {
    setDownloadReady(!!canvasRef);
  }, [canvasRef]);

  const handleDownloadPhoto = () => {
    if (!canvasRef) return;

    const link = document.createElement('a');
    link.href = canvasRef.toDataURL('image/png');
    link.download = `photo-${Date.now()}.png`;
    link.click();
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 justify-center flex-wrap">
        <button
          onClick={onTakePhoto}
          disabled={isRecording}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
        >
          <Camera size={20} />
          Take Photo
        </button>

        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRecording ? (
            <>
              <Square size={20} />
              Stop Recording
            </>
          ) : (
            <>
              <Video size={20} />
              Start Recording
            </>
          )}
        </button>

        <button
          onClick={handleDownloadPhoto}
          disabled={!downloadReady}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
        >
          <Download size={20} />
          Download
        </button>
      </div>

      {isRecording && (
        <div className="flex justify-center items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          <span className="text-red-700 font-semibold">Recording: {formatTime(recordingTime)}</span>
        </div>
      )}
    </div>
  );
};
