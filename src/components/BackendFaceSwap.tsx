import React, { useState, useRef } from 'react';
import { Upload, Loader, Check, AlertCircle, Terminal, Play, Copy } from 'lucide-react';
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
  const [showInstructions, setShowInstructions] = useState(true);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

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

  const handleCopyCommand = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Python Backend Face Swap</h2>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition"
          >
            {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
          </button>
        </div>

        <div className="mb-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-4 h-4 rounded-full ${backendHealthy === true ? 'bg-green-500 animate-pulse' : backendHealthy === false ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            <span className="text-lg font-semibold text-white">
              {backendHealthy === true && '✓ Backend Connected'}
              {backendHealthy === false && '⚠ Backend Offline'}
              {backendHealthy === null && '⌛ Checking...'}
            </span>
            <button
              onClick={checkBackendHealth}
              className="ml-auto px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
            >
              <Play size={16} />
              Check Status
            </button>
          </div>
          <p className="text-sm text-slate-400">
            {backendHealthy === true && 'Python backend is running and ready to process images'}
            {backendHealthy === false && 'Backend server is not responding. Follow the instructions below to start it.'}
            {backendHealthy === null && 'Verifying backend connection...'}
          </p>
        </div>

        {showInstructions && (
          <div className="mb-6 p-6 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="text-cyan-400" size={24} />
              <h3 className="text-xl font-bold text-white">Start Backend Server</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-300 mb-3">
                  <span className="font-semibold text-cyan-400">Option 1:</span> Quick Start (CPU)
                </p>
                <div className="relative bg-slate-950 rounded-lg p-4 font-mono text-sm">
                  <pre className="text-green-400 overflow-x-auto">
cd backend{'\n'}
python -m venv venv{'\n'}
source venv/bin/activate  # Windows: venv\Scripts\activate{'\n'}
pip install -r requirements.txt{'\n'}
python main.py
                  </pre>
                  <button
                    onClick={() => handleCopyCommand('cd backend\npython -m venv venv\nsource venv/bin/activate\npip install -r requirements.txt\npython main.py', 'cpu')}
                    className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
                    title="Copy command"
                  >
                    {copiedCommand === 'cpu' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-300 mb-3">
                  <span className="font-semibold text-cyan-400">Option 2:</span> Docker (Recommended)
                </p>
                <div className="relative bg-slate-950 rounded-lg p-4 font-mono text-sm">
                  <pre className="text-green-400 overflow-x-auto">
cd backend{'\n'}
docker-compose up -d
                  </pre>
                  <button
                    onClick={() => handleCopyCommand('cd backend\ndocker-compose up -d', 'docker')}
                    className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
                    title="Copy command"
                  >
                    {copiedCommand === 'docker' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-200">
                  <span className="font-semibold">ℹ️ Note:</span> First run will download AI models (~800MB). This may take a few minutes.
                </p>
              </div>

              <div className="flex items-start gap-2 text-sm text-slate-400">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <p>
                  For GPU acceleration and more details, check{' '}
                  <code className="px-1.5 py-0.5 bg-slate-950 rounded text-cyan-400">backend/README.md</code>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-800 rounded-lg p-6 shadow-lg">

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
        className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
      >
        {isProcessing ? (
          <>
            <Loader className="animate-spin" size={20} />
            Processing with AI...
          </>
        ) : (
          <>
            <Play size={20} />
            Swap Face
          </>
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
              className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-teal-700 transition shadow-lg"
            >
              Download
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
