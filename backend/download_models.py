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
                download_zip=False,
                providers=['CPUExecutionProvider'],
                root=str(models_dir)
            )
            logger.info("Inswapper model downloaded successfully!")
        except Exception as e:
            logger.error(f"Failed to download inswapper automatically: {e}")
            logger.error("")
            logger.error("=" * 60)
            logger.error("MANUAL DOWNLOAD REQUIRED")
            logger.error("=" * 60)
            logger.error("")
            logger.error("The inswapper_128.onnx model needs to be downloaded manually.")
            logger.error("")
            logger.error("Option 1 - Download from Google Drive:")
            logger.error("  1. Visit: https://drive.google.com/file/d/1HvZ4MAtzlY74Dk4ASGIS9L6Rg5oZdqvu/view")
            logger.error("  2. Download inswapper_128.onnx")
            logger.error(f"  3. Place it in: {models_dir}/")
            logger.error("")
            logger.error("Option 2 - Download from Hugging Face:")
            logger.error("  1. Visit: https://huggingface.co/deepinsight/inswapper/tree/main")
            logger.error("  2. Download inswapper_128.onnx")
            logger.error(f"  3. Place it in: {models_dir}/")
            logger.error("")
            logger.error("After manual download, restart the backend server.")
            logger.error("=" * 60)
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
    logger.info(f"Models directory: {models_dir}")
    logger.info("")

    all_found = True

    buffalo_path = models_dir / 'models' / 'buffalo_l'
    if buffalo_path.exists():
        model_files = list(buffalo_path.glob('*.onnx'))
        logger.info(f"✓ Buffalo_l models found at: {buffalo_path}")
        logger.info(f"  Found {len(model_files)} ONNX model files:")
        for f in model_files:
            logger.info(f"    - {f.name}")
    else:
        logger.warning(f"✗ Buffalo_l models NOT found at: {buffalo_path}")
        logger.warning("  Run: python download_models.py")
        all_found = False

    logger.info("")

    inswapper_path = models_dir / 'inswapper_128.onnx'
    if inswapper_path.exists():
        size_mb = inswapper_path.stat().st_size / (1024 * 1024)
        logger.info(f"✓ Inswapper model found at: {inswapper_path}")
        logger.info(f"  Size: {size_mb:.2f} MB")
    else:
        logger.warning(f"✗ Inswapper model NOT found at: {inswapper_path}")
        logger.warning("  Download manually from:")
        logger.warning("    Google Drive: https://drive.google.com/file/d/1HvZ4MAtzlY74Dk4ASGIS9L6Rg5oZdqvu/view")
        logger.warning("    OR")
        logger.warning("    Hugging Face: https://huggingface.co/deepinsight/inswapper/tree/main")
        logger.warning(f"  Place it in: {models_dir}/")
        all_found = False

    logger.info("")

    if all_found:
        logger.info("=" * 60)
        logger.info("All required models verified successfully!")
        logger.info("=" * 60)
        logger.info("You can now start the backend server.")
    else:
        logger.warning("=" * 60)
        logger.warning("Some models are missing. Please download them first.")
        logger.warning("=" * 60)

    return all_found

if __name__ == "__main__":
    logger.info("Starting model download process...")
    logger.info("")

    if len(sys.argv) > 1 and sys.argv[1] == '--verify':
        success = verify_models()
    else:
        success = download_insightface_models()

    sys.exit(0 if success else 1)
