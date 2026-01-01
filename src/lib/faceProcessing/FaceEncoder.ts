import * as tf from '@tensorflow/tfjs';
import { FaceDetection, FaceLandmarks } from './types';

export interface FaceEncoding {
  embedding: Float32Array;
  landmarks: FaceLandmarks;
  boundingBox: { x: number; y: number; width: number; height: number };
  alignedFace?: ImageData;
}

export class FaceEncoder {
  private model: tf.GraphModel | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await tf.ready();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize FaceEncoder:', error);
      throw error;
    }
  }

  async extractEncoding(
    imageData: ImageData,
    detection: FaceDetection
  ): Promise<FaceEncoding> {
    if (!this.initialized) {
      await this.initialize();
    }

    const alignedFace = this.alignFace(imageData, detection);
    const embedding = await this.computeEmbedding(alignedFace);

    return {
      embedding,
      landmarks: detection.landmarks,
      boundingBox: detection.box,
      alignedFace,
    };
  }

  private alignFace(
    imageData: ImageData,
    detection: FaceDetection
  ): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const targetSize = 256;
    canvas.width = targetSize;
    canvas.height = targetSize;

    const box = detection.box;
    const padding = 0.3;
    const width = box.width * (1 + padding);
    const height = box.height * (1 + padding);
    const x = box.x - (width - box.width) / 2;
    const y = box.y - (height - box.height) / 2;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);

    ctx.drawImage(
      tempCanvas,
      x,
      y,
      width,
      height,
      0,
      0,
      targetSize,
      targetSize
    );

    return ctx.getImageData(0, 0, targetSize, targetSize);
  }

  private async computeEmbedding(alignedFace: ImageData): Promise<Float32Array> {
    const tensor = tf.tidy(() => {
      const imageTensor = tf.browser.fromPixels(alignedFace);
      const normalized = imageTensor.toFloat().div(255.0);
      const resized = tf.image.resizeBilinear(normalized, [160, 160]);
      const batched = resized.expandDims(0);
      return batched;
    });

    try {
      const mockEmbedding = await this.generateMockEmbedding(tensor);
      return mockEmbedding;
    } finally {
      tensor.dispose();
    }
  }

  private async generateMockEmbedding(tensor: tf.Tensor): Promise<Float32Array> {
    const result = tf.tidy(() => {
      const flattened = tensor.reshape([-1]);
      const reduced = tf.layers.dense({ units: 512, activation: 'relu' }).apply(flattened) as tf.Tensor;
      const normalized = tf.norm(reduced, 2, -1, true);
      const embedding = reduced.div(normalized);
      return embedding;
    });

    const data = await result.data();
    result.dispose();
    return data as Float32Array;
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.initialized = false;
  }
}
