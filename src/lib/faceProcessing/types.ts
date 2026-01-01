export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

export interface FaceLandmarks {
  positions: Point3D[];
  contours: {
    jawOutline: Point3D[];
    leftEyebrow: Point3D[];
    rightEyebrow: Point3D[];
    noseBridge: Point3D[];
    noseTip: Point3D[];
    leftEye: Point3D[];
    rightEye: Point3D[];
    outerLips: Point3D[];
    innerLips: Point3D[];
    faceOval: Point3D[];
  };
}

export interface FaceExpression {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface FaceAlignment {
  angle: number;
  scale: number;
  translation: Point2D;
  alignedBox: BoundingBox;
}

export interface DetectedFace {
  id: string;
  box: BoundingBox;
  landmarks?: FaceLandmarks;
  expression?: FaceExpression;
  alignment?: FaceAlignment;
  age?: number;
  gender?: 'male' | 'female';
  timestamp: number;
}

export interface FaceProcessorConfig {
  enabled: boolean;
  options?: Record<string, any>;
}

export interface ProcessingPipeline {
  detection: FaceProcessorConfig;
  landmarks: FaceProcessorConfig;
  alignment: FaceProcessorConfig;
  expression: FaceProcessorConfig;
  segmentation: FaceProcessorConfig;
  effects: FaceProcessorConfig;
}

export abstract class FaceProcessor {
  protected config: FaceProcessorConfig;

  constructor(config: FaceProcessorConfig) {
    this.config = config;
  }

  abstract process(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    faces: DetectedFace[]
  ): Promise<DetectedFace[]>;

  abstract initialize(): Promise<void>;
  abstract dispose(): void;

  isEnabled(): boolean {
    return this.config.enabled;
  }
}
