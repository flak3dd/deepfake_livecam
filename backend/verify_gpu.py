#!/usr/bin/env python3
"""
GPU Verification Script for Deep Live Cam Backend
Checks all GPU-related components and dependencies
"""

import sys
import subprocess
from pathlib import Path

def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 60)
    print(f" {text}")
    print("=" * 60)

def print_section(text):
    """Print formatted section"""
    print(f"\n{text}")
    print("-" * 60)

def check_command(cmd, name):
    """Check if a command exists and works"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print(f"✓ {name}: OK")
            return True, result.stdout.strip()
        else:
            print(f"✗ {name}: NOT FOUND")
            return False, None
    except Exception as e:
        print(f"✗ {name}: ERROR - {e}")
        return False, None

def check_cuda():
    """Check CUDA installation"""
    print_section("CUDA Installation")

    # Check nvcc
    nvcc_ok, nvcc_output = check_command("nvcc --version", "CUDA Compiler (nvcc)")
    if nvcc_ok and nvcc_output:
        print(f"  Version: {[line for line in nvcc_output.split('\\n') if 'release' in line.lower()][0].strip()}")

    # Check nvidia-smi
    smi_ok, smi_output = check_command("nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader", "NVIDIA System Management Interface")
    if smi_ok and smi_output:
        for line in smi_output.split('\n'):
            if line.strip():
                print(f"  GPU: {line.strip()}")

    return nvcc_ok and smi_ok

def check_python_env():
    """Check Python environment"""
    print_section("Python Environment")

    print(f"✓ Python Version: {sys.version.split()[0]}")
    print(f"✓ Python Executable: {sys.executable}")

    # Check if in virtual environment
    in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    if in_venv:
        print(f"✓ Virtual Environment: Active")
    else:
        print(f"⚠ Virtual Environment: Not detected (recommended to use venv)")

    return True

def check_pytorch():
    """Check PyTorch installation and CUDA support"""
    print_section("PyTorch Installation")

    try:
        import torch
        print(f"✓ PyTorch installed: {torch.__version__}")

        cuda_available = torch.cuda.is_available()
        if cuda_available:
            print(f"✓ CUDA Available: Yes")
            print(f"  CUDA Version: {torch.version.cuda}")
            print(f"  cuDNN Version: {torch.backends.cudnn.version()}")
            print(f"  GPU Count: {torch.cuda.device_count()}")

            for i in range(torch.cuda.device_count()):
                gpu_name = torch.cuda.get_device_name(i)
                gpu_memory = torch.cuda.get_device_properties(i).total_memory / (1024**3)
                print(f"  GPU {i}: {gpu_name} ({gpu_memory:.2f} GB)")

            # Check compute capability
            capability = torch.cuda.get_device_capability(0)
            print(f"  Compute Capability: {capability[0]}.{capability[1]}")

            if capability[0] < 3 or (capability[0] == 3 and capability[1] < 5):
                print(f"  ⚠ Warning: Compute capability is low. Minimum recommended is 3.5")
        else:
            print(f"✗ CUDA Available: No")
            print(f"  PyTorch is not using CUDA")
            print(f"  Reasons could be:")
            print(f"    - PyTorch installed without CUDA support")
            print(f"    - CUDA not installed or not in PATH")
            print(f"    - GPU drivers not installed")
            return False

        return cuda_available

    except ImportError:
        print("✗ PyTorch not installed")
        print("  Install with: pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118")
        return False
    except Exception as e:
        print(f"✗ Error checking PyTorch: {e}")
        return False

def check_dependencies():
    """Check other required dependencies"""
    print_section("Required Dependencies")

    packages = [
        ('insightface', 'InsightFace'),
        ('onnxruntime', 'ONNX Runtime'),
        ('cv2', 'OpenCV'),
        ('gfpgan', 'GFPGAN'),
        ('basicsr', 'BasicSR'),
        ('realesrgan', 'RealESRGAN'),
        ('fastapi', 'FastAPI'),
        ('PIL', 'Pillow'),
        ('numpy', 'NumPy'),
    ]

    all_installed = True
    for module, name in packages:
        try:
            __import__(module)
            print(f"✓ {name}: Installed")
        except ImportError:
            print(f"✗ {name}: NOT INSTALLED")
            all_installed = False

    if not all_installed:
        print("\n  Install missing packages with:")
        print("  pip install -r requirements.txt")

    return all_installed

def check_models():
    """Check if AI models are downloaded and verify their integrity"""
    print_section("AI Models")

    backend_dir = Path(__file__).parent
    models_dir = backend_dir / 'models'

    all_found = True

    # Check buffalo_l
    buffalo_path = models_dir / 'models' / 'buffalo_l'
    if buffalo_path.exists():
        onnx_files = list(buffalo_path.glob('*.onnx'))
        print(f"✓ Buffalo_l models: Found ({len(onnx_files)} files)")
        for f in onnx_files:
            size_mb = f.stat().st_size / (1024 * 1024)
            print(f"  - {f.name} ({size_mb:.2f} MB)")
    else:
        print(f"✗ Buffalo_l models: NOT FOUND")
        print(f"  Expected at: {buffalo_path}")
        all_found = False

    # Check inswapper
    inswapper_path = models_dir / 'inswapper_128.onnx'
    if inswapper_path.exists():
        size_mb = inswapper_path.stat().st_size / (1024 * 1024)
        print(f"✓ Inswapper model: Found ({size_mb:.2f} MB)")

        # Check file size as basic integrity check
        if size_mb < 500 or size_mb > 600:
            print(f"  ⚠ Warning: Unexpected file size (expected ~536 MB)")
            print(f"  Model may be corrupted or incomplete")
            all_found = False
    else:
        print(f"✗ Inswapper model: NOT FOUND")
        print(f"  Expected at: {inswapper_path}")
        print(f"  Download from: https://drive.google.com/file/d/1HvZ4MAtzlY74Dk4ASGIS9L6Rg5oZdqvu/view")
        all_found = False

    if not all_found:
        print("\n  Run: python download_models.py")
        print("  Or see: QUICK_START.md for manual download instructions")
    else:
        print("\n  For full integrity check with hash verification:")
        print("  Run: python download_models.py --verify")

    return all_found

def run_performance_test():
    """Run a quick GPU performance test"""
    print_section("GPU Performance Test")

    try:
        import torch
        import time

        if not torch.cuda.is_available():
            print("⚠ CUDA not available, skipping performance test")
            return

        print("Running matrix multiplication test...")

        # Warm up
        a = torch.randn(1000, 1000, device='cuda')
        b = torch.randn(1000, 1000, device='cuda')
        torch.matmul(a, b)
        torch.cuda.synchronize()

        # Test
        size = 2000
        iterations = 10

        a = torch.randn(size, size, device='cuda')
        b = torch.randn(size, size, device='cuda')

        start = time.time()
        for _ in range(iterations):
            c = torch.matmul(a, b)
        torch.cuda.synchronize()
        end = time.time()

        elapsed = end - start
        ops = iterations * size * size * size * 2  # multiply-add operations
        gflops = (ops / elapsed) / 1e9

        print(f"✓ Test completed:")
        print(f"  Matrix size: {size}x{size}")
        print(f"  Iterations: {iterations}")
        print(f"  Time: {elapsed:.3f} seconds")
        print(f"  Performance: {gflops:.2f} GFLOPS")

        # Rough performance categories
        if gflops > 5000:
            print(f"  Rating: Excellent (High-end GPU)")
        elif gflops > 2000:
            print(f"  Rating: Good (Mid-range GPU)")
        elif gflops > 500:
            print(f"  Rating: Adequate (Entry-level GPU)")
        else:
            print(f"  Rating: Poor (Very slow GPU or CPU)")

    except Exception as e:
        print(f"✗ Performance test failed: {e}")

def main():
    """Main verification function"""
    print_header("Deep Live Cam - GPU Verification Tool")

    results = {
        'cuda': check_cuda(),
        'python': check_python_env(),
        'pytorch': check_pytorch(),
        'dependencies': check_dependencies(),
        'models': check_models(),
    }

    if results['cuda'] and results['pytorch']:
        run_performance_test()

    # Summary
    print_header("Verification Summary")

    all_ok = all(results.values())

    for component, status in results.items():
        status_text = "✓ OK" if status else "✗ FAILED"
        print(f"{component.capitalize()}: {status_text}")

    print("\n" + "=" * 60)

    if all_ok:
        print("\n🎉 All checks passed! Your GPU setup is ready.")
        print("\nNext steps:")
        print("  1. Run: python main.py")
        print("  2. Backend will start at http://localhost:8000")
        print("  3. Check GPU usage with: nvidia-smi")
    else:
        print("\n⚠ Some checks failed. Please review the issues above.")
        print("\nFor help:")
        print("  - See WINDOWS_GPU_SETUP.md for detailed setup instructions")
        print("  - See QUICK_START.md for model download instructions")
        print("  - Check backend/README.md for general setup")

    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(main())
