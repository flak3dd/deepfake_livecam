# Project File Structure

This document describes the reorganized file structure of the Deep Live Cam application.

## Directory Overview

```
src/
├── app/                           # Main application
│   └── App.tsx                    # Root application component
│
├── components/                    # React components (organized by feature)
│   ├── camera/                    # Camera-related components
│   │   ├── AdvancedVideoCanvas.tsx
│   │   ├── CameraControls.tsx
│   │   └── VideoCanvas.tsx
│   │
│   ├── face-processing/          # Face processing components
│   │   ├── AdvancedFaceControls.tsx
│   │   ├── FaceSwapControls.tsx
│   │   ├── RestorationControls.tsx
│   │   └── SourceFaceManager.tsx
│   │
│   ├── effects/                  # Effect controls
│   │   └── FilterControls.tsx
│   │
│   ├── gallery/                  # Media gallery
│   │   └── Gallery.tsx
│   │
│   ├── backend/                  # Backend integration
│   │   └── BackendFaceSwap.tsx
│   │
│   └── settings/                 # Settings and preferences
│       └── PerformanceSettings.tsx
│
├── lib/                          # Core libraries and utilities
│   ├── services/                 # External service integrations
│   │   ├── supabase.ts          # Supabase client configuration
│   │   └── faceProcessingService.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── videoFilters.ts      # Video filter utilities
│   │   ├── deviceDetection.ts   # Device detection utilities
│   │   └── performanceSettings.ts
│   │
│   ├── storage/                  # Storage management
│   │   └── faceSwapStorage.ts
│   │
│   └── faceProcessing/          # Face processing pipeline
│       ├── index.ts
│       ├── types.ts
│       ├── ProcessingPipeline.ts
│       ├── FaceApiDetector.ts
│       ├── FaceMeshDetector.ts
│       ├── FaceAlignmentProcessor.ts
│       ├── FaceEncoder.ts
│       ├── FaceSwapper.ts
│       ├── FaceRestoration.ts
│       ├── FaceRenderer.ts
│       ├── FaceEffectsProcessor.ts
│       └── ExpressionDetector.ts
│
├── styles/                       # Global styles
│   └── index.css
│
├── main.tsx                      # Application entry point
└── vite-env.d.ts                # Vite type definitions
```

## Component Organization

### Camera Components (`components/camera/`)
Components related to camera functionality, video capture, and canvas rendering.

### Face Processing Components (`components/face-processing/`)
Components for face detection, swapping, restoration, and related controls.

### Effects Components (`components/effects/`)
Components for applying visual effects and filters.

### Gallery Components (`components/gallery/`)
Components for viewing and managing captured media.

### Backend Components (`components/backend/`)
Components that integrate with backend services for server-side processing.

### Settings Components (`components/settings/`)
Components for managing application settings and user preferences.

## Library Organization

### Services (`lib/services/`)
External service integrations like Supabase and API clients.

### Utils (`lib/utils/`)
Utility functions for video processing, device detection, and performance settings.

### Storage (`lib/storage/`)
Storage management and data persistence utilities.

### Face Processing (`lib/faceProcessing/`)
Core face processing pipeline with detection, alignment, swapping, and rendering capabilities.

## Import Path Examples

### From App Component
```typescript
import { AdvancedVideoCanvas } from '../components/camera/AdvancedVideoCanvas';
import { FilterSettings } from '../lib/utils/videoFilters';
import { uploadMedia } from '../lib/services/supabase';
```

### From Component to Library
```typescript
import { supabase } from '../../lib/services/supabase';
import { FilterSettings } from '../../lib/utils/videoFilters';
import { ProcessingPipeline } from '../../lib/faceProcessing';
```

## Benefits of This Structure

1. **Clear Separation of Concerns**: Components are grouped by feature area
2. **Easier Navigation**: Related files are co-located
3. **Better Scalability**: Easy to add new features in their own directories
4. **Improved Maintainability**: Logical groupings make code easier to understand
5. **Simplified Imports**: Clear import paths that reflect the project structure
