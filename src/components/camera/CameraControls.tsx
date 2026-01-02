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
      <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl p-6">
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={onTakePhoto}
            disabled={isRecording}
            className="group relative flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300"
          >
            <Camera size={20} />
            Take Photo
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity"></div>
          </button>

          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            className={`group relative flex items-center gap-2.5 px-8 py-4 text-white rounded-xl font-semibold transition-all duration-300 ${
              isRecording
                ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-500/30'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/30'
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
            <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity ${
              isRecording ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'
            }`}></div>
          </button>

          <button
            onClick={handleDownloadPhoto}
            disabled={!downloadReady}
            className="group relative flex items-center gap-2.5 px-8 py-4 bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold border border-gray-600/50 transition-all duration-300"
          >
            <Download size={20} />
            Download
          </button>
        </div>
      </div>

      {isRecording && (
        <div className="flex justify-center items-center gap-3 bg-red-500/10 border border-red-500/30 backdrop-blur-lg rounded-xl p-4">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
          <span className="text-red-300 font-semibold text-lg">Recording: {formatTime(recordingTime)}</span>
        </div>
      )}
    </div>
  );
};
