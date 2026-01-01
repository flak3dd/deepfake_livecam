import React, { useState, useRef, useEffect } from 'react';
import { AdvancedVideoCanvas } from './components/AdvancedVideoCanvas';
import { CameraControls } from './components/CameraControls';
import { FilterControls } from './components/FilterControls';
import { AdvancedFaceControls } from './components/AdvancedFaceControls';
import { FaceSwapControls } from './components/FaceSwapControls';
import { RestorationControls } from './components/RestorationControls';
import { SourceFaceManager } from './components/SourceFaceManager';
import { Gallery } from './components/Gallery';
import { BackendFaceSwap } from './components/BackendFaceSwap';
import { PerformanceSettingsComponent } from './components/PerformanceSettings';
import { FilterSettings } from './lib/videoFilters';
import { uploadMedia } from './lib/supabase';
import { Camera, Grid, Sparkles, Users, Cpu, Settings } from 'lucide-react';
import {
  ProcessingPipeline,
  RenderOptions,
  DetectedFace,
  SwapOptions,
  RestorationOptions,
} from './lib/faceProcessing';
import { FaceEffectSettings } from './lib/faceProcessing/FaceEffectsProcessor';

function App() {
  const [activeTab, setActiveTab] = useState<'camera' | 'gallery' | 'advanced' | 'deepface' | 'backend' | 'settings'>('camera');
  const [filter, setFilter] = useState<FilterSettings>({ type: 'none', value: 0 });
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number>();
  const [userId] = useState<string>('demo-user');
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);

  const [pipelineConfig, setPipelineConfig] = useState<ProcessingPipeline>({
    detection: { enabled: true },
    landmarks: { enabled: true },
    alignment: { enabled: true },
    expression: { enabled: true },
    segmentation: { enabled: false },
    effects: { enabled: true },
  });

  const [renderOptions, setRenderOptions] = useState<RenderOptions>({
    showBoundingBox: true,
    showLandmarks: true,
    showMesh: false,
    showExpression: true,
    showAlignment: true,
    showFaceId: false,
  });

  const [faceEffects, setFaceEffects] = useState<FaceEffectSettings>({
    type: 'none',
    intensity: 0.5,
  });

  const [swapOptions, setSwapOptions] = useState<SwapOptions>({
    blendStrength: 0.8,
    colorCorrection: true,
    faceScale: 1.0,
    erasingThreshold: 0.5,
  });

  const [restorationOptions, setRestorationOptions] = useState<RestorationOptions>({
    enabled: false,
    strength: 0.5,
    denoiseLevel: 0.3,
    sharpenAmount: 0.2,
    enhanceDetails: true,
  });

  const [faceSwapEnabled, setFaceSwapEnabled] = useState(false);
  const [hasSourceFace, setHasSourceFace] = useState(false);
  const deepFaceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceFaceDataRef = useRef<{ imageData: ImageData; detection: any } | null>(null);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleTakePhoto = () => {
    if (!canvasRef) return;

    canvasRef.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await uploadMedia(userId, blob, `photo.png`, 'photo');
        alert('Photo saved to gallery!');
      } catch (error) {
        console.error('Failed to save photo:', error);
        alert('Failed to save photo');
      }
    });
  };

  const handleStartRecording = async () => {
    if (!canvasRef) return;

    try {
      const stream = canvasRef.captureStream(30);
      const options = { mimeType: 'video/webm;codecs=vp9' };

      try {
        mediaRecorderRef.current = new MediaRecorder(stream, options);
      } catch {
        mediaRecorderRef.current = new MediaRecorder(stream);
      }

      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      recordedChunksRef.current = [];

      try {
        await uploadMedia(userId, blob, `video.webm`, 'video');
        alert('Video saved to gallery!');
        setRecordingTime(0);
      } catch (error) {
        console.error('Failed to save video:', error);
        alert('Failed to save video');
      }
    };
  };

  const handleSourceFaceSelected = async (imageData: ImageData, detection: any) => {
    sourceFaceDataRef.current = { imageData, detection };
    setHasSourceFace(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Camera className="text-blue-500" size={36} />
            Deep Live Cam
          </h1>
          <p className="text-slate-400">Professional live streaming with effects and face detection</p>
        </div>

        <div className="flex gap-2 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('camera')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'camera'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Camera className="inline mr-2" size={20} />
            Basic Camera
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'advanced'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Sparkles className="inline mr-2" size={20} />
            Advanced Face
          </button>
          <button
            onClick={() => setActiveTab('deepface')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'deepface'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Users className="inline mr-2" size={20} />
            DeepFace Live
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'backend'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Cpu className="inline mr-2" size={20} />
            Backend Swap
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'gallery'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Grid className="inline mr-2" size={20} />
            Gallery
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'settings'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Settings className="inline mr-2" size={20} />
            Performance
          </button>
        </div>

        {activeTab === 'camera' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <AdvancedVideoCanvas
                filter={filter}
                pipelineConfig={{
                  detection: { enabled: true },
                  landmarks: { enabled: false },
                  alignment: { enabled: false },
                  expression: { enabled: false },
                  segmentation: { enabled: false },
                  effects: { enabled: false },
                }}
                renderOptions={{
                  showBoundingBox: true,
                  showLandmarks: false,
                  showMesh: false,
                  showExpression: false,
                  showAlignment: false,
                  showFaceId: false,
                }}
                faceEffects={{ type: 'none', intensity: 0 }}
                onCanvasRef={setCanvasRef}
                onFacesDetected={() => {}}
              />
            </div>

            <div className="flex justify-center">
              <FilterControls
                filter={filter}
                onFilterChange={setFilter}
                enableFaceDetection={true}
                onFaceDetectionChange={() => {}}
              />
            </div>

            <div className="flex justify-center">
              <CameraControls
                canvasRef={canvasRef}
                isRecording={isRecording}
                onTakePhoto={handleTakePhoto}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                recordingTime={recordingTime}
              />
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <AdvancedVideoCanvas
                filter={filter}
                pipelineConfig={pipelineConfig}
                renderOptions={renderOptions}
                faceEffects={faceEffects}
                onCanvasRef={setCanvasRef}
                onFacesDetected={setDetectedFaces}
              />
            </div>

            <div className="flex justify-center">
              <AdvancedFaceControls
                pipelineConfig={pipelineConfig}
                renderOptions={renderOptions}
                faceEffects={faceEffects}
                detectedFaces={detectedFaces}
                onPipelineConfigChange={(config) =>
                  setPipelineConfig({ ...pipelineConfig, ...config })
                }
                onRenderOptionsChange={(options) =>
                  setRenderOptions({ ...renderOptions, ...options })
                }
                onFaceEffectsChange={setFaceEffects}
              />
            </div>

            <div className="flex justify-center">
              <FilterControls
                filter={filter}
                onFilterChange={setFilter}
                enableFaceDetection={true}
                onFaceDetectionChange={() => {}}
              />
            </div>

            <div className="flex justify-center">
              <CameraControls
                canvasRef={canvasRef}
                isRecording={isRecording}
                onTakePhoto={handleTakePhoto}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                recordingTime={recordingTime}
              />
            </div>
          </div>
        )}

        {activeTab === 'deepface' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AdvancedVideoCanvas
                  filter={filter}
                  pipelineConfig={{
                    detection: { enabled: true },
                    landmarks: { enabled: true },
                    alignment: { enabled: false },
                    expression: { enabled: false },
                    segmentation: { enabled: false },
                    effects: { enabled: false },
                  }}
                  renderOptions={{
                    showBoundingBox: false,
                    showLandmarks: false,
                    showMesh: false,
                    showExpression: false,
                    showAlignment: false,
                    showFaceId: false,
                  }}
                  faceEffects={{ type: 'none', intensity: 0 }}
                  deepFaceSettings={{
                    faceSwap: {
                      enabled: faceSwapEnabled,
                      options: swapOptions,
                    },
                    restoration: restorationOptions,
                  }}
                  sourceFaceData={sourceFaceDataRef.current}
                  onCanvasRef={(canvas) => {
                    setCanvasRef(canvas);
                    deepFaceCanvasRef.current = canvas;
                  }}
                  onFacesDetected={setDetectedFaces}
                />

                <div className="mt-6 flex justify-center">
                  <CameraControls
                    canvasRef={canvasRef}
                    isRecording={isRecording}
                    onTakePhoto={handleTakePhoto}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                    recordingTime={recordingTime}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <SourceFaceManager onSourceFaceSelected={handleSourceFaceSelected} />

                <FaceSwapControls
                  enabled={faceSwapEnabled}
                  onToggle={setFaceSwapEnabled}
                  options={swapOptions}
                  onOptionsChange={setSwapOptions}
                  onSourceFaceUpload={() => {}}
                  hasSourceFace={hasSourceFace}
                />

                <RestorationControls
                  options={restorationOptions}
                  onOptionsChange={setRestorationOptions}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backend' && (
          <div className="max-w-4xl mx-auto">
            <BackendFaceSwap />
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Media Gallery</h2>
            <Gallery userId={userId} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto">
            <PerformanceSettingsComponent userId={userId} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
