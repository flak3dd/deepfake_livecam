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
    <div className="space-y-4 bg-white rounded-lg shadow p-6 max-w-4xl w-full">
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Video Filters</label>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option}
              onClick={() =>
                onFilterChange({
                  type: option,
                  value: filter.type === option ? filter.value : 0,
                })
              }
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter.type === option
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filter.type !== 'none' && filter.type !== 'grayscale' && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {getValueLabel()}
          </label>
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
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t">
        <input
          type="checkbox"
          id="faceDetection"
          checked={enableFaceDetection}
          onChange={(e) => onFaceDetectionChange(e.target.checked)}
          className="w-4 h-4 rounded cursor-pointer"
        />
        <label htmlFor="faceDetection" className="text-sm font-medium text-gray-700 cursor-pointer">
          Enable Face Detection & Tracking
        </label>
      </div>
    </div>
  );
};
