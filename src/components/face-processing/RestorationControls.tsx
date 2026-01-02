import { Sparkles } from 'lucide-react';
import { RestorationOptions } from '../../lib/faceProcessing';

interface RestorationControlsProps {
  options: RestorationOptions;
  onOptionsChange: (options: RestorationOptions) => void;
}

export function RestorationControls({ options, onOptionsChange }: RestorationControlsProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Face Restoration</h3>
        </div>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={options.enabled}
            onChange={(e) => onOptionsChange({ ...options, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {options.enabled && (
        <div className="space-y-4">
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Restoration Strength</span>
              <span className="text-gray-500">{options.strength.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={options.strength}
              onChange={(e) =>
                onOptionsChange({ ...options, strength: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Denoise Level</span>
              <span className="text-gray-500">{options.denoiseLevel.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={options.denoiseLevel}
              onChange={(e) =>
                onOptionsChange({ ...options, denoiseLevel: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Sharpen Amount</span>
              <span className="text-gray-500">{options.sharpenAmount.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={options.sharpenAmount}
              onChange={(e) =>
                onOptionsChange({ ...options, sharpenAmount: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enhanceDetails"
              checked={options.enhanceDetails}
              onChange={(e) =>
                onOptionsChange({ ...options, enhanceDetails: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enhanceDetails" className="ml-2 text-sm font-medium text-gray-700">
              Enhance Details
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
