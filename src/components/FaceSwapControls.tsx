import { useState } from 'react';
import { Upload, RefreshCw, Sliders } from 'lucide-react';
import { SwapOptions } from '../lib/faceProcessing';

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
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Face Swap</h3>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
            disabled={!hasSourceFace}
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
        </label>
      </div>

      {!hasSourceFace && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Upload a source face image to enable face swapping
          </p>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
          <div className="flex flex-col items-center space-y-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-600">
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
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <Sliders className="w-4 h-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Blend Strength</span>
                <span className="text-gray-500">{options.blendStrength.toFixed(2)}</span>
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Face Scale</span>
                <span className="text-gray-500">{options.faceScale.toFixed(2)}</span>
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Erasing Threshold</span>
                <span className="text-gray-500">{options.erasingThreshold.toFixed(2)}</span>
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="colorCorrection"
                checked={options.colorCorrection}
                onChange={(e) =>
                  onOptionsChange({ ...options, colorCorrection: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="colorCorrection" className="ml-2 text-sm font-medium text-gray-700">
                Color Correction
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
