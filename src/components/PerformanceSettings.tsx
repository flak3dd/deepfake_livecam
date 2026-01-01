import { useState, useEffect } from 'react';
import { Cpu, Zap, Gauge, Battery, Info, Apple } from 'lucide-react';
import { deviceDetector, DeviceCapabilities, OptimizationMode } from '../lib/deviceDetection';
import { getPerformanceSettings, savePerformanceSettings, getOptimizationPresets, PerformanceSettings } from '../lib/performanceSettings';

interface PerformanceSettingsProps {
  userId?: string;
  onSettingsChange?: (settings: PerformanceSettings) => void;
}

export function PerformanceSettingsComponent({ userId, onSettingsChange }: PerformanceSettingsProps) {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [settings, setSettings] = useState<PerformanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initializeSettings();
  }, [userId]);

  const initializeSettings = async () => {
    setLoading(true);

    const caps = await deviceDetector.detectCapabilities();
    setCapabilities(caps);

    if (userId) {
      const existingSettings = await getPerformanceSettings(userId);

      if (existingSettings) {
        setSettings(existingSettings);
      } else {
        const defaultSettings = createDefaultSettings(userId, caps);
        setSettings(defaultSettings);
      }
    } else {
      const defaultSettings = createDefaultSettings('guest', caps);
      setSettings(defaultSettings);
    }

    setLoading(false);
  };

  const createDefaultSettings = (uid: string, caps: DeviceCapabilities): PerformanceSettings => {
    const preset = getOptimizationPresets(caps.deviceType)[caps.recommendedMode];

    return {
      user_id: uid,
      device_type: caps.deviceType,
      optimization_mode: caps.recommendedMode,
      use_gpu_acceleration: caps.hasGPU,
      max_resolution: preset.max_resolution,
      thread_count: preset.thread_count,
      enable_metal: caps.isAppleSilicon,
      enable_tensorrt: caps.deviceType === 'nvidia_gpu',
      batch_size: preset.batch_size,
    };
  };

  const handleModeChange = (mode: OptimizationMode) => {
    if (!settings || !capabilities) return;

    const preset = getOptimizationPresets(capabilities.deviceType)[mode];

    const updatedSettings: PerformanceSettings = {
      ...settings,
      optimization_mode: mode,
      max_resolution: preset.max_resolution,
      thread_count: preset.thread_count,
      batch_size: preset.batch_size,
      use_gpu_acceleration: preset.use_gpu_acceleration,
      enable_metal: preset.enable_metal ?? settings.enable_metal,
      enable_tensorrt: preset.enable_tensorrt ?? settings.enable_tensorrt,
    };

    setSettings(updatedSettings);
  };

  const handleSaveSettings = async () => {
    if (!settings || !userId) return;

    setSaving(true);
    const saved = await savePerformanceSettings(settings);

    if (saved) {
      setSettings(saved);
      onSettingsChange?.(saved);
    }

    setSaving(false);
  };

  const getModeIcon = (mode: OptimizationMode) => {
    switch (mode) {
      case 'performance': return <Zap className="w-5 h-5" />;
      case 'balanced': return <Gauge className="w-5 h-5" />;
      case 'quality': return <Cpu className="w-5 h-5" />;
      case 'battery': return <Battery className="w-5 h-5" />;
    }
  };

  const getModeDescription = (mode: OptimizationMode) => {
    switch (mode) {
      case 'performance': return 'Maximum speed, higher GPU/CPU usage';
      case 'balanced': return 'Good balance between speed and quality';
      case 'quality': return 'Best quality, slower processing';
      case 'battery': return 'Energy efficient, reduced quality';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!capabilities || !settings) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Performance Settings</h3>
        {userId && (
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      {capabilities.isAppleSilicon && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Apple className="w-6 h-6" />
            <div>
              <div className="font-semibold">Apple Silicon Detected</div>
              <div className="text-sm text-gray-300">
                {capabilities.isM1OrBetter ? 'M1/M2/M3/M4 chip with Metal acceleration' : 'Optimized for Apple Silicon'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Optimization Mode
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['performance', 'balanced', 'quality', 'battery'] as OptimizationMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.optimization_mode === mode
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getModeIcon(mode)}
                <span className="font-medium capitalize">{mode}</span>
              </div>
              <p className="text-xs text-gray-600 text-left">
                {getModeDescription(mode)}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-semibold text-gray-700">Current Configuration</h4>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Device Type:</span>
            <div className="font-medium capitalize">{capabilities.deviceType.replace('_', ' ')}</div>
          </div>

          <div>
            <span className="text-gray-600">Max Resolution:</span>
            <div className="font-medium">{settings.max_resolution}p</div>
          </div>

          <div>
            <span className="text-gray-600">Thread Count:</span>
            <div className="font-medium">{settings.thread_count} threads</div>
          </div>

          <div>
            <span className="text-gray-600">Batch Size:</span>
            <div className="font-medium">{settings.batch_size}</div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.use_gpu_acceleration}
              onChange={(e) => setSettings({ ...settings, use_gpu_acceleration: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              disabled={!capabilities.hasGPU}
            />
            <span className="text-sm text-gray-700">GPU Acceleration</span>
            {!capabilities.hasGPU && (
              <span className="text-xs text-gray-500">(Not available)</span>
            )}
          </label>

          {capabilities.isAppleSilicon && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enable_metal}
                onChange={(e) => setSettings({ ...settings, enable_metal: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Metal Performance Shaders</span>
            </label>
          )}

          {capabilities.deviceType === 'nvidia_gpu' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enable_tensorrt}
                onChange={(e) => setSettings({ ...settings, enable_tensorrt: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">TensorRT Optimization</span>
            </label>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Performance Tips</p>
            {capabilities.isAppleSilicon ? (
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Metal acceleration provides best performance on Apple Silicon</li>
                <li>Performance mode recommended for M1 Pro/Max/Ultra and M2/M3</li>
                <li>Backend processing uses CoreML when available</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Enable GPU acceleration for better performance</li>
                <li>Lower resolution for real-time processing</li>
                <li>Quality mode for final output</li>
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <div>CPU Cores: {capabilities.cores}</div>
        <div>Estimated Memory: {(capabilities.memory / 1024).toFixed(0)} GB</div>
        <div>Max Texture Size: {capabilities.maxTextureSize}px</div>
        <div>WebGL: {capabilities.hasWebGL ? 'Supported' : 'Not supported'}</div>
      </div>
    </div>
  );
}
