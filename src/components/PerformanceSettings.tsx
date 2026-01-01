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
    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg">
            <Settings className="text-white" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-white">Performance Settings</h3>
        </div>
        {userId && (
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="relative group px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 transition-all duration-300"
          >
            {saving ? 'Saving...' : 'Save Settings'}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity"></div>
          </button>
        )}
      </div>

      {capabilities.isAppleSilicon && (
        <div className="relative overflow-hidden bg-gradient-to-r from-gray-800 to-gray-850 rounded-xl p-5 border border-gray-700/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-2xl"></div>
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
              <Apple className="w-7 h-7 text-gray-300" />
            </div>
            <div>
              <div className="font-semibold text-white text-lg">Apple Silicon Detected</div>
              <div className="text-sm text-gray-400 mt-1">
                {capabilities.isM1OrBetter ? 'M1/M2/M3/M4 chip with Metal acceleration' : 'Optimized for Apple Silicon'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-4">
          Optimization Mode
        </label>
        <div className="grid grid-cols-2 gap-4">
          {(['performance', 'balanced', 'quality', 'battery'] as OptimizationMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`group relative p-5 rounded-xl border-2 transition-all duration-300 ${
                settings.optimization_mode === mode
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50 hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${settings.optimization_mode === mode ? 'bg-cyan-500/20' : 'bg-gray-700/50'}`}>
                  {getModeIcon(mode)}
                </div>
                <span className={`font-semibold capitalize ${settings.optimization_mode === mode ? 'text-white' : 'text-gray-300'}`}>
                  {mode}
                </span>
              </div>
              <p className={`text-xs text-left ${settings.optimization_mode === mode ? 'text-gray-300' : 'text-gray-500'}`}>
                {getModeDescription(mode)}
              </p>
              {settings.optimization_mode === mode && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 opacity-10 blur-xl"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-800/50">
        <h4 className="text-sm font-semibold text-gray-300">Current Configuration</h4>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Device Type', value: capabilities.deviceType.replace('_', ' ') },
            { label: 'Max Resolution', value: `${settings.max_resolution}p` },
            { label: 'Thread Count', value: `${settings.thread_count} threads` },
            { label: 'Batch Size', value: settings.batch_size },
          ].map((item) => (
            <div key={item.label} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
              <span className="text-xs text-gray-500 block mb-1">{item.label}</span>
              <div className="font-semibold text-white capitalize">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.use_gpu_acceleration}
              onChange={(e) => setSettings({ ...settings, use_gpu_acceleration: e.target.checked })}
              className="sr-only peer"
              disabled={!capabilities.hasGPU}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-teal-500 peer-disabled:opacity-50"></div>
            <span className="ml-3 text-sm font-medium text-gray-300">GPU Acceleration</span>
            {!capabilities.hasGPU && (
              <span className="ml-2 text-xs text-gray-500">(Not available)</span>
            )}
          </label>

          {capabilities.isAppleSilicon && (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_metal}
                onChange={(e) => setSettings({ ...settings, enable_metal: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-teal-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-300">Metal Performance Shaders</span>
            </label>
          )}

          {capabilities.deviceType === 'nvidia_gpu' && (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_tensorrt}
                onChange={(e) => setSettings({ ...settings, enable_tensorrt: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-teal-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-300">TensorRT Optimization</span>
            </label>
          )}
        </div>
      </div>

      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-5">
        <div className="flex gap-4">
          <div className="p-2 bg-cyan-500/20 rounded-lg h-fit">
            <Info className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-sm text-cyan-100">
            <p className="font-semibold mb-2 text-white">Performance Tips</p>
            {capabilities.isAppleSilicon ? (
              <ul className="list-disc list-inside space-y-1.5 text-cyan-200">
                <li>Metal acceleration provides best performance on Apple Silicon</li>
                <li>Performance mode recommended for M1 Pro/Max/Ultra and M2/M3</li>
                <li>Backend processing uses CoreML when available</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1.5 text-cyan-200">
                <li>Enable GPU acceleration for better performance</li>
                <li>Lower resolution for real-time processing</li>
                <li>Quality mode for final output</li>
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-gray-800/50">
        {[
          { label: 'CPU Cores', value: capabilities.cores },
          { label: 'Memory', value: `${(capabilities.memory / 1024).toFixed(0)} GB` },
          { label: 'Max Texture', value: `${capabilities.maxTextureSize}px` },
          { label: 'WebGL', value: capabilities.hasWebGL ? 'Supported' : 'No' },
        ].map((spec) => (
          <div key={spec.label} className="text-center">
            <div className="text-xs text-gray-500 mb-1">{spec.label}</div>
            <div className="text-sm font-semibold text-gray-300">{spec.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
