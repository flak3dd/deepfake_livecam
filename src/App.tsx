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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none"></div>

      <div className="relative">
        <header className="backdrop-blur-xl bg-gray-900/50 border-b border-gray-800/50 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl blur-lg opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-cyan-500 to-teal-500 p-2.5 rounded-xl">
                    <Camera className="text-white" size={28} />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Deep Live Cam
                  </h1>
                  <p className="text-sm text-gray-400 mt-0.5">Professional AI-Powered Face Processing</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-gray-300">Live</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <nav className="mb-8">
            <div className="bg-gray-900/50 backdrop-blur-lg rounded-2xl border border-gray-800/50 p-2 inline-flex gap-2 shadow-2xl">
              {[
                { id: 'camera', icon: Camera, label: 'Camera' },
                { id: 'advanced', icon: Sparkles, label: 'Advanced' },
                { id: 'deepface', icon: Users, label: 'DeepFace' },
                { id: 'backend', icon: Cpu, label: 'Backend' },
                { id: 'gallery', icon: Grid, label: 'Gallery' },
                { id: 'settings', icon: Settings, label: 'Settings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <tab.icon className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`} size={18} />
                    <span className="text-sm">{tab.label}</span>
                  </div>
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 opacity-20 blur-xl"></div>
                  )}
                </button>
              ))}
            </div>
          </nav>

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
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg">
                <Grid className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">Your Media Gallery</h2>
            </div>
            <Gallery userId={userId} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <PerformanceSettingsComponent userId={userId} />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default App;
