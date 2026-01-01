import { FaceProcessor, DetectedFace, FaceAlignment, Point2D, FaceProcessorConfig } from './types';

export class FaceAlignmentProcessor extends FaceProcessor {
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

      const alignment = this.calculateAlignment(face);
      return {
        ...face,
        alignment,
      };
    });
  }

  private calculateAlignment(face: DetectedFace): FaceAlignment {
    if (!face.landmarks) {
      return {
        angle: 0,
        scale: 1,
        translation: { x: 0, y: 0 },
        alignedBox: face.box,
      };
    }

    const leftEye = this.getCenterPoint(face.landmarks.contours.leftEye);
    const rightEye = this.getCenterPoint(face.landmarks.contours.rightEye);

    const dY = rightEye.y - leftEye.y;
    const dX = rightEye.x - leftEye.x;
    const angle = Math.atan2(dY, dX) * (180 / Math.PI);

    const eyeDistance = Math.sqrt(dX * dX + dY * dY);
    const desiredEyeDistance = face.box.width * 0.35;
    const scale = desiredEyeDistance / eyeDistance;

    const eyeCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2,
    };

    const desiredCenter = {
      x: face.box.x + face.box.width / 2,
      y: face.box.y + face.box.height * 0.4,
    };

    const translation = {
      x: desiredCenter.x - eyeCenter.x,
      y: desiredCenter.y - eyeCenter.y,
    };

    return {
      angle,
      scale,
      translation,
      alignedBox: this.getAlignedBox(face.box, angle, scale, translation),
    };
  }

  private getCenterPoint(points: Point2D[]): Point2D {
    if (points.length === 0) return { x: 0, y: 0 };

    const sum = points.reduce(
      (acc, p) => ({
        x: acc.x + p.x,
        y: acc.y + p.y,
      }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
    };
  }

  private getAlignedBox(
    box: DetectedFace['box'],
    angle: number,
    scale: number,
    translation: Point2D
  ): DetectedFace['box'] {
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const corners = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x, y: box.y + box.height },
      { x: box.x + box.width, y: box.y + box.height },
    ];

    const rotatedCorners = corners.map((corner) => {
      const dx = corner.x - centerX;
      const dy = corner.y - centerY;
      return {
        x: centerX + (dx * cos - dy * sin) * scale + translation.x,
        y: centerY + (dx * sin + dy * cos) * scale + translation.y,
      };
    });

    const minX = Math.min(...rotatedCorners.map((c) => c.x));
    const maxX = Math.max(...rotatedCorners.map((c) => c.x));
    const minY = Math.min(...rotatedCorners.map((c) => c.y));
    const maxY = Math.max(...rotatedCorners.map((c) => c.y));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  dispose(): void {}
}
