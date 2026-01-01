import os
import sys
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def download_insightface_models():
    """Standalone script to download InsightFace models"""
    try:
        import insightface
        from insightface.app import FaceAnalysis

        backend_dir = Path(__file__).parent
        models_dir = backend_dir / 'models'
        models_dir.mkdir(parents=True, exist_ok=True)

        os.environ['INSIGHTFACE_ROOT'] = str(models_dir)

        logger.info("=" * 60)
        logger.info("InsightFace Model Downloader")
        logger.info("=" * 60)
        logger.info(f"Models will be saved to: {models_dir}")
        logger.info("")

        logger.info("Downloading buffalo_l models (face detection + recognition)...")
        logger.info("This may take several minutes depending on your connection...")
        logger.info("Expected download size: ~1.5 GB")

        try:
            app = FaceAnalysis(
                name='buffalo_l',
                providers=['CPUExecutionProvider'],
                root=str(models_dir)
            )
            app.prepare(ctx_id=-1, det_size=(640, 640))
            logger.info("Buffalo_l models downloaded successfully!")
        except Exception as e:
            logger.error(f"Failed to download buffalo_l: {e}")
            logger.error("You may need to download manually from:")
            logger.error("https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip")
            return False

        logger.info("")
        logger.info("Downloading inswapper_128.onnx (face swapping)...")
        logger.info("Expected download size: ~500 MB")

        try:
            swapper = insightface.model_zoo.get_model(
                'inswapper_128.onnx',
                download=True,
                download_zip=True,
                providers=['CPUExecutionProvider']
            )
            logger.info("Inswapper model downloaded successfully!")
        except Exception as e:
            logger.error(f"Failed to download inswapper: {e}")
            logger.error("You may need to download manually from:")
            logger.error("https://github.com/deepinsight/insightface/releases/download/v0.7/inswapper_128.onnx")
            return False

        logger.info("")
        logger.info("=" * 60)
        logger.info("All InsightFace models downloaded successfully!")
        logger.info("=" * 60)
        logger.info(f"Models location: {models_dir}")
        logger.info("")
        logger.info("You can now start the backend server with:")
        logger.info("  python main.py")
        logger.info("  or")
        logger.info("  uvicorn main:app --reload")

        return True

    except ImportError as e:
        logger.error("Failed to import required packages.")
        logger.error("Please install dependencies first:")
        logger.error("  pip install -r requirements.txt")
        logger.error(f"Error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False

def verify_models():
    """Verify that all required models are present"""
    backend_dir = Path(__file__).parent
    models_dir = backend_dir / 'models'

    logger.info("Verifying model files...")

    buffalo_path = models_dir / 'models' / 'buffalo_l'
    if buffalo_path.exists():
        logger.info(f"✓ Buffalo_l models found at: {buffalo_path}")
        model_files = list(buffalo_path.glob('*.onnx'))
        logger.info(f"  Found {len(model_files)} ONNX model files")
    else:
        logger.warning(f"✗ Buffalo_l models NOT found at: {buffalo_path}")
        return False

    inswapper_files = list(models_dir.glob('**/inswapper_128.onnx'))
    if inswapper_files:
        logger.info(f"✓ Inswapper model found at: {inswapper_files[0]}")
    else:
        logger.warning("✗ Inswapper model NOT found")
        return False

    logger.info("All models verified successfully!")
    return True

if __name__ == "__main__":
    logger.info("Starting model download process...")
    logger.info("")

    if len(sys.argv) > 1 and sys.argv[1] == '--verify':
        success = verify_models()
    else:
        success = download_insightface_models()

    sys.exit(0 if success else 1)
