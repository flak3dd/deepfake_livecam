import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';
import { FaceProcessor, DetectedFace, FaceLandmarks, Point3D, FaceProcessorConfig } from './types';

export class FaceMeshDetector extends FaceProcessor {
  private detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;
  private isInitialized = false;

  constructor(config: FaceProcessorConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const cdnPaths = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619',
      'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
    ];

    let lastError: Error | null = null;

    for (const cdnPath of cdnPaths) {
      try {
        console.log(`Attempting to load face mesh models from: ${cdnPath}`);

        const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
          runtime: 'mediapipe',
          solutionPath: cdnPath,
          maxFaces: this.config.options?.maxFaces || 2,
          refineLandmarks: false,
        };

        this.detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
        this.isInitialized = true;
        console.log('Face mesh detector initialized successfully');
        return;
      } catch (error) {
        console.warn(`Failed to load from ${cdnPath}:`, error);
        lastError = error as Error;
      }
    }

    const errorMessage = `Failed to initialize face mesh detector. ${lastError?.message || 'Unknown error'}. Please check your internet connection.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  async process(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    faces: DetectedFace[]
  ): Promise<DetectedFace[]> {
    if (!this.isEnabled() || !this.detector) {
      return faces;
    }

    try {
      const predictions = await this.detector.estimateFaces(canvas, {
        flipHorizontal: false,
      });

      const detectedFaces: DetectedFace[] = predictions.map((prediction, index) => {
        const box = prediction.box;
        const keypoints = prediction.keypoints;

        const landmarks = this.convertToLandmarks(keypoints);

        return {
          id: `face-${index}-${Date.now()}`,
          box: {
            x: box.xMin,
            y: box.yMin,
            width: box.width,
            height: box.height,
          },
          landmarks,
          timestamp: Date.now(),
        };
      });

      return detectedFaces;
    } catch (error) {
      console.error('Face mesh detection error:', error);
      return faces;
    }
  }

  private convertToLandmarks(keypoints: any[]): FaceLandmarks {
    const positions: Point3D[] = keypoints.map((kp) => ({
      x: kp.x,
      y: kp.y,
      z: kp.z || 0,
    }));

    const contours = {
      jawOutline: this.extractContour(positions, [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400]),
      leftEyebrow: this.extractContour(positions, [70, 63, 105, 66, 107, 55, 65, 52, 53, 46]),
      rightEyebrow: this.extractContour(positions, [300, 293, 334, 296, 336, 285, 295, 282, 283, 276]),
      noseBridge: this.extractContour(positions, [168, 6, 197, 195, 5]),
      noseTip: this.extractContour(positions, [1, 2, 98, 327]),
      leftEye: this.extractContour(positions, [33, 7, 163, 144, 145, 153, 154, 155, 133]),
      rightEye: this.extractContour(positions, [362, 382, 381, 380, 374, 373, 390, 249, 263]),
      outerLips: this.extractContour(positions, [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291]),
      innerLips: this.extractContour(positions, [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308]),
      faceOval: this.extractContour(positions, [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162]),
    };

    return { positions, contours };
  }

  private extractContour(positions: Point3D[], indices: number[]): Point3D[] {
    return indices
      .map((i) => positions[i])
      .filter((p) => p !== undefined);
  }

  dispose(): void {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
    }
    this.isInitialized = false;
  }
}
