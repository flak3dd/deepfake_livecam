import * as tf from '@tensorflow/tfjs';
import { FaceDetection } from './types';
import { FaceEncoding } from './FaceEncoder';

export interface SwapOptions {
  blendStrength: number;
  colorCorrection: boolean;
  faceScale: number;
  erasingThreshold: number;
}

export class FaceSwapper {
  private initialized = false;
  private sourceFaceEncoding: FaceEncoding | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await tf.ready();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize FaceSwapper:', error);
      throw error;
    }
  }

  setSourceFace(encoding: FaceEncoding): void {
    this.sourceFaceEncoding = encoding;
  }

  async swapFace(
    targetImageData: ImageData,
    targetDetection: FaceDetection,
    options: SwapOptions
  ): Promise<ImageData> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.sourceFaceEncoding) {
      return targetImageData;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetImageData.width;
    canvas.height = targetImageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(targetImageData, 0, 0);

    if (this.sourceFaceEncoding.alignedFace) {
      const swappedFace = await this.transformFace(
        this.sourceFaceEncoding.alignedFace,
        targetDetection,
        options
      );

      const blendedResult = this.blendFaces(
        canvas,
        swappedFace,
        targetDetection,
        options
      );

      return blendedResult;
    }

    return targetImageData;
  }

  private async transformFace(
    sourceFace: ImageData,
    targetDetection: FaceDetection,
    options: SwapOptions
  ): Promise<ImageData> {
    const tensor = tf.tidy(() => {
      const source = tf.browser.fromPixels(sourceFace);
      const normalized = source.toFloat().div(255.0);

      const targetBox = targetDetection.box;
      const targetWidth = Math.floor(targetBox.width * options.faceScale);
      const targetHeight = Math.floor(targetBox.height * options.faceScale);

      const resized = tf.image.resizeBilinear(normalized, [targetHeight, targetWidth]);

      return resized;
    });

    const canvas = document.createElement('canvas');
    canvas.width = tensor.shape[1];
    canvas.height = tensor.shape[0];

    await tf.browser.toPixels(tensor as tf.Tensor3D, canvas);
    tensor.dispose();

    const ctx = canvas.getContext('2d')!;
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private blendFaces(
    targetCanvas: HTMLCanvasElement,
    swappedFace: ImageData,
    detection: FaceDetection,
    options: SwapOptions
  ): ImageData {
    const ctx = targetCanvas.getContext('2d')!;
    const box = detection.box;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = swappedFace.width;
    tempCanvas.height = swappedFace.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(swappedFace, 0, 0);

    if (options.colorCorrection) {
      this.applyColorCorrection(tempCtx, ctx, box);
    }

    const x = box.x + (box.width - swappedFace.width) / 2;
    const y = box.y + (box.height - swappedFace.height) / 2;

    const maskCanvas = this.createBlendMask(swappedFace.width, swappedFace.height, options.blendStrength);

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(maskCanvas, x, y);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = options.blendStrength;
    ctx.drawImage(tempCanvas, x, y);

    ctx.restore();

    return ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
  }

  private createBlendMask(width: number, height: number, strength: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.2,
      width / 2,
      height / 2,
      Math.min(width, height) * 0.5
    );

    gradient.addColorStop(0, `rgba(0, 0, 0, ${strength})`);
    gradient.addColorStop(0.7, `rgba(0, 0, 0, ${strength * 0.8})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    return canvas;
  }

  private applyColorCorrection(
    sourceCtx: CanvasRenderingContext2D,
    targetCtx: CanvasRenderingContext2D,
    targetBox: { x: number; y: number; width: number; height: number }
  ): void {
    const sourceData = sourceCtx.getImageData(0, 0, sourceCtx.canvas.width, sourceCtx.canvas.height);
    const targetData = targetCtx.getImageData(targetBox.x, targetBox.y, targetBox.width, targetBox.height);

    const sourceAvg = this.calculateColorAverage(sourceData);
    const targetAvg = this.calculateColorAverage(targetData);

    const data = sourceData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * (targetAvg.r / sourceAvg.r));
      data[i + 1] = Math.min(255, data[i + 1] * (targetAvg.g / sourceAvg.g));
      data[i + 2] = Math.min(255, data[i + 2] * (targetAvg.b / sourceAvg.b));
    }

    sourceCtx.putImageData(sourceData, 0, 0);
  }

  private calculateColorAverage(imageData: ImageData): { r: number; g: number; b: number } {
    const data = imageData.data;
    let r = 0, g = 0, b = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }

    return {
      r: r / pixelCount,
      g: g / pixelCount,
      b: b / pixelCount,
    };
  }

  dispose(): void {
    this.sourceFaceEncoding = null;
    this.initialized = false;
  }
}
