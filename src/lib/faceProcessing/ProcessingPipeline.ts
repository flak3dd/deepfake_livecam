import { FaceProcessor, DetectedFace, ProcessingPipeline as PipelineConfig } from './types';
import { FaceMeshDetector } from './FaceMeshDetector';
import { FaceApiDetector } from './FaceApiDetector';
import { FaceAlignmentProcessor } from './FaceAlignmentProcessor';
import { ExpressionDetector } from './ExpressionDetector';
import { FaceEffectsProcessor, FaceEffectSettings } from './FaceEffectsProcessor';
import { FaceEncoder, FaceEncoding } from './FaceEncoder';
import { FaceSwapper, SwapOptions } from './FaceSwapper';
import { FaceRestoration, RestorationOptions } from './FaceRestoration';

export interface DeepFaceLiveSettings {
  faceSwap: {
    enabled: boolean;
    options: SwapOptions;
  };
  restoration: RestorationOptions;
}

export class FaceProcessingPipeline {
  private processors: FaceProcessor[] = [];
  private config: PipelineConfig;
  private isInitialized = false;
  private faceMeshDetector?: FaceMeshDetector;
  private faceEffectsProcessor?: FaceEffectsProcessor;
  private faceEncoder?: FaceEncoder;
  private faceSwapper?: FaceSwapper;
  private faceRestoration?: FaceRestoration;
  private deepFaceSettings?: DeepFaceLiveSettings;

  constructor(
    config: PipelineConfig,
    effectSettings: FaceEffectSettings,
    deepFaceSettings?: DeepFaceLiveSettings
  ) {
    this.config = config;
    this.deepFaceSettings = deepFaceSettings;
    this.effectSettings = effectSettings;
  }

  private effectSettings: FaceEffectSettings;

  private async setupPipeline(effectSettings: FaceEffectSettings): Promise<void> {
    this.processors = [];

    if (this.config.detection.enabled || this.config.landmarks.enabled) {
      let detector: FaceProcessor | null = null;

      try {
        console.log('Attempting to initialize MediaPipe Face Mesh...');
        detector = new FaceMeshDetector({
          enabled: true,
          options: { maxFaces: 5 },
        });
        await detector.initialize();
        console.log('MediaPipe Face Mesh initialized successfully');
        this.faceMeshDetector = detector as FaceMeshDetector;
      } catch (error) {
        console.warn('MediaPipe initialization failed, falling back to face-api.js:', error);
        try {
          detector = new FaceApiDetector({
            enabled: true,
            options: { maxFaces: 5 },
          });
          await detector.initialize();
          console.log('face-api.js initialized successfully as fallback');
        } catch (fallbackError) {
          console.error('All face detection methods failed:', fallbackError);
          throw new Error('Unable to initialize face detection. Please check your internet connection and try refreshing the page.');
        }
      }

      if (detector) {
        this.processors.push(detector);
      }
    }

    if (this.config.alignment.enabled) {
      this.processors.push(new FaceAlignmentProcessor(this.config.alignment));
    }

    if (this.config.expression.enabled) {
      this.processors.push(new ExpressionDetector(this.config.expression));
    }

    if (this.config.effects.enabled) {
      this.faceEffectsProcessor = new FaceEffectsProcessor(this.config.effects, effectSettings);
      this.processors.push(this.faceEffectsProcessor);
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.setupPipeline(this.effectSettings);

      const initPromises: Promise<void>[] = [];

      for (const processor of this.processors) {
        if (processor !== this.faceMeshDetector) {
          initPromises.push(processor.initialize());
        }
      }

      if (this.deepFaceSettings) {
        this.faceEncoder = new FaceEncoder();
        this.faceSwapper = new FaceSwapper();
        this.faceRestoration = new FaceRestoration();

        initPromises.push(this.faceEncoder.initialize());
        initPromises.push(this.faceSwapper.initialize());
        initPromises.push(this.faceRestoration.initialize());
      }

      await Promise.all(initPromises);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize processing pipeline:', error);
      throw error;
    }
  }

  async process(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Promise<DetectedFace[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    let faces: DetectedFace[] = [];

    for (const processor of this.processors) {
      if (processor.isEnabled()) {
        faces = await processor.process(canvas, ctx, faces);
      }
    }

    if (this.deepFaceSettings?.faceSwap.enabled && faces.length > 0 && this.faceSwapper) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      for (const face of faces) {
        if (face.detection) {
          let processedImage = await this.faceSwapper.swapFace(
            imageData,
            face.detection,
            this.deepFaceSettings.faceSwap.options
          );

          if (this.deepFaceSettings.restoration.enabled && this.faceRestoration) {
            processedImage = await this.faceRestoration.restore(
              processedImage,
              face.detection,
              this.deepFaceSettings.restoration
            );
          }

          ctx.putImageData(processedImage, 0, 0);
        }
      }
    }

    return faces;
  }

  updateEffectSettings(settings: FaceEffectSettings): void {
    if (this.faceEffectsProcessor) {
      this.faceEffectsProcessor.setEffectSettings(settings);
    }
  }

  updateDeepFaceSettings(settings: DeepFaceLiveSettings): void {
    this.deepFaceSettings = settings;
  }

  async setSourceFace(imageData: ImageData, detection: any): Promise<void> {
    if (!this.faceEncoder || !this.faceSwapper) {
      throw new Error('Face swapping is not enabled');
    }

    const encoding = await this.faceEncoder.extractEncoding(imageData, detection);
    this.faceSwapper.setSourceFace(encoding);
  }

  updateConfig(config: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  dispose(): void {
    this.processors.forEach((p) => p.dispose());
    this.processors = [];
    this.faceEncoder?.dispose();
    this.faceSwapper?.dispose();
    this.faceRestoration?.dispose();
    this.isInitialized = false;
  }

  getDetectedFaces(): DetectedFace[] {
    return [];
  }
}
