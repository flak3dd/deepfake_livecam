import React from 'react';
import { RenderOptions, ProcessingPipeline, DetectedFace } from '../../lib/faceProcessing';
import { FaceEffectType, FaceEffectSettings } from '../../lib/faceProcessing/FaceEffectsProcessor';
import { Eye, Smile, Target, Wand2, Layers } from 'lucide-react';

interface AdvancedFaceControlsProps {
  pipelineConfig: ProcessingPipeline;
  renderOptions: RenderOptions;
  faceEffects: FaceEffectSettings;
  detectedFaces: DetectedFace[];
  onPipelineConfigChange: (config: Partial<ProcessingPipeline>) => void;
  onRenderOptionsChange: (options: Partial<RenderOptions>) => void;
  onFaceEffectsChange: (effects: FaceEffectSettings) => void;
}

export const AdvancedFaceControls: React.FC<AdvancedFaceControlsProps> = ({
  pipelineConfig,
  renderOptions,
  faceEffects,
  detectedFaces,
  onPipelineConfigChange,
  onRenderOptionsChange,
  onFaceEffectsChange,
}) => {
  const faceEffectOptions: { value: FaceEffectType; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'faceBlur', label: 'Face Blur' },
    { value: 'facePixelate', label: 'Pixelate' },
    { value: 'faceGlow', label: 'Glow' },
    { value: 'faceDistort', label: 'Distort' },
    { value: 'bigEyes', label: 'Big Eyes' },
    { value: 'slimFace', label: 'Slim Face' },
    { value: 'beautify', label: 'Beautify' },
  ];

  return (
    <div className="space-y-6 bg-white rounded-lg shadow p-6 max-w-4xl w-full">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Wand2 size={20} className="text-blue-600" />
          Advanced Face Processing
        </h3>
        <div className="text-sm text-gray-600">
          {detectedFaces.length} {detectedFaces.length === 1 ? 'face' : 'faces'} detected
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Target size={16} />
            Processing Pipeline
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pipelineConfig.detection.enabled}
                onChange={(e) =>
                  onPipelineConfigChange({
                    detection: { ...pipelineConfig.detection, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span>Face Detection</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pipelineConfig.landmarks.enabled}
                onChange={(e) =>
                  onPipelineConfigChange({
                    landmarks: { ...pipelineConfig.landmarks, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span>Landmarks (468pts)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pipelineConfig.alignment.enabled}
                onChange={(e) =>
                  onPipelineConfigChange({
                    alignment: { ...pipelineConfig.alignment, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span>Face Alignment</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pipelineConfig.expression.enabled}
                onChange={(e) =>
                  onPipelineConfigChange({
                    expression: { ...pipelineConfig.expression, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span>Expression Analysis</span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Eye size={16} />
            Visualization
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={renderOptions.showBoundingBox}
                onChange={(e) =>
                  onRenderOptionsChange({ showBoundingBox: e.target.checked })
                }
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span>Bounding Box</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={renderOptions.showLandmarks}
                onChange={(e) =>
                  onRenderOptionsChange({ showLandmarks: e.target.checked })
                }
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span>Landmarks</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={renderOptions.showMesh}
                onChange={(e) =>
                  onRenderOptionsChange({ showMesh: e.target.checked })
                }
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span>Face Mesh</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={renderOptions.showExpression}
                onChange={(e) =>
                  onRenderOptionsChange({ showExpression: e.target.checked })
                }
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span>Expression Data</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={renderOptions.showAlignment}
                onChange={(e) =>
                  onRenderOptionsChange({ showAlignment: e.target.checked })
                }
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span>Alignment Info</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={renderOptions.showFaceId}
                onChange={(e) =>
                  onRenderOptionsChange({ showFaceId: e.target.checked })
                }
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span>Face ID</span>
            </label>
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Smile size={16} />
            Face Effects
          </label>
          <div className="flex flex-wrap gap-2">
            {faceEffectOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  onFaceEffectsChange({
                    type: option.value,
                    intensity: faceEffects.type === option.value ? faceEffects.intensity : 0.5,
                  })
                }
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  faceEffects.type === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {faceEffects.type !== 'none' && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Effect Intensity: {Math.round(faceEffects.intensity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={faceEffects.intensity}
                onChange={(e) =>
                  onFaceEffectsChange({
                    ...faceEffects,
                    intensity: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {detectedFaces.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Layers size={16} />
              Detected Faces
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {detectedFaces.map((face, index) => (
                <div
                  key={face.id}
                  className="bg-gray-50 rounded p-3 text-xs space-y-1"
                >
                  <div className="font-semibold text-gray-700">Face {index + 1}</div>
                  {face.expression && (
                    <div>
                      Expression:{' '}
                      {Object.entries(face.expression)
                        .filter(([_, value]) => value > 0.3)
                        .map(([emotion, value]) => `${emotion} (${Math.round(value * 100)}%)`)
                        .join(', ') || 'Neutral'}
                    </div>
                  )}
                  {face.alignment && (
                    <div>
                      Alignment: {face.alignment.angle.toFixed(1)}° / Scale: {face.alignment.scale.toFixed(2)}x
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
