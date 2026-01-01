import React, { useState, useRef } from 'react';
import { Upload, Loader, Check, AlertCircle } from 'lucide-react';
import { faceProcessingService } from '../lib/faceProcessingService';

export const BackendFaceSwap: React.FC = () => {
  const [sourceFace, setSourceFace] = useState<File | null>(null);
  const [targetImage, setTargetImage] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [blendStrength, setBlendStrength] = useState(0.8);
  const [colorCorrection, setColorCorrection] = useState(true);

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    const healthy = await faceProcessingService.checkHealth();
    setBackendHealthy(healthy);
  };

  const handleSourceFaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSourceFace(e.target.files[0]);
      setError(null);
    }
  };

  const handleTargetImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTargetImage(e.target.files[0]);
      setError(null);
    }
  };

  const handleSwapFace = async () => {
    if (!sourceFace || !targetImage) {
      setError('Please select both source face and target image');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResultImage(null);

    try {
      const resultBlob = await faceProcessingService.swapFace(
        sourceFace,
        targetImage,
        {
          blendStrength,
          colorCorrection,
          faceScale: 1.0,
        }
      );

      const resultUrl = URL.createObjectURL(resultBlob);
      setResultImage(resultUrl);
    } catch (err) {
      console.error('Face swap error:', err);
      setError(err instanceof Error ? err.message : 'Face swap failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'face-swapped.png';
      link.click();
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Python Backend Face Swap</h2>

      <div className="mb-4 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${backendHealthy === true ? 'bg-green-500' : backendHealthy === false ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
        <span className="text-sm text-slate-300">
          {backendHealthy === true && 'Backend Ready'}
          {backendHealthy === false && 'Backend Offline - Make sure Python server is running'}
          {backendHealthy === null && 'Checking backend...'}
        </span>
        <button
          onClick={checkBackendHealth}
          className="ml-auto text-sm text-blue-400 hover:text-blue-300"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Source Face
          </label>
          <div className="relative">
            <input
              ref={sourceInputRef}
              type="file"
              accept="image/*"
              onChange={handleSourceFaceChange}
              className="hidden"
            />
            <button
              onClick={() => sourceInputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-slate-600 rounded-lg hover:border-blue-500 transition flex flex-col items-center justify-center gap-2"
            >
              {sourceFace ? (
                <>
                  <Check className="text-green-500" size={32} />
                  <span className="text-sm text-slate-300">{sourceFace.name}</span>
                </>
              ) : (
                <>
                  <Upload className="text-slate-500" size={32} />
                  <span className="text-sm text-slate-400">Click to upload</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Target Image
          </label>
          <div className="relative">
            <input
              ref={targetInputRef}
              type="file"
              accept="image/*"
              onChange={handleTargetImageChange}
              className="hidden"
            />
            <button
              onClick={() => targetInputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-slate-600 rounded-lg hover:border-blue-500 transition flex flex-col items-center justify-center gap-2"
            >
              {targetImage ? (
                <>
                  <Check className="text-green-500" size={32} />
                  <span className="text-sm text-slate-300">{targetImage.name}</span>
                </>
              ) : (
                <>
                  <Upload className="text-slate-500" size={32} />
                  <span className="text-sm text-slate-400">Click to upload</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Blend Strength: {blendStrength.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={blendStrength}
            onChange={(e) => setBlendStrength(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="colorCorrection"
            checked={colorCorrection}
            onChange={(e) => setColorCorrection(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="colorCorrection" className="text-sm text-slate-300">
            Enable Color Correction
          </label>
        </div>
      </div>

      <button
        onClick={handleSwapFace}
        disabled={!sourceFace || !targetImage || isProcessing || !backendHealthy}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader className="animate-spin" size={20} />
            Processing...
          </>
        ) : (
          'Swap Face'
        )}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {resultImage && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-3">Result</h3>
          <div className="relative">
            <img
              src={resultImage}
              alt="Result"
              className="w-full rounded-lg shadow-lg"
            />
            <button
              onClick={handleDownload}
              className="absolute top-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
