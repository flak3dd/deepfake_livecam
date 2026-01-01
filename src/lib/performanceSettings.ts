import { supabase } from './supabase';
import { DeviceType, OptimizationMode } from './deviceDetection';

export interface PerformanceSettings {
  id?: string;
  user_id: string;
  device_type: DeviceType;
  optimization_mode: OptimizationMode;
  use_gpu_acceleration: boolean;
  max_resolution: number;
  thread_count: number;
  memory_limit_mb?: number;
  enable_metal: boolean;
  enable_tensorrt: boolean;
  batch_size: number;
  created_at?: string;
  updated_at?: string;
}

export const getPerformanceSettings = async (userId: string): Promise<PerformanceSettings | null> => {
  const { data, error } = await supabase
    .from('performance_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch performance settings:', error);
    return null;
  }

  return data;
};

export const savePerformanceSettings = async (
  settings: PerformanceSettings
): Promise<PerformanceSettings | null> => {
  const { data: existing } = await supabase
    .from('performance_settings')
    .select('id')
    .eq('user_id', settings.user_id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('performance_settings')
      .update({
        device_type: settings.device_type,
        optimization_mode: settings.optimization_mode,
        use_gpu_acceleration: settings.use_gpu_acceleration,
        max_resolution: settings.max_resolution,
        thread_count: settings.thread_count,
        memory_limit_mb: settings.memory_limit_mb,
        enable_metal: settings.enable_metal,
        enable_tensorrt: settings.enable_tensorrt,
        batch_size: settings.batch_size,
      })
      .eq('user_id', settings.user_id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Failed to update performance settings:', error);
      return null;
    }

    return data;
  } else {
    const { data, error } = await supabase
      .from('performance_settings')
      .insert(settings)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Failed to insert performance settings:', error);
      return null;
    }

    return data;
  }
};

export const getOptimizationPresets = (deviceType: DeviceType) => {
  const presets = {
    apple_silicon: {
      performance: {
        max_resolution: 3840,
        thread_count: 8,
        batch_size: 4,
        use_gpu_acceleration: true,
        enable_metal: true,
      },
      balanced: {
        max_resolution: 1920,
        thread_count: 6,
        batch_size: 2,
        use_gpu_acceleration: true,
        enable_metal: true,
      },
      quality: {
        max_resolution: 4096,
        thread_count: 8,
        batch_size: 1,
        use_gpu_acceleration: true,
        enable_metal: true,
      },
      battery: {
        max_resolution: 1280,
        thread_count: 4,
        batch_size: 1,
        use_gpu_acceleration: false,
        enable_metal: false,
      },
    },
    nvidia_gpu: {
      performance: {
        max_resolution: 3840,
        thread_count: 8,
        batch_size: 8,
        use_gpu_acceleration: true,
        enable_tensorrt: true,
      },
      balanced: {
        max_resolution: 1920,
        thread_count: 6,
        batch_size: 4,
        use_gpu_acceleration: true,
        enable_tensorrt: true,
      },
      quality: {
        max_resolution: 4096,
        thread_count: 8,
        batch_size: 2,
        use_gpu_acceleration: true,
        enable_tensorrt: true,
      },
      battery: {
        max_resolution: 1280,
        thread_count: 4,
        batch_size: 1,
        use_gpu_acceleration: false,
        enable_tensorrt: false,
      },
    },
    amd_gpu: {
      performance: {
        max_resolution: 3840,
        thread_count: 8,
        batch_size: 4,
        use_gpu_acceleration: true,
        enable_tensorrt: false,
      },
      balanced: {
        max_resolution: 1920,
        thread_count: 6,
        batch_size: 2,
        use_gpu_acceleration: true,
        enable_tensorrt: false,
      },
      quality: {
        max_resolution: 4096,
        thread_count: 8,
        batch_size: 1,
        use_gpu_acceleration: true,
        enable_tensorrt: false,
      },
      battery: {
        max_resolution: 1280,
        thread_count: 4,
        batch_size: 1,
        use_gpu_acceleration: false,
        enable_tensorrt: false,
      },
    },
    cpu: {
      performance: {
        max_resolution: 1920,
        thread_count: 8,
        batch_size: 1,
        use_gpu_acceleration: false,
        enable_tensorrt: false,
      },
      balanced: {
        max_resolution: 1280,
        thread_count: 4,
        batch_size: 1,
        use_gpu_acceleration: false,
        enable_tensorrt: false,
      },
      quality: {
        max_resolution: 1920,
        thread_count: 6,
        batch_size: 1,
        use_gpu_acceleration: false,
        enable_tensorrt: false,
      },
      battery: {
        max_resolution: 720,
        thread_count: 2,
        batch_size: 1,
        use_gpu_acceleration: false,
        enable_tensorrt: false,
      },
    },
    unknown: {
      performance: {
        max_resolution: 1920,
        thread_count: 4,
        batch_size: 1,
        use_gpu_acceleration: false,
        enable_tensorrt: false,
      },
      balanced: {
        max_resolution: 1280,
        thread_count: 4,
        batch_size: 1,
        use_gpu_acceleration: false,
        enable_tensorrt: false,
      },
      quality: {
        max_resolution: 1920,
        thread_count: 4,
        batch_size: 1,
        use_gpu_acceleration: false,
        enable_tensorrt: false,
      },
      battery: {
        max_resolution: 720,
        thread_count: 2,
        batch_size: 1,
        use_gpu_acceleration: false,
        enable_tensorrt: false,
      },
    },
  };

  return presets[deviceType] || presets.unknown;
};
