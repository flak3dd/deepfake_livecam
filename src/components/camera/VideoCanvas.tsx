import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { applyFilter, FilterSettings } from '../../lib/utils/videoFilters';

interface VideoCanvasProps {
  filter: FilterSettings;
  enableFaceDetection: boolean;
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  filter,
  enableFaceDetection,
  onCanvasRef,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Failed to load face detection models:', err);
        setError('Face detection models failed to load');
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
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

    if (!canvas || !video || !modelsLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = async () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        applyFilter(canvas, ctx, video, filter);

        if (enableFaceDetection) {
          try {
            const detections = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions());
            const landmarks = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

            detections.forEach((detection) => {
              const { x, y, width, height } = detection.detection.box;

              ctx.strokeStyle = '#00FF00';
              ctx.lineWidth = 2;
              ctx.strokeRect(x, y, width, height);

              ctx.fillStyle = '#00FF00';
              ctx.font = '12px Arial';
              ctx.fillText(
                `Confidence: ${Math.round(detection.detection.score * 100)}%`,
                x,
                y - 5
              );
            });

            landmarks.forEach((face) => {
              face.landmarks.positions.forEach((point, index) => {
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
              });
            });
          } catch (err) {
            console.error('Face detection error:', err);
          }
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
  }, [filter, enableFaceDetection, modelsLoaded]);

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
      {!modelsLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <p className="text-white">Loading face detection models...</p>
        </div>
      )}
    </div>
  );
};
