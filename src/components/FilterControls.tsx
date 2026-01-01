import React from 'react';
import { FilterSettings, FilterType } from '../lib/videoFilters';

interface FilterControlsProps {
  filter: FilterSettings;
  onFilterChange: (filter: FilterSettings) => void;
  enableFaceDetection: boolean;
  onFaceDetectionChange: (enabled: boolean) => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filter,
  onFilterChange,
  enableFaceDetection,
  onFaceDetectionChange,
}) => {
  const filterOptions: FilterType[] = ['none', 'blur', 'brightness', 'contrast', 'grayscale'];

  const getValueLabel = () => {
    switch (filter.type) {
      case 'blur':
        return `Blur: ${Math.round(filter.value)}`;
      case 'brightness':
        return `Brightness: ${Math.round(filter.value)}`;
      case 'contrast':
        return `Contrast: ${Math.round(filter.value)}`;
      default:
        return '';
    }
  };

  const getValueRange = () => {
    switch (filter.type) {
      case 'blur':
        return { min: 0, max: 10, step: 0.5 };
      case 'brightness':
        return { min: -100, max: 100, step: 1 };
      case 'contrast':
        return { min: -100, max: 100, step: 1 };
      default:
        return { min: 0, max: 100, step: 1 };
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl p-6 max-w-4xl w-full">
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-300">Video Filters</label>
        <div className="flex flex-wrap gap-3">
          {filterOptions.map((option) => (
            <button
              key={option}
              onClick={() =>
                onFilterChange({
                  type: option,
                  value: filter.type === option ? filter.value : 0,
                })
              }
              className={`group relative px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                filter.type === option
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
              {filter.type === option && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 opacity-20 blur-lg"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {filter.type !== 'none' && filter.type !== 'grayscale' && (
        <div className="space-y-3 mt-6">
          <label className="block text-sm font-semibold text-gray-300">
            {getValueLabel()}
          </label>
          <div className="relative">
            <input
              type="range"
              min={getValueRange().min}
              max={getValueRange().max}
              step={getValueRange().step}
              value={filter.value}
              onChange={(e) =>
                onFilterChange({
                  type: filter.type,
                  value: parseFloat(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, rgb(6, 182, 212) 0%, rgb(6, 182, 212) ${((filter.value - getValueRange().min) / (getValueRange().max - getValueRange().min)) * 100}%, rgb(31, 41, 55) ${((filter.value - getValueRange().min) / (getValueRange().max - getValueRange().min)) * 100}%, rgb(31, 41, 55) 100%)`
              }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 mt-4 border-t border-gray-800/50">
        <label htmlFor="faceDetection" className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="faceDetection"
            checked={enableFaceDetection}
            onChange={(e) => onFaceDetectionChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-teal-500"></div>
          <span className="ml-3 text-sm font-medium text-gray-300">Enable Face Detection & Tracking</span>
        </label>
      </div>
    </div>
  );
};
