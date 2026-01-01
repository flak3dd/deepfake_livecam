import os
import sys
import logging
import hashlib
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Expected SHA256 hashes for model integrity verification
MODEL_HASHES = {
    'inswapper_128.onnx': 'e4a3f08c753cb72d04e10aa0f7dbe3deebbf39567d4ead6dce08e98aa49e16af',
    'buffalo_l': {
        '1k3d68.onnx': 'df5c06b8a0c12e422b2ed8947b8869faa4105387f199c477af038aa01f9a45cc',
        '2d106det.onnx': '5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91',
        'det_10g.onnx': '5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91',
        'genderage.onnx': '4fde69b1c810857b88c64a335084f1c3fe8f01246c9a191b48c7bb756d6652fb',
        'w600k_r50.onnx': '4c06341c33c2ca1f86781dab0e829f88ad5b64be9fba56e56bc9ebdefc619e43'
    }
}

def calculate_sha256(file_path):
    """Calculate SHA256 hash of a file"""
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except Exception as e:
        logger.error(f"Error calculating hash for {file_path}: {e}")
        return None

def verify_file_hash(file_path, expected_hash, file_name):
    """Verify file integrity using SHA256 hash"""
    if not expected_hash:
        logger.warning(f"No hash available for {file_name}, skipping verification")
        return True

    logger.info(f"Verifying {file_name}...")
    actual_hash = calculate_sha256(file_path)

    if actual_hash is None:
        logger.error(f"Failed to calculate hash for {file_name}")
        return False

    if actual_hash.lower() == expected_hash.lower():
        logger.info(f"✓ {file_name} hash verified successfully")
        return True
    else:
        logger.error(f"✗ {file_name} hash mismatch!")
        logger.error(f"  Expected: {expected_hash}")
        logger.error(f"  Got:      {actual_hash}")
        logger.error(f"  File may be corrupted. Please re-download.")
        return False

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
    """Verify that all required models are present and check their integrity"""
    backend_dir = Path(__file__).parent
    models_dir = backend_dir / 'models'

    logger.info("=" * 60)
    logger.info("Model Verification")
    logger.info("=" * 60)
    logger.info(f"Models directory: {models_dir}")
    logger.info("")

    all_found = True
    all_valid = True

    # Check Buffalo_l models
    logger.info("Checking Buffalo_l models...")
    buffalo_path = models_dir / 'models' / 'buffalo_l'
    if buffalo_path.exists():
        model_files = list(buffalo_path.glob('*.onnx'))
        logger.info(f"✓ Buffalo_l directory found: {buffalo_path}")
        logger.info(f"  Found {len(model_files)} ONNX model files")

        # Verify each buffalo_l model
        for model_file in model_files:
            file_name = model_file.name
            logger.info(f"  - {file_name} ({model_file.stat().st_size / (1024*1024):.2f} MB)")

            if file_name in MODEL_HASHES.get('buffalo_l', {}):
                expected_hash = MODEL_HASHES['buffalo_l'][file_name]
                if not verify_file_hash(model_file, expected_hash, file_name):
                    all_valid = False
            else:
                logger.warning(f"    ⚠ No hash available for {file_name}")
    else:
        logger.error(f"✗ Buffalo_l models NOT found at: {buffalo_path}")
        logger.error("  Run: python download_models.py")
        all_found = False

    logger.info("")

    # Check inswapper model
    logger.info("Checking Inswapper model...")
    inswapper_path = models_dir / 'inswapper_128.onnx'
    if inswapper_path.exists():
        size_mb = inswapper_path.stat().st_size / (1024 * 1024)
        logger.info(f"✓ Inswapper model found: {inswapper_path}")
        logger.info(f"  Size: {size_mb:.2f} MB")

        # Verify inswapper hash
        expected_hash = MODEL_HASHES.get('inswapper_128.onnx')
        if expected_hash:
            if not verify_file_hash(inswapper_path, expected_hash, 'inswapper_128.onnx'):
                all_valid = False
        else:
            logger.warning("  ⚠ No hash available for inswapper_128.onnx")

        # Size check as additional validation
        if size_mb < 500 or size_mb > 600:
            logger.warning(f"  ⚠ Unexpected file size: {size_mb:.2f} MB (expected ~536 MB)")
            logger.warning("  File might be incomplete or corrupted")
            all_valid = False
    else:
        logger.error(f"✗ Inswapper model NOT found: {inswapper_path}")
        logger.error("")
        logger.error("  Download manually from:")
        logger.error("    Google Drive: https://drive.google.com/file/d/1HvZ4MAtzlY74Dk4ASGIS9L6Rg5oZdqvu/view")
        logger.error("    OR")
        logger.error("    Hugging Face: https://huggingface.co/deepinsight/inswapper/tree/main")
        logger.error(f"  Place it in: {models_dir}/")
        all_found = False

    logger.info("")
    logger.info("=" * 60)

    if all_found and all_valid:
        logger.info("✓ All models verified successfully!")
        logger.info("=" * 60)
        logger.info("You can now start the backend server with:")
        logger.info("  python main.py")
    elif all_found and not all_valid:
        logger.warning("⚠ All models found but some failed integrity checks")
        logger.warning("=" * 60)
        logger.warning("Some models may be corrupted. Consider re-downloading.")
        logger.warning("The backend may still work, but results could be unpredictable.")
    else:
        logger.error("✗ Some models are missing")
        logger.error("=" * 60)
        logger.error("Please download missing models first.")

    return all_found and all_valid

if __name__ == "__main__":
    logger.info("Starting model download process...")
    logger.info("")

    if len(sys.argv) > 1 and sys.argv[1] == '--verify':
        success = verify_models()
    else:
        success = download_insightface_models()

    sys.exit(0 if success else 1)
