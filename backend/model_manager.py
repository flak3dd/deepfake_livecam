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

    async def get_face_analysis(self) -> FaceAnalysis:
        if self.face_analysis is None:
            logger.info("Loading InsightFace analysis model (buffalo_l)...")

            if self.device == 'cuda':
                providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
            elif self.device == 'mps':
                providers = ['CoreMLExecutionProvider', 'CPUExecutionProvider']
            else:
                providers = ['CPUExecutionProvider']

            self.face_analysis = FaceAnalysis(
                name='buffalo_l',
                providers=providers
            )

            ctx_id = 0 if self.device in ['cuda', 'mps'] else -1
            self.face_analysis.prepare(ctx_id=ctx_id, det_size=(640, 640))
            logger.info("Face analysis model loaded successfully")
        return self.face_analysis

    async def get_face_swapper(self):
        if self.face_swapper is None:
            logger.info("Loading InsightFace swapper model (inswapper_128.onnx)...")
            try:
                self.face_swapper = insightface.model_zoo.get_model(
                    'inswapper_128.onnx',
                    download=True,
                    download_zip=True
                )
                logger.info("Face swapper model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load face swapper: {e}")
                logger.info("Attempting alternative download method...")
                model_path = self.models_dir / 'inswapper_128.onnx'
                if model_path.exists():
                    self.face_swapper = insightface.model_zoo.get_model(str(model_path))
                else:
                    raise Exception("Could not load face swapper model. Please download manually.")
        return self.face_swapper

    async def get_gfpgan_restorer(self) -> GFPGANer:
        if self.gfpgan_restorer is None:
            logger.info("Loading GFPGAN v1.4 face restoration model...")
            try:
                model_path = self.models_dir / 'GFPGANv1.4.pth'

                bg_upsampler = None
                if self.device in ['cuda', 'mps']:
                    try:
                        bg_model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
                        use_half = self.device == 'cuda'
                        bg_upsampler = RealESRGANer(
                            scale=2,
                            model_path='https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth',
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
                    model_path='https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth',
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
