import { FaceProcessor, DetectedFace, FaceExpression, Point2D, FaceProcessorConfig } from './types';

export class ExpressionDetector extends FaceProcessor {
  constructor(config: FaceProcessorConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  async process(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    faces: DetectedFace[]
  ): Promise<DetectedFace[]> {
    if (!this.isEnabled()) {
      return faces;
    }

    return faces.map((face) => {
      if (!face.landmarks) return face;

      const expression = this.detectExpression(face);
      return {
        ...face,
        expression,
      };
    });
  }

  private detectExpression(face: DetectedFace): FaceExpression {
    if (!face.landmarks) {
      return this.getNeutralExpression();
    }

    const mouthOpen = this.getMouthOpenness(face);
    const eyebrowRaise = this.getEyebrowRaise(face);
    const smileIntensity = this.getSmileIntensity(face);
    const eyeOpen = this.getEyeOpenness(face);

    const happy = Math.min(1, smileIntensity * 2);
    const surprised = Math.min(1, Math.max(mouthOpen, eyebrowRaise) * 1.5);
    const sad = Math.max(0, 1 - smileIntensity - eyebrowRaise);
    const angry = Math.max(0, (1 - smileIntensity) * (1 - eyebrowRaise));
    const neutral = 1 - (happy + surprised + sad + angry) / 4;

    return {
      neutral: Math.max(0, neutral),
      happy,
      sad: sad * 0.5,
      angry: angry * 0.3,
      fearful: surprised * 0.4,
      disgusted: (1 - smileIntensity) * 0.2,
      surprised,
    };
  }

  private getMouthOpenness(face: DetectedFace): number {
    if (!face.landmarks) return 0;

    const upperLip = face.landmarks.contours.outerLips[0];
    const lowerLip = face.landmarks.contours.outerLips[Math.floor(face.landmarks.contours.outerLips.length / 2)];

    if (!upperLip || !lowerLip) return 0;

    const mouthHeight = Math.abs(lowerLip.y - upperLip.y);
    const faceHeight = face.box.height;

    return Math.min(1, (mouthHeight / faceHeight) * 10);
  }

  private getEyebrowRaise(face: DetectedFace): number {
    if (!face.landmarks) return 0;

    const leftEyebrow = this.getAverageY(face.landmarks.contours.leftEyebrow);
    const rightEyebrow = this.getAverageY(face.landmarks.contours.rightEyebrow);
    const leftEye = this.getAverageY(face.landmarks.contours.leftEye);
    const rightEye = this.getAverageY(face.landmarks.contours.rightEye);

    const leftDistance = Math.abs(leftEye - leftEyebrow);
    const rightDistance = Math.abs(rightEye - rightEyebrow);
    const avgDistance = (leftDistance + rightDistance) / 2;

    return Math.min(1, (avgDistance / face.box.height) * 8);
  }

  private getSmileIntensity(face: DetectedFace): number {
    if (!face.landmarks) return 0;

    const leftMouth = face.landmarks.contours.outerLips[0];
    const rightMouth = face.landmarks.contours.outerLips[face.landmarks.contours.outerLips.length - 1];
    const centerMouth = face.landmarks.contours.outerLips[Math.floor(face.landmarks.contours.outerLips.length / 2)];

    if (!leftMouth || !rightMouth || !centerMouth) return 0;

    const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
    const avgCornerY = (leftMouth.y + rightMouth.y) / 2;
    const centerY = centerMouth.y;

    const smile = (avgCornerY - centerY) / face.box.height;

    return Math.max(0, Math.min(1, smile * 15));
  }

  private getEyeOpenness(face: DetectedFace): number {
    if (!face.landmarks) return 1;

    const leftEyeHeight = this.getVerticalDistance(face.landmarks.contours.leftEye);
    const rightEyeHeight = this.getVerticalDistance(face.landmarks.contours.rightEye);

    const avgHeight = (leftEyeHeight + rightEyeHeight) / 2;
    const normalized = (avgHeight / face.box.height) * 20;

    return Math.min(1, normalized);
  }

  private getAverageY(points: Point2D[]): number {
    if (points.length === 0) return 0;
    return points.reduce((sum, p) => sum + p.y, 0) / points.length;
  }

  private getVerticalDistance(points: Point2D[]): number {
    if (points.length === 0) return 0;

    const yValues = points.map((p) => p.y);
    return Math.max(...yValues) - Math.min(...yValues);
  }

  private getNeutralExpression(): FaceExpression {
    return {
      neutral: 1,
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0,
    };
  }

  dispose(): void {}
}
