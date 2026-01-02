import { useState, useRef, useEffect } from 'react';
import { Upload, X, User } from 'lucide-react';
import * as faceDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';

interface SourceFaceManagerProps {
  onSourceFaceSelected: (imageData: ImageData, detection: any) => Promise<void>;
}

export function SourceFaceManager({ onSourceFaceSelected }: SourceFaceManagerProps) {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<faceDetection.FaceLandmarksDetector | null>(null);

  useEffect(() => {
    const initDetector = async () => {
      try {
        const model = faceDetection.SupportedModels.MediaPipeFaceMesh;
        const detector = await faceDetection.createDetector(model, {
          runtime: 'tfjs',
          refineLandmarks: true,
        });
        detectorRef.current = detector;
      } catch (err) {
        console.error('Failed to initialize face detector:', err);
      }
    };

    initDetector();

    return () => {
      detectorRef.current?.dispose();
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const imageUrl = URL.createObjectURL(file);
      setSourceImage(imageUrl);

      const img = new Image();
      img.src = imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      if (detectorRef.current) {
        const faces = await detectorRef.current.estimateFaces(canvas);

        if (faces.length === 0) {
          setError('No face detected in the image. Please upload an image with a clear face.');
          setSourceImage(null);
          setIsProcessing(false);
          return;
        }

        const face = faces[0];
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const box = face.box;
        const detection = {
          box: {
            x: box.xMin,
            y: box.yMin,
            width: box.width,
            height: box.height,
          },
          landmarks: face.keypoints.map((kp: any) => ({
            x: kp.x,
            y: kp.y,
            z: kp.z,
          })),
          score: 1.0,
        };

        await onSourceFaceSelected(imageData, detection);
      }

      setIsProcessing(false);
    } catch (err) {
      console.error('Failed to process source face:', err);
      setError('Failed to process the image. Please try another image.');
      setSourceImage(null);
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    setSourceImage(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Source Face</h3>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!sourceImage ? (
        <label className="flex flex-col items-center justify-center w-full h-64 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Upload className="w-12 h-12 text-gray-400" />
            <div className="text-center">
              <span className="text-sm font-medium text-gray-900">Upload Source Face</span>
              <p className="text-xs text-gray-500 mt-1">
                Click to select an image with a clear, frontal face
              </p>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="hidden"
          />
        </label>
      ) : (
        <div className="relative">
          <img
            src={sourceImage}
            alt="Source face"
            className="w-full h-64 object-cover rounded-lg"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2 left-2 px-3 py-1 bg-green-500 text-white text-sm rounded-full">
            Face Detected
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm text-gray-600">Processing face...</span>
        </div>
      )}
    </div>
  );
}
