import os
import logging
from pathlib import Path
from typing import Optional
import torch
import insightface
from insightface.app import FaceAnalysis
from gfpgan import GFPGANer
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer

logger = logging.getLogger(__name__)

class ModelManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        backend_dir = Path(__file__).parent
        self.models_dir = backend_dir / 'models'
        self.models_dir.mkdir(parents=True, exist_ok=True)

        os.environ['INSIGHTFACE_ROOT'] = str(self.models_dir)

        self.face_analysis = None
        self.face_swapper = None
        self.gfpgan_restorer = None
        self.device = self._get_best_device()
        self.use_mps = self.device == 'mps'

        logger.info(f"Using device: {self.device}")
        if self.use_mps:
            logger.info("Apple Silicon detected - Metal Performance Shaders enabled")
        self._initialized = True

    def _get_best_device(self) -> str:
        if torch.cuda.is_available():
            return 'cuda'
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            return 'mps'
        else:
            return 'cpu'

    def _get_execution_providers(self):
        """Get ONNX Runtime execution providers with fallback support"""
        if self.device == 'cuda':
            return ['CUDAExecutionProvider', 'CPUExecutionProvider']
        elif self.device == 'mps':
            logger.info("Apple Silicon detected - attempting CoreML provider with CPU fallback")
            return ['CPUExecutionProvider']
        else:
            return ['CPUExecutionProvider']

    def _get_ctx_id(self):
        """Get context ID for InsightFace initialization"""
        return 0 if self.device == 'cuda' else -1

    def _verify_buffalo_models(self) -> bool:
        """Check if buffalo_l models are downloaded"""
        buffalo_path = self.models_dir / 'models' / 'buffalo_l'
        if buffalo_path.exists():
            logger.info(f"Buffalo_l models found at: {buffalo_path}")
            return True
        logger.warning(f"Buffalo_l models not found at: {buffalo_path}")
        return False

    async def get_face_analysis(self) -> FaceAnalysis:
        if self.face_analysis is None:
            logger.info("Loading InsightFace analysis model (buffalo_l)...")
            logger.info(f"Models directory: {self.models_dir}")
            logger.info(f"INSIGHTFACE_ROOT: {os.environ.get('INSIGHTFACE_ROOT')}")

            providers = self._get_execution_providers()
            ctx_id = self._get_ctx_id()

            logger.info(f"Using ONNX providers: {providers}")
            logger.info(f"Using context ID: {ctx_id}")

            try:
                self.face_analysis = FaceAnalysis(
                    name='buffalo_l',
                    providers=providers,
                    root=str(self.models_dir)
                )
                self.face_analysis.prepare(ctx_id=ctx_id, det_size=(640, 640))
                logger.info("Face analysis model loaded successfully")
            except AssertionError as e:
                logger.error(f"Model assertion failed - models may not be downloaded: {e}")
                logger.info("Attempting to download buffalo_l models...")

                try:
                    self.face_analysis = FaceAnalysis(
                        name='buffalo_l',
                        providers=['CPUExecutionProvider'],
                        root=str(self.models_dir),
                        allowed_modules=['detection', 'recognition']
                    )
                    self.face_analysis.prepare(ctx_id=-1, det_size=(640, 640))
                    logger.info("Face analysis model loaded successfully with CPU and auto-download")
                except Exception as e2:
                    logger.error(f"Failed to download models: {e2}")
                    raise Exception(
                        f"Could not load buffalo_l models. Please ensure:\n"
                        f"1. Internet connection is available for model download\n"
                        f"2. Directory {self.models_dir} is writable\n"
                        f"3. Sufficient disk space is available (~2GB)\n"
                        f"Original error: {e2}"
                    )
            except Exception as e:
                logger.error(f"Failed to load face analysis with providers {providers}: {e}")
                logger.info("Falling back to CPU-only execution")

                try:
                    self.face_analysis = FaceAnalysis(
                        name='buffalo_l',
                        providers=['CPUExecutionProvider'],
                        root=str(self.models_dir)
                    )
                    self.face_analysis.prepare(ctx_id=-1, det_size=(640, 640))
                    logger.info("Face analysis model loaded successfully with CPU fallback")
                except Exception as e2:
                    logger.error(f"CPU fallback also failed: {e2}")
                    raise

        return self.face_analysis

    async def get_face_swapper(self):
        if self.face_swapper is None:
            logger.info("Loading InsightFace swapper model (inswapper_128.onnx)...")

            providers = self._get_execution_providers()
            logger.info(f"Face swapper using ONNX providers: {providers}")

            try:
                self.face_swapper = insightface.model_zoo.get_model(
                    'inswapper_128.onnx',
                    download=True,
                    download_zip=True,
                    providers=providers
                )
                logger.info("Face swapper model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load face swapper with providers {providers}: {e}")

                try:
                    logger.info("Falling back to CPU-only execution for face swapper")
                    self.face_swapper = insightface.model_zoo.get_model(
                        'inswapper_128.onnx',
                        download=True,
                        download_zip=True,
                        providers=['CPUExecutionProvider']
                    )
                    logger.info("Face swapper model loaded successfully with CPU fallback")
                except Exception as e2:
                    logger.error(f"CPU fallback also failed: {e2}")
                    logger.info("Attempting to load from local file...")
                    model_path = self.models_dir / 'inswapper_128.onnx'
                    if model_path.exists():
                        self.face_swapper = insightface.model_zoo.get_model(
                            str(model_path),
                            providers=['CPUExecutionProvider']
                        )
                        logger.info("Face swapper loaded from local file")
                    else:
                        raise Exception("Could not load face swapper model. Please download manually.")

        return self.face_swapper

    async def get_gfpgan_restorer(self) -> GFPGANer:
        if self.gfpgan_restorer is None:
            logger.info("Loading GFPGAN v1.4 face restoration model...")
            try:
                gfpgan_model_path = self.models_dir / 'GFPGANv1.4.pth'

                if gfpgan_model_path.exists():
                    logger.info(f"Using local GFPGAN model: {gfpgan_model_path}")
                    gfpgan_path = str(gfpgan_model_path)
                else:
                    logger.info("Local GFPGAN model not found, will download from GitHub")
                    gfpgan_path = 'https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth'

                bg_upsampler = None
                if self.device in ['cuda', 'mps']:
                    try:
                        realesrgan_model_path = self.models_dir / 'RealESRGAN_x2plus.pth'

                        if realesrgan_model_path.exists():
                            logger.info(f"Using local RealESRGAN model: {realesrgan_model_path}")
                            realesrgan_path = str(realesrgan_model_path)
                        else:
                            logger.info("Local RealESRGAN model not found, will download from GitHub")
                            realesrgan_path = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth'

                        bg_model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
                        use_half = self.device == 'cuda'
                        bg_upsampler = RealESRGANer(
                            scale=2,
                            model_path=realesrgan_path,
                            model=bg_model,
                            tile=400,
                            tile_pad=10,
                            pre_pad=0,
                            half=use_half
                        )
                        logger.info("Background upsampler loaded")
                    except Exception as e:
                        logger.warning(f"Could not load background upsampler: {e}")

                self.gfpgan_restorer = GFPGANer(
                    model_path=gfpgan_path,
                    upscale=2,
                    arch='clean',
                    channel_multiplier=2,
                    bg_upsampler=bg_upsampler,
                    device=self.device
                )
                logger.info("GFPGAN face restoration model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load GFPGAN: {e}")
                logger.warning("Face restoration will use fallback method")
                self.gfpgan_restorer = None
        return self.gfpgan_restorer

    def cleanup(self):
        logger.info("Cleaning up models...")
        self.face_analysis = None
        self.face_swapper = None
        self.gfpgan_restorer = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            torch.mps.empty_cache()
        logger.info("Models cleaned up")

model_manager = ModelManager()
