const BACKEND_URL = import.meta.env.VITE_FACE_PROCESSING_BACKEND_URL || 'http://localhost:8000';

export interface FaceSwapOptions {
  blendStrength?: number;
  colorCorrection?: boolean;
  faceScale?: number;
}

export interface FaceRestoreOptions {
  strength?: number;
  denoiseLevel?: number;
  sharpenAmount?: number;
  enhanceDetails?: boolean;
}

export class FaceProcessingService {
  private static instance: FaceProcessingService;

  private constructor() {}

  static getInstance(): FaceProcessingService {
    if (!FaceProcessingService.instance) {
      FaceProcessingService.instance = new FaceProcessingService();
    }
    return FaceProcessingService.instance;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      const data = await response.json();
      return data.status === 'healthy' && data.models_loaded;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  async swapFace(
    sourceFace: Blob,
    targetImage: Blob,
    options: FaceSwapOptions = {}
  ): Promise<Blob> {
    const formData = new FormData();
    formData.append('source_face', sourceFace);
    formData.append('target_image', targetImage);

    if (options.blendStrength !== undefined) {
      formData.append('blend_strength', options.blendStrength.toString());
    }
    if (options.colorCorrection !== undefined) {
      formData.append('color_correction', options.colorCorrection.toString());
    }
    if (options.faceScale !== undefined) {
      formData.append('face_scale', options.faceScale.toString());
    }

    const response = await fetch(`${BACKEND_URL}/api/face-swap`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Face swap failed: ${error}`);
    }

    return await response.blob();
  }

  async restoreFace(
    image: Blob,
    options: FaceRestoreOptions = {}
  ): Promise<Blob> {
    const formData = new FormData();
    formData.append('image', image);

    if (options.strength !== undefined) {
      formData.append('strength', options.strength.toString());
    }
    if (options.denoiseLevel !== undefined) {
      formData.append('denoise_level', options.denoiseLevel.toString());
    }
    if (options.sharpenAmount !== undefined) {
      formData.append('sharpen_amount', options.sharpenAmount.toString());
    }
    if (options.enhanceDetails !== undefined) {
      formData.append('enhance_details', options.enhanceDetails.toString());
    }

    const response = await fetch(`${BACKEND_URL}/api/face-restore`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Face restoration failed: ${error}`);
    }

    return await response.blob();
  }

  async swapFaceVideoFrame(
    sourceFace: Blob,
    frame: Blob,
    blendStrength: number = 0.8
  ): Promise<Blob> {
    const formData = new FormData();
    formData.append('source_face', sourceFace);
    formData.append('frame', frame);
    formData.append('blend_strength', blendStrength.toString());

    const response = await fetch(`${BACKEND_URL}/api/face-swap-video-frame`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Video frame swap failed: ${error}`);
    }

    return await response.blob();
  }

  canvasToBlob(canvas: HTMLCanvasElement, type: string = 'image/png'): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, type);
    });
  }

  imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
    }
    return canvas;
  }

  async imageDataToBlob(imageData: ImageData, type: string = 'image/png'): Promise<Blob> {
    const canvas = this.imageDataToCanvas(imageData);
    return await this.canvasToBlob(canvas, type);
  }
}

export const faceProcessingService = FaceProcessingService.getInstance();
