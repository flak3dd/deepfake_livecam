import { FaceProcessor, DetectedFace, FaceProcessorConfig } from './types';

export type FaceEffectType =
  | 'none'
  | 'faceMorph'
  | 'faceBlur'
  | 'facePixelate'
  | 'faceGlow'
  | 'faceDistort'
  | 'bigEyes'
  | 'slimFace'
  | 'beautify';

export interface FaceEffectSettings {
  type: FaceEffectType;
  intensity: number;
}

export class FaceEffectsProcessor extends FaceProcessor {
  private effectSettings: FaceEffectSettings;

  constructor(config: FaceProcessorConfig, effectSettings: FaceEffectSettings) {
    super(config);
    this.effectSettings = effectSettings;
  }

  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  async process(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    faces: DetectedFace[]
  ): Promise<DetectedFace[]> {
    if (!this.isEnabled() || this.effectSettings.type === 'none') {
      return faces;
    }

    faces.forEach((face) => {
      this.applyEffect(canvas, ctx, face);
    });

    return faces;
  }

  private applyEffect(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    switch (this.effectSettings.type) {
      case 'faceBlur':
        this.applyFaceBlur(ctx, face);
        break;
      case 'facePixelate':
        this.applyFacePixelate(ctx, face);
        break;
      case 'faceGlow':
        this.applyFaceGlow(ctx, face);
        break;
      case 'faceDistort':
        this.applyFaceDistort(ctx, face);
        break;
      case 'bigEyes':
        this.applyBigEyes(ctx, face);
        break;
      case 'slimFace':
        this.applySlimFace(ctx, face);
        break;
      case 'beautify':
        this.applyBeautify(ctx, face);
        break;
    }
  }

  private applyFaceBlur(ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    const { x, y, width, height } = face.box;
    const blurAmount = Math.round(this.effectSettings.intensity * 20);

    if (blurAmount === 0) return;

    ctx.save();
    ctx.filter = `blur(${blurAmount}px)`;

    const imageData = ctx.getImageData(x, y, width, height);
    ctx.putImageData(imageData, x, y);

    ctx.restore();
  }

  private applyFacePixelate(ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    const { x, y, width, height } = face.box;
    const pixelSize = Math.max(1, Math.round(this.effectSettings.intensity * 20));

    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;

    for (let py = 0; py < height; py += pixelSize) {
      for (let px = 0; px < width; px += pixelSize) {
        const i = (py * width + px) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
          for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
            const pi = ((py + dy) * width + (px + dx)) * 4;
            data[pi] = r;
            data[pi + 1] = g;
            data[pi + 2] = b;
          }
        }
      }
    }

    ctx.putImageData(imageData, x, y);
  }

  private applyFaceGlow(ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    const { x, y, width, height } = face.box;
    const intensity = this.effectSettings.intensity;

    ctx.save();
    ctx.shadowBlur = intensity * 30;
    ctx.shadowColor = `rgba(255, 255, 255, ${intensity * 0.8})`;

    const imageData = ctx.getImageData(x, y, width, height);
    ctx.putImageData(imageData, x, y);

    ctx.restore();
  }

  private applyFaceDistort(ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    if (!face.landmarks) return;

    const { x, y, width, height } = face.box;
    const intensity = this.effectSettings.intensity * 0.3;

    const imageData = ctx.getImageData(x, y, width, height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.putImageData(imageData, 0, 0);

    const time = Date.now() * 0.001;
    const waveX = Math.sin(time) * intensity * width;
    const waveY = Math.cos(time) * intensity * height;

    ctx.save();
    ctx.clearRect(x, y, width, height);
    ctx.drawImage(tempCanvas, x + waveX, y + waveY, width, height);
    ctx.restore();
  }

  private applyBigEyes(ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    if (!face.landmarks) return;

    const leftEye = face.landmarks.contours.leftEye;
    const rightEye = face.landmarks.contours.rightEye;

    if (leftEye.length === 0 || rightEye.length === 0) return;

    const intensity = this.effectSettings.intensity;

    this.enlargeEye(ctx, leftEye, intensity);
    this.enlargeEye(ctx, rightEye, intensity);
  }

  private enlargeEye(ctx: CanvasRenderingContext2D, eyePoints: any[], intensity: number): void {
    const centerX = eyePoints.reduce((sum, p) => sum + p.x, 0) / eyePoints.length;
    const centerY = eyePoints.reduce((sum, p) => sum + p.y, 0) / eyePoints.length;

    const radius = Math.max(
      ...eyePoints.map((p) => Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2)))
    );

    const enlargedRadius = radius * (1 + intensity * 0.5);

    const size = enlargedRadius * 2;
    const imageData = ctx.getImageData(
      centerX - enlargedRadius,
      centerY - enlargedRadius,
      size,
      size
    );

    ctx.save();
    ctx.clearRect(centerX - enlargedRadius, centerY - enlargedRadius, size, size);
    ctx.drawImage(
      ctx.canvas,
      centerX - radius,
      centerY - radius,
      radius * 2,
      radius * 2,
      centerX - enlargedRadius,
      centerY - enlargedRadius,
      size,
      size
    );
    ctx.restore();
  }

  private applySlimFace(ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    if (!face.landmarks) return;

    const { x, y, width, height } = face.box;
    const intensity = this.effectSettings.intensity * 0.3;

    const newWidth = width * (1 - intensity);
    const offsetX = (width - newWidth) / 2;

    const imageData = ctx.getImageData(x, y, width, height);
    ctx.clearRect(x, y, width, height);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, x + offsetX, y, newWidth, height);
  }

  private applyBeautify(ctx: CanvasRenderingContext2D, face: DetectedFace): void {
    const { x, y, width, height } = face.box;
    const intensity = this.effectSettings.intensity;

    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + intensity * 20);
      data[i + 1] = Math.min(255, data[i + 1] + intensity * 15);
      data[i + 2] = Math.min(255, data[i + 2] + intensity * 10);
    }

    ctx.putImageData(imageData, x, y);

    ctx.save();
    ctx.filter = `blur(${intensity * 2}px)`;
    ctx.globalAlpha = intensity * 0.3;
    ctx.drawImage(ctx.canvas, x, y, width, height, x, y, width, height);
    ctx.restore();
  }

  setEffectSettings(settings: FaceEffectSettings): void {
    this.effectSettings = settings;
  }

  dispose(): void {}
}
