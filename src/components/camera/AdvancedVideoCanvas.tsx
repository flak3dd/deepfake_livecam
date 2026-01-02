import React, { useEffect, useRef, useState } from 'react';
import { applyFilter, FilterSettings } from '../../lib/utils/videoFilters';
import {
  FaceProcessingPipeline,
  ProcessingPipeline,
  FaceRenderer,
  RenderOptions,
  FaceEffectSettings,
  DetectedFace,
  DeepFaceLiveSettings,
} from '../../lib/faceProcessing';

interface AdvancedVideoCanvasProps {
  filter: FilterSettings;
  pipelineConfig: ProcessingPipeline;
  renderOptions: RenderOptions;
  faceEffects: FaceEffectSettings;
  deepFaceSettings?: DeepFaceLiveSettings;
  sourceFaceData?: { imageData: ImageData; detection: any } | null;
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
  onFacesDetected?: (faces: DetectedFace[]) => void;
}

export const AdvancedVideoCanvas: React.FC<AdvancedVideoCanvasProps> = ({
  filter,
  pipelineConfig,
  renderOptions,
  faceEffects,
  deepFaceSettings,
  sourceFaceData,
  onCanvasRef,
  onFacesDetected,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const pipelineRef = useRef<FaceProcessingPipeline | null>(null);
  const rendererRef = useRef<FaceRenderer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');

  useEffect(() => {
    const initializePipeline = async () => {
      try {
        setLoadingStatus('Loading face processing models...');
        pipelineRef.current = new FaceProcessingPipeline(
          pipelineConfig,
          faceEffects,
          deepFaceSettings
        );
        rendererRef.current = new FaceRenderer(renderOptions);

        await pipelineRef.current.initialize();
        setIsInitialized(true);
        setLoadingStatus('');
      } catch (err) {
        console.error('Failed to initialize face processing pipeline:', err);
        setError('Failed to load face processing models');
      }
    };

    initializePipeline();

    return () => {
      if (pipelineRef.current) {
        pipelineRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (pipelineRef.current) {
      pipelineRef.current.updateEffectSettings(faceEffects);
    }
  }, [faceEffects]);

  useEffect(() => {
    if (pipelineRef.current && deepFaceSettings) {
      pipelineRef.current.updateDeepFaceSettings(deepFaceSettings);
    }
  }, [deepFaceSettings]);

  useEffect(() => {
    const setSourceFace = async () => {
      if (pipelineRef.current && sourceFaceData) {
        try {
          await pipelineRef.current.setSourceFace(
            sourceFaceData.imageData,
            sourceFaceData.detection
          );
        } catch (err) {
          console.error('Failed to set source face:', err);
        }
      }
    };

    setSourceFace();
  }, [sourceFaceData]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setOptions(renderOptions);
    }
  }, [renderOptions]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        setLoadingStatus('Accessing camera...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setLoadingStatus('');
          };
        }
      } catch (err) {
        setError('Failed to access camera');
        console.error('Camera access error:', err);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    onCanvasRef?.(canvasRef.current);
  }, [onCanvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video || !isInitialized || !pipelineRef.current || !rendererRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastFrameTime = 0;
    const targetFPS = 30;
    const frameDelay = 1000 / targetFPS;

    const drawFrame = async (currentTime: number) => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (currentTime - lastFrameTime >= frameDelay) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          applyFilter(canvas, ctx, video, filter);

          try {
            const faces = await pipelineRef.current!.process(canvas, ctx);

            rendererRef.current!.render(ctx, faces);

            if (onFacesDetected) {
              onFacesDetected(faces);
            }
          } catch (err) {
            console.error('Face processing error:', err);
          }

          lastFrameTime = currentTime;
        }
      }

      animationRef.current = requestAnimationFrame(drawFrame);
    };

    animationRef.current = requestAnimationFrame(drawFrame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [filter, isInitialized, onFacesDetected]);

  return (
    <div className="relative w-full max-w-4xl">
      <video
        ref={videoRef}
        className="hidden"
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg shadow-lg bg-black"
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <p className="text-red-500 text-center">{error}</p>
        </div>
      )}
      {loadingStatus && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">{loadingStatus}</p>
          </div>
        </div>
      )}
    </div>
  );
};
