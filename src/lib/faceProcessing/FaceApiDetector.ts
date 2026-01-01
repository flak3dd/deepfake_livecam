import * as faceapi from 'face-api.js';
import { FaceProcessor, DetectedFace, FaceLandmarks, Point3D, FaceProcessorConfig } from './types';

export class FaceApiDetector extends FaceProcessor {
  private isInitialized = false;
  private modelsLoaded = false;

  constructor(config: FaceProcessorConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Loading face-api.js models...');

      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);

      this.modelsLoaded = true;
      this.isInitialized = true;
      console.log('face-api.js models loaded successfully');
    } catch (error) {
      console.error('Failed to initialize face-api.js detector:', error);
      throw error;
    }
  }

  async process(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    faces: DetectedFace[]
  ): Promise<DetectedFace[]> {
    if (!this.isEnabled() || !this.modelsLoaded) {
      return faces;
    }

    try {
      const detections = await faceapi
        .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      const detectedFaces: DetectedFace[] = detections.map((detection, index) => {
        const box = detection.detection.box;
        const landmarks = this.convertToLandmarks(detection.landmarks);

        return {
          id: `face-${index}-${Date.now()}`,
          box: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          },
          landmarks,
          timestamp: Date.now(),
          detection: {
            box: {
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
            },
            landmarks,
          },
        };
      });

      return detectedFaces;
    } catch (error) {
      console.error('Face detection error:', error);
      return faces;
    }
  }

  private convertToLandmarks(faceApiLandmarks: any): FaceLandmarks {
    const positions: Point3D[] = faceApiLandmarks.positions.map((pos: any) => ({
      x: pos.x,
      y: pos.y,
      z: 0,
    }));

    const jawOutline = positions.slice(0, 17);
    const leftEyebrow = positions.slice(17, 22);
    const rightEyebrow = positions.slice(22, 27);
    const noseBridge = positions.slice(27, 31);
    const noseTip = positions.slice(31, 36);
    const leftEye = positions.slice(36, 42);
    const rightEye = positions.slice(42, 48);
    const outerLips = positions.slice(48, 60);
    const innerLips = positions.slice(60, 68);

    return {
      positions,
      contours: {
        jawOutline,
        leftEyebrow,
        rightEyebrow,
        noseBridge,
        noseTip,
        leftEye,
        rightEye,
        outerLips,
        innerLips,
        faceOval: jawOutline,
      },
    };
  }

  dispose(): void {
    this.isInitialized = false;
    this.modelsLoaded = false;
  }
}
