import { DetectedFace, Point2D } from './types';

export interface RenderOptions {
  showBoundingBox: boolean;
  showLandmarks: boolean;
  showMesh: boolean;
  showExpression: boolean;
  showAlignment: boolean;
  showFaceId: boolean;
}

export class FaceRenderer {
  private options: RenderOptions;

  constructor(options: RenderOptions) {
    this.options = options;
  }

  render(ctx: CanvasRenderingContext2D, faces: DetectedFace[]): void {
    faces.forEach((face) => {
      if (this.options.showBoundingBox) {
        this.drawBoundingBox(ctx, face);
      }

      if (this.options.showLandmarks && face.landmarks) {
        this.drawLandmarks(ctx, face);
      }

      if (this.options.showMesh && face.landmarks) {
        this.drawFaceMesh(ctx, face);
      }

      if (this.options.showExpression && face.expression) {
        this.drawExpression(ctx, face);
      }

      if (this.options.showAlignment && face.alignment) {
        this.drawAlignment(ctx, face);
      }

      if (this.options.showFaceId) {
        this.drawFaceId(ctx, face);
      }
    });
  }

  private drawBoundingBox(ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    const { x, y, width, height, confidence } = face.box;

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    if (confidence !== undefined) {
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`${Math.round(confidence * 100)}%`, x, y - 8);
    }
  }

  private drawLandmarks(ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    if (!face.landmarks) return;

    const contours = face.landmarks.contours;

    this.drawContour(ctx, contours.faceOval, '#00FFFF', 2);
    this.drawContour(ctx, contours.leftEyebrow, '#FF00FF', 2);
    this.drawContour(ctx, contours.rightEyebrow, '#FF00FF', 2);
    this.drawContour(ctx, contours.leftEye, '#FFFF00', 2);
    this.drawContour(ctx, contours.rightEye, '#FFFF00', 2);
    this.drawContour(ctx, contours.noseBridge, '#FF8800', 2);
    this.drawContour(ctx, contours.noseTip, '#FF8800', 2);
    this.drawContour(ctx, contours.outerLips, '#FF0088', 3);
    this.drawContour(ctx, contours.innerLips, '#FF0088', 2);
  }

  private drawFaceMesh(ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    if (!face.landmarks) return;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    face.landmarks.positions.forEach((point) => {
      ctx.fillRect(point.x - 1, point.y - 1, 2, 2);
    });
  }

  private drawContour(ctx: CanvasRenderingContext2D, points: Point2D[], color: string, lineWidth: number): void {
    if (points.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
  }

  private drawExpression(ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    if (!face.expression) return;

    const { x, y, width } = face.box;
    const expressions = Object.entries(face.expression)
      .filter(([_, value]) => value > 0.1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y - 80, width, 75);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Expression:', x + 5, y - 60);

    expressions.forEach(([emotion, value], index) => {
      const barWidth = (width - 10) * value;
      const yPos = y - 45 + index * 20;

      ctx.fillStyle = this.getEmotionColor(emotion);
      ctx.fillRect(x + 5, yPos, barWidth, 15);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '11px Arial';
      ctx.fillText(`${emotion}: ${Math.round(value * 100)}%`, x + 8, yPos + 11);
    });
  }

  private getEmotionColor(emotion: string): string {
    const colors: Record<string, string> = {
      happy: '#FFD700',
      sad: '#4169E1',
      angry: '#DC143C',
      surprised: '#FF69B4',
      fearful: '#8B008B',
      disgusted: '#32CD32',
      neutral: '#808080',
    };
    return colors[emotion] || '#FFFFFF';
  }

  private drawAlignment(ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    if (!face.alignment) return;

    const { x, y, width } = face.box;
    const { angle, scale } = face.alignment;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x + width - 120, y, 115, 50);

    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Alignment:', x + width - 115, y + 15);
    ctx.fillText(`Angle: ${angle.toFixed(1)}°`, x + width - 115, y + 30);
    ctx.fillText(`Scale: ${scale.toFixed(2)}x`, x + width - 115, y + 45);
  }

  private drawFaceId(ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    const { x, y, width } = face.box;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y + 5, 80, 20);

    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 11px Arial';
    ctx.fillText(`ID: ${face.id.slice(0, 8)}`, x + 5, y + 18);
  }

  setOptions(options: Partial<RenderOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
