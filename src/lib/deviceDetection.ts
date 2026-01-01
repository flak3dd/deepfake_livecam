export type DeviceType = 'apple_silicon' | 'nvidia_gpu' | 'amd_gpu' | 'cpu' | 'unknown';
export type OptimizationMode = 'balanced' | 'performance' | 'quality' | 'battery';

export interface DeviceCapabilities {
  deviceType: DeviceType;
  hasGPU: boolean;
  hasWebGL: boolean;
  isAppleSilicon: boolean;
  isM1OrBetter: boolean;
  maxTextureSize: number;
  recommendedMode: OptimizationMode;
  cores: number;
  memory: number;
}

export class DeviceDetector {
  private static instance: DeviceDetector;
  private capabilities: DeviceCapabilities | null = null;

  private constructor() {}

  static getInstance(): DeviceDetector {
    if (!DeviceDetector.instance) {
      DeviceDetector.instance = new DeviceDetector();
    }
    return DeviceDetector.instance;
  }

  async detectCapabilities(): Promise<DeviceCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const isAppleSilicon = this.detectAppleSilicon();
    const hasWebGL = this.checkWebGLSupport();
    const maxTextureSize = this.getMaxTextureSize();
    const cores = navigator.hardwareConcurrency || 4;
    const memory = this.estimateMemory();

    let deviceType: DeviceType = 'cpu';
    let hasGPU = false;
    let isM1OrBetter = false;

    if (isAppleSilicon) {
      deviceType = 'apple_silicon';
      hasGPU = true;
      isM1OrBetter = this.detectM1OrBetter();
    } else if (hasWebGL) {
      const gpuInfo = this.getGPUInfo();
      if (gpuInfo.includes('nvidia') || gpuInfo.includes('geforce')) {
        deviceType = 'nvidia_gpu';
        hasGPU = true;
      } else if (gpuInfo.includes('amd') || gpuInfo.includes('radeon')) {
        deviceType = 'amd_gpu';
        hasGPU = true;
      } else if (gpuInfo.includes('intel')) {
        deviceType = 'cpu';
        hasGPU = false;
      }
    }

    const recommendedMode = this.recommendOptimizationMode(deviceType, cores, memory);

    this.capabilities = {
      deviceType,
      hasGPU,
      hasWebGL,
      isAppleSilicon,
      isM1OrBetter,
      maxTextureSize,
      recommendedMode,
      cores,
      memory,
    };

    return this.capabilities;
  }

  private detectAppleSilicon(): boolean {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;

    const isMac = platform.includes('Mac') || userAgent.includes('Macintosh');

    if (!isMac) return false;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const rendererStr = renderer.toLowerCase();

        return rendererStr.includes('apple') && (
          rendererStr.includes('m1') ||
          rendererStr.includes('m2') ||
          rendererStr.includes('m3') ||
          rendererStr.includes('m4')
        );
      }
    }

    if ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0) {
      return false;
    }

    return isMac && cores >= 8;
  }

  private detectM1OrBetter(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const rendererStr = renderer.toLowerCase();

        const hasM1 = rendererStr.includes('m1');
        const hasM2 = rendererStr.includes('m2');
        const hasM3 = rendererStr.includes('m3');
        const hasM4 = rendererStr.includes('m4');

        return hasM1 || hasM2 || hasM3 || hasM4;
      }
    }

    return false;
  }

  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  private getMaxTextureSize(): number {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        return (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).MAX_TEXTURE_SIZE);
      }
    } catch (e) {
      console.error('Failed to get max texture size:', e);
    }
    return 2048;
  }

  private getGPUInfo(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          return renderer.toLowerCase();
        }
      }
    } catch (e) {
      console.error('Failed to get GPU info:', e);
    }
    return '';
  }

  private estimateMemory(): number {
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory * 1024;
    }
    return 8192;
  }

  private recommendOptimizationMode(
    deviceType: DeviceType,
    cores: number,
    memory: number
  ): OptimizationMode {
    if (deviceType === 'apple_silicon') {
      return cores >= 8 && memory >= 16384 ? 'performance' : 'balanced';
    } else if (deviceType === 'nvidia_gpu' || deviceType === 'amd_gpu') {
      return memory >= 16384 ? 'performance' : 'balanced';
    } else {
      return cores >= 8 ? 'balanced' : 'battery';
    }
  }

  getCapabilities(): DeviceCapabilities | null {
    return this.capabilities;
  }
}

export const deviceDetector = DeviceDetector.getInstance();
