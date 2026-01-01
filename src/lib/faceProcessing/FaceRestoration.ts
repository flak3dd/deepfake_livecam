import * as tf from '@tensorflow/tfjs';
import { FaceDetection } from './types';

export interface RestorationOptions {
  enabled: boolean;
  strength: number;
  denoiseLevel: number;
  sharpenAmount: number;
  enhanceDetails: boolean;
}

export class FaceRestoration {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await tf.ready();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize FaceRestoration:', error);
      throw error;
    }
  }

  async restore(
    imageData: ImageData,
    detection: FaceDetection,
    options: RestorationOptions
  ): Promise<ImageData> {
    if (!options.enabled || !this.initialized) {
      return imageData;
    }

    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);

    const box = detection.box;
    const faceRegion = ctx.getImageData(box.x, box.y, box.width, box.height);

    let restoredFace = faceRegion;

    if (options.denoiseLevel > 0) {
      restoredFace = await this.applyDenoising(restoredFace, options.denoiseLevel);
    }

    if (options.enhanceDetails) {
      restoredFace = await this.enhanceDetails(restoredFace, options.strength);
    }

    if (options.sharpenAmount > 0) {
      restoredFace = await this.applySharpen(restoredFace, options.sharpenAmount);
    }

    ctx.putImageData(restoredFace, box.x, box.y);

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private async applyDenoising(imageData: ImageData, level: number): Promise<ImageData> {
    const tensor = tf.tidy(() => {
      const image = tf.browser.fromPixels(imageData);
      const normalized = image.toFloat().div(255.0);

      const kernelSize = Math.ceil(level * 5);
      const kernel = this.createGaussianKernel(kernelSize, level);

      const r = normalized.slice([0, 0, 0], [-1, -1, 1]);
      const g = normalized.slice([0, 0, 1], [-1, -1, 1]);
      const b = normalized.slice([0, 0, 2], [-1, -1, 1]);

      const rBlurred = tf.conv2d(
        r.expandDims(0) as tf.Tensor4D,
        kernel,
        1,
        'same'
      ).squeeze([0]);
      const gBlurred = tf.conv2d(
        g.expandDims(0) as tf.Tensor4D,
        kernel,
        1,
        'same'
      ).squeeze([0]);
      const bBlurred = tf.conv2d(
        b.expandDims(0) as tf.Tensor4D,
        kernel,
        1,
        'same'
      ).squeeze([0]);

      const denoised = tf.stack([rBlurred, gBlurred, bBlurred], 2);
      const scaled = denoised.mul(255.0);

      return scaled;
    });

    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    await tf.browser.toPixels(tensor as tf.Tensor3D, canvas);
    tensor.dispose();

    const ctx = canvas.getContext('2d')!;
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private createGaussianKernel(size: number, sigma: number): tf.Tensor4D {
    return tf.tidy(() => {
      const kernel = tf.buffer([size, size, 1, 1]);
      const center = Math.floor(size / 2);
      let sum = 0;

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const x = i - center;
          const y = j - center;
          const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
          kernel.set(value, i, j, 0, 0);
          sum += value;
        }
      }

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const value = kernel.get(i, j, 0, 0);
          kernel.set(value / sum, i, j, 0, 0);
        }
      }

      return kernel.toTensor() as tf.Tensor4D;
    });
  }

  private async enhanceDetails(imageData: ImageData, strength: number): Promise<ImageData> {
    const tensor = tf.tidy(() => {
      const image = tf.browser.fromPixels(imageData);
      const normalized = image.toFloat().div(255.0);

      const enhanced = normalized.mul(1 + strength * 0.5).add(strength * 0.1);
      const clamped = enhanced.clipByValue(0, 1);
      const scaled = clamped.mul(255.0);

      return scaled;
    });

    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    await tf.browser.toPixels(tensor as tf.Tensor3D, canvas);
    tensor.dispose();

    const ctx = canvas.getContext('2d')!;
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private async applySharpen(imageData: ImageData, amount: number): Promise<ImageData> {
    const tensor = tf.tidy(() => {
      const image = tf.browser.fromPixels(imageData);
      const normalized = image.toFloat().div(255.0);

      const sharpenKernel = tf.tensor4d([
        [0, -amount, 0],
        [-amount, 1 + 4 * amount, -amount],
        [0, -amount, 0]
      ], [3, 3, 1, 1]);

      const r = normalized.slice([0, 0, 0], [-1, -1, 1]);
      const g = normalized.slice([0, 0, 1], [-1, -1, 1]);
      const b = normalized.slice([0, 0, 2], [-1, -1, 1]);

      const rSharp = tf.conv2d(
        r.expandDims(0) as tf.Tensor4D,
        sharpenKernel,
        1,
        'same'
      ).squeeze([0]);
      const gSharp = tf.conv2d(
        g.expandDims(0) as tf.Tensor4D,
        sharpenKernel,
        1,
        'same'
      ).squeeze([0]);
      const bSharp = tf.conv2d(
        b.expandDims(0) as tf.Tensor4D,
        sharpenKernel,
        1,
        'same'
      ).squeeze([0]);

      const sharpened = tf.stack([rSharp, gSharp, bSharp], 2);
      const clamped = sharpened.clipByValue(0, 1);
      const scaled = clamped.mul(255.0);

      return scaled;
    });

    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    await tf.browser.toPixels(tensor as tf.Tensor3D, canvas);
    tensor.dispose();

    const ctx = canvas.getContext('2d')!;
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  dispose(): void {
    this.initialized = false;
  }
}
