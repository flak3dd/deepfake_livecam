import { useState } from 'react';
import { Upload, RefreshCw, Sliders } from 'lucide-react';
import { SwapOptions } from '../../lib/faceProcessing';

interface FaceSwapControlsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  options: SwapOptions;
  onOptionsChange: (options: SwapOptions) => void;
  onSourceFaceUpload: (file: File) => void;
  hasSourceFace: boolean;
}

export function FaceSwapControls({
  enabled,
  onToggle,
  options,
  onOptionsChange,
  onSourceFaceUpload,
  hasSourceFace,
}: FaceSwapControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSourceFaceUpload(file);
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Face Swap</h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
            disabled={!hasSourceFace}
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-teal-500 peer-disabled:opacity-50"></div>
        </label>
      </div>

      {!hasSourceFace && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-sm text-yellow-200">
            Upload a source face image to enable face swapping
          </p>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-center justify-center w-full h-32 px-4 transition bg-gray-800/30 border-2 border-gray-700/50 border-dashed rounded-xl appearance-none cursor-pointer hover:border-cyan-500/50 hover:bg-gray-800/50 focus:outline-none group">
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 bg-gray-700/50 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
              <Upload className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
            </div>
            <span className="text-sm text-gray-300 group-hover:text-cyan-300 transition-colors">
              {hasSourceFace ? 'Change Source Face' : 'Upload Source Face'}
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
        >
          <Sliders className="w-4 h-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-gray-800/50">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                <span>Blend Strength</span>
                <span className="text-cyan-400">{options.blendStrength.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={options.blendStrength}
                onChange={(e) =>
                  onOptionsChange({ ...options, blendStrength: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                <span>Face Scale</span>
                <span className="text-cyan-400">{options.faceScale.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.01"
                value={options.faceScale}
                onChange={(e) =>
                  onOptionsChange({ ...options, faceScale: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                <span>Erasing Threshold</span>
                <span className="text-cyan-400">{options.erasingThreshold.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={options.erasingThreshold}
                onChange={(e) =>
                  onOptionsChange({ ...options, erasingThreshold: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
              />
            </div>

            <label htmlFor="colorCorrection" className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="colorCorrection"
                checked={options.colorCorrection}
                onChange={(e) =>
                  onOptionsChange({ ...options, colorCorrection: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-teal-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-300">Color Correction</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
