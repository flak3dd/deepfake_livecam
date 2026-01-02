# Deep Live Cam

Professional live streaming application with advanced face detection, effects, and face swapping powered by AI.

## Features

- **Real-time Face Detection**: Multiple detection methods with automatic fallback
- **Video Filters**: Apply real-time filters and effects to your camera feed
- **Advanced Face Processing**: 468-point face mesh tracking, facial expressions, and alignment
- **Face Swapping**: AI-powered face swapping using Python backend with InsightFace
- **Face Restoration**: Enhance and restore face quality with denoising and sharpening
- **Media Gallery**: Save and manage photos and videos with Supabase storage
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

### Frontend (React + TypeScript + Vite)
- Real-time camera processing with HTML5 Canvas
- Face detection using MediaPipe Face Mesh (primary) and face-api.js (fallback)
- Video recording and photo capture
- Supabase integration for storage

### Backend (Python + FastAPI)
- High-performance face swapping with InsightFace
- Face restoration and enhancement
- REST API with CORS support
- Docker-ready deployment

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (for backend face swapping)
- Docker (optional, for backend deployment)

### Frontend Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FACE_PROCESSING_BACKEND_URL=http://localhost:8000
```

4. Run development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Backend Setup (Python Face Swapping)

The Python backend provides advanced face swapping capabilities using InsightFace.

#### Option 1: Local Development

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
python main.py
```

The backend API will be available at `http://localhost:8000`

**For detailed setup instructions, see:**
- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Complete backend setup guide
- [backend/QUICK_START.md](backend/QUICK_START.md) - Quick model download guide
- [backend/WINDOWS_GPU_SETUP.md](backend/WINDOWS_GPU_SETUP.md) - Windows GPU acceleration setup

#### GPU Acceleration (Recommended)

For 2-5x faster processing, enable GPU acceleration:

**Windows with NVIDIA GPU:**
```cmd
cd backend
setup_gpu.bat
```
See [backend/WINDOWS_GPU_SETUP.md](backend/WINDOWS_GPU_SETUP.md) for complete CUDA setup instructions.

**Linux with NVIDIA GPU:**
```bash
cd backend
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118
```

**Verify GPU support:**
```bash
python verify_gpu.py
```

#### Option 2: Docker Deployment

1. Navigate to backend directory:
```bash
cd backend
```

2. Build and run with Docker Compose:
```bash
docker-compose up -d
```

3. Check logs:
```bash
docker-compose logs -f
```

## Usage

### Basic Camera
- Simple camera feed with face detection
- Apply video filters (grayscale, sepia, blur, etc.)
- Take photos and record videos

### Advanced Face
- 468-point face mesh tracking
- Facial expression detection
- Face alignment visualization
- Real-time face effects

### DeepFace Live
- Browser-based face swapping (limited quality)
- Upload source face image
- Real-time face swap on webcam
- Face restoration options

### Backend Swap (Recommended)
- High-quality AI face swapping
- Upload source face and target image
- Adjustable blend strength and color correction
- Download processed results

## API Documentation

### Python Backend Endpoints

#### Health Check
```
GET /health
```

Returns backend status and model initialization state.

#### Face Swap
```
POST /api/face-swap
```

Parameters:
- `source_face` (file): Source face image
- `target_image` (file): Target image
- `blend_strength` (float): 0.0-1.0 (default: 0.8)
- `color_correction` (bool): Enable/disable (default: true)
- `face_scale` (float): Scale factor (default: 1.0)

Returns: PNG image with swapped face

#### Face Restoration
```
POST /api/face-restore
```

Parameters:
- `image` (file): Image to restore
- `strength` (float): 0.0-1.0 (default: 0.5)
- `denoise_level` (float): 0.0-1.0 (default: 0.3)
- `sharpen_amount` (float): 0.0-1.0 (default: 0.2)
- `enhance_details` (bool): Enable/disable (default: true)

Returns: PNG image with restored face

## Deployment

### Frontend Deployment (Netlify/Vercel)

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

3. Set environment variables in your hosting dashboard

### Backend Deployment

#### Cloud GPU (Cudo Compute) - Recommended for Production

Deploy to cost-effective cloud GPUs for 2-5x faster processing:

```bash
cd backend
export CUDO_API_KEY="your-api-key"
python deploy_cudo.py
```

Features:
- GPU-accelerated processing (RTX 3090, RTX 4090, A100)
- Automatic Docker deployment
- $0.50-$4.00/hour based on GPU type
- Easy scaling and monitoring

**Documentation:** See [backend/CUDO_COMPUTE_DEPLOYMENT.md](backend/CUDO_COMPUTE_DEPLOYMENT.md)

**Get Started:** Create account at https://compute.cudo.org/

#### Cloud Run / App Engine
```bash
gcloud run deploy face-processor --source .
```

#### AWS EC2 / DigitalOcean
1. SSH into your server
2. Install Docker and Docker Compose
3. Clone repository
4. Run `docker-compose up -d`

#### Railway / Render
- Connect GitHub repository
- Set build command: `cd backend && pip install -r requirements.txt`
- Set start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

## Troubleshooting

### Face Detection Not Loading
- Check internet connection (models load from CDN)
- Open browser console for detailed error messages
- App will automatically try fallback detector
- Refresh the page to retry

### Backend Connection Failed
- Ensure Python backend is running
- Check `VITE_FACE_PROCESSING_BACKEND_URL` in `.env`
- Verify CORS configuration in backend
- Check backend logs for errors

### Out of Memory Errors
- Reduce video resolution
- Close other browser tabs
- Use a device with more RAM
- For backend: reduce image size before processing

## Development

### Project Structure
```
├── backend/                 # Python FastAPI backend
│   ├── main.py             # API endpoints
│   ├── face_swapper.py     # Face swapping logic
│   ├── face_restoration.py # Face restoration
│   ├── Dockerfile          # Docker configuration
│   └── requirements.txt    # Python dependencies
├── src/
│   ├── components/         # React components
│   ├── lib/               # Utilities and services
│   │   ├── faceProcessing/ # Face detection modules
│   │   ├── faceProcessingService.ts # Backend API client
│   │   └── supabase.ts    # Supabase client
│   └── App.tsx            # Main application
├── public/                # Static assets
└── supabase/              # Database migrations
```

### Build Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Technologies

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Supabase
- MediaPipe Face Mesh
- TensorFlow.js
- face-api.js

### Backend
- Python 3.10
- FastAPI
- InsightFace
- OpenCV
- ONNX Runtime
- NumPy

## License

This project uses InsightFace models which have specific license terms. Please review InsightFace licensing before commercial use.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Open an issue on GitHub
- Review backend logs for detailed errors
