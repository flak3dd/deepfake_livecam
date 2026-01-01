#!/usr/bin/env python3
"""
Dependency Compatibility Checker for Deep Live Cam Backend
Checks for version conflicts and compatibility issues between packages
"""

import sys
import subprocess
import importlib.metadata
from pathlib import Path

def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 70)
    print(f" {text}")
    print("=" * 70)

def print_section(text):
    """Print formatted section"""
    print(f"\n{text}")
    print("-" * 70)

def get_installed_version(package_name):
    """Get installed version of a package"""
    try:
        return importlib.metadata.version(package_name)
    except importlib.metadata.PackageNotFoundError:
        return None

def check_package_version(package_name, expected_version, required=True):
    """Check if a package is installed with the correct version"""
    installed = get_installed_version(package_name)

    if installed is None:
        status = "✗ NOT INSTALLED" if required else "⚠ NOT INSTALLED (optional)"
        print(f"{status:20} {package_name}")
        return False
    elif installed == expected_version:
        print(f"✓ OK:                {package_name}=={installed}")
        return True
    else:
        print(f"⚠ VERSION MISMATCH:  {package_name}")
        print(f"  Expected: {expected_version}")
        print(f"  Installed: {installed}")
        return False

def check_core_dependencies():
    """Check core dependencies that must be correct"""
    print_section("Core Dependencies")

    core_packages = {
        'fastapi': '0.109.0',
        'uvicorn': '0.27.0',
        'python-multipart': '0.0.6',
    }

    all_ok = True
    for package, version in core_packages.items():
        if not check_package_version(package, version, required=True):
            all_ok = False

    return all_ok

def check_numpy_compatibility():
    """Check NumPy version compatibility"""
    print_section("NumPy Version (Critical for Compatibility)")

    numpy_version = get_installed_version('numpy')

    if numpy_version is None:
        print("✗ NumPy not installed")
        return False

    print(f"Installed: numpy=={numpy_version}")
    print(f"Required:  numpy==1.24.3")

    if numpy_version != '1.24.3':
        print("\n⚠ WARNING: NumPy version mismatch")
        print("  NumPy 1.24.3 is required for compatibility with:")
        print("    - InsightFace 0.7.3")
        print("    - GFPGAN 1.3.8")
        print("    - BasicSR 1.4.2")
        print("\n  Other versions may cause:")
        print("    - Import errors")
        print("    - Runtime crashes")
        print("    - Incorrect results")
        print("\n  Fix: pip install numpy==1.24.3")
        return False

    print("✓ NumPy version is correct")
    return True

def check_pytorch_compatibility():
    """Check PyTorch installation and CUDA compatibility"""
    print_section("PyTorch & CUDA Compatibility")

    torch_version = get_installed_version('torch')
    torchvision_version = get_installed_version('torchvision')

    if torch_version is None:
        print("✗ PyTorch not installed")
        return False

    print(f"Installed: torch=={torch_version}")
    print(f"Required:  torch==2.1.2")

    if torch_version != '2.1.2':
        print("\n⚠ WARNING: PyTorch version mismatch")
        print("  Install correct version:")
        print("    CPU:  pip install torch==2.1.2 torchvision==0.16.2")
        print("    GPU:  pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118")
        return False

    if torchvision_version != '0.16.2':
        print(f"\n⚠ WARNING: torchvision version mismatch")
        print(f"  Installed: {torchvision_version}")
        print(f"  Required:  0.16.2")
        return False

    # Check if PyTorch has CUDA support
    try:
        import torch
        cuda_available = torch.cuda.is_available()

        if cuda_available:
            print(f"✓ CUDA Available: Yes")
            print(f"  CUDA Version: {torch.version.cuda}")
            print(f"  GPU: {torch.cuda.get_device_name(0)}")
        else:
            print("⚠ CUDA Available: No (CPU-only PyTorch)")
            print("  For GPU support, install:")
            print("    pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118")
    except Exception as e:
        print(f"⚠ Error checking CUDA: {e}")

    return True

def check_onnx_runtime():
    """Check ONNX Runtime installation"""
    print_section("ONNX Runtime")

    onnx_version = get_installed_version('onnxruntime')
    onnx_gpu_version = get_installed_version('onnxruntime-gpu')

    if onnx_version:
        print(f"✓ onnxruntime=={onnx_version} (CPU)")
    elif onnx_gpu_version:
        print(f"✓ onnxruntime-gpu=={onnx_gpu_version} (GPU)")
    else:
        print("✗ ONNX Runtime not installed")
        return False

    if onnx_version and onnx_gpu_version:
        print("\n⚠ WARNING: Both onnxruntime and onnxruntime-gpu installed")
        print("  This can cause conflicts. Uninstall one:")
        print("    For CPU:  pip uninstall onnxruntime-gpu")
        print("    For GPU:  pip uninstall onnxruntime && pip install onnxruntime-gpu==1.16.3")
        return False

    expected_version = '1.16.3'
    installed_version = onnx_version or onnx_gpu_version

    if installed_version != expected_version:
        print(f"\n⚠ WARNING: ONNX Runtime version mismatch")
        print(f"  Expected: {expected_version}")
        print(f"  Installed: {installed_version}")
        return False

    return True

def check_face_processing():
    """Check face processing libraries"""
    print_section("Face Processing Libraries")

    packages = {
        'insightface': '0.7.3',
        'opencv-python': '4.9.0.80',
        'pillow': '10.2.0',
    }

    all_ok = True
    for package, version in packages.items():
        installed = get_installed_version(package.replace('-', '_'))
        if installed is None:
            installed = get_installed_version(package)

        if installed is None:
            print(f"✗ NOT INSTALLED:     {package}")
            all_ok = False
        elif installed == version:
            print(f"✓ OK:                {package}=={installed}")
        else:
            print(f"⚠ VERSION MISMATCH:  {package}")
            print(f"  Expected: {version}")
            print(f"  Installed: {installed}")
            all_ok = False

    return all_ok

def check_gfpgan_stack():
    """Check GFPGAN and related packages"""
    print_section("GFPGAN & Face Restoration Stack")

    packages = {
        'basicsr': '1.4.2',
        'facexlib': '0.3.0',
        'gfpgan': '1.3.8',
        'realesrgan': '0.3.0',
    }

    print("Installation order matters for these packages!")
    print("Correct order: basicsr → facexlib → gfpgan → realesrgan")
    print()

    all_ok = True
    for package, version in packages.items():
        if not check_package_version(package, version, required=True):
            all_ok = False

    if not all_ok:
        print("\n⚠ To fix GFPGAN stack issues:")
        print("  pip uninstall basicsr facexlib gfpgan realesrgan -y")
        print("  pip install basicsr==1.4.2")
        print("  pip install facexlib==0.3.0")
        print("  pip install gfpgan==1.3.8")
        print("  pip install realesrgan==0.3.0")

    return all_ok

def check_dependency_conflicts():
    """Check for known dependency conflicts using pip"""
    print_section("Checking for Dependency Conflicts")

    try:
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'check'],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode == 0:
            print("✓ No dependency conflicts found")
            return True
        else:
            print("✗ Dependency conflicts detected:")
            print(result.stdout)
            print("\nTo fix conflicts:")
            print("  1. Uninstall conflicting packages")
            print("  2. Reinstall from requirements.txt:")
            print("     pip install -r requirements.txt")
            return False
    except Exception as e:
        print(f"⚠ Could not check dependencies: {e}")
        return True

def check_additional_packages():
    """Check additional recommended packages"""
    print_section("Additional Packages (for compatibility)")

    packages = {
        'scikit-image': '0.19.0',
        'scipy': '1.9.0',
        'tqdm': '4.64.0',
    }

    for package, min_version in packages.items():
        installed = get_installed_version(package.replace('-', '_'))
        if installed:
            print(f"✓ Installed:         {package}=={installed}")
        else:
            print(f"⚠ NOT INSTALLED:     {package} (recommended: >={min_version})")

    return True

def run_import_tests():
    """Try importing key packages to check for runtime errors"""
    print_section("Import Tests")

    test_imports = [
        ('fastapi', 'FastAPI web framework'),
        ('insightface', 'InsightFace'),
        ('cv2', 'OpenCV'),
        ('torch', 'PyTorch'),
        ('onnxruntime', 'ONNX Runtime'),
        ('gfpgan', 'GFPGAN'),
        ('basicsr', 'BasicSR'),
        ('PIL', 'Pillow'),
        ('numpy', 'NumPy'),
    ]

    all_ok = True
    for module, name in test_imports:
        try:
            __import__(module)
            print(f"✓ {name:30} imports successfully")
        except ImportError as e:
            print(f"✗ {name:30} import failed: {e}")
            all_ok = False
        except Exception as e:
            print(f"⚠ {name:30} import warning: {e}")

    return all_ok

def main():
    """Main check function"""
    print_header("Deep Live Cam - Dependency Compatibility Checker")

    results = {
        'core': check_core_dependencies(),
        'numpy': check_numpy_compatibility(),
        'pytorch': check_pytorch_compatibility(),
        'onnx': check_onnx_runtime(),
        'face_processing': check_face_processing(),
        'gfpgan': check_gfpgan_stack(),
        'additional': check_additional_packages(),
        'conflicts': check_dependency_conflicts(),
        'imports': run_import_tests(),
    }

    # Summary
    print_header("Dependency Check Summary")

    critical_checks = ['core', 'numpy', 'pytorch', 'onnx', 'face_processing', 'gfpgan']
    critical_ok = all(results[check] for check in critical_checks if check in results)

    for component, status in results.items():
        status_text = "✓ PASS" if status else "✗ FAIL"
        critical = " (CRITICAL)" if component in critical_checks else ""
        print(f"{component.capitalize():20} {status_text}{critical}")

    print("\n" + "=" * 70)

    if critical_ok:
        print("\n✓ All critical dependencies are correctly installed!")
        print("\nYou can now start the backend server:")
        print("  python main.py")
        return 0
    else:
        print("\n✗ Some critical dependencies have issues")
        print("\nRecommended fix:")
        print("  1. Create a fresh virtual environment:")
        print("     python -m venv venv")
        print("     venv\\Scripts\\activate  # Windows")
        print("     source venv/bin/activate  # Linux/Mac")
        print()
        print("  2. Install dependencies in correct order:")
        print("     pip install --upgrade pip")
        print("     pip install numpy==1.24.3 pillow==10.2.0")
        print("     pip install torch==2.1.2 torchvision==0.16.2")
        print("     # For GPU: add --index-url https://download.pytorch.org/whl/cu118")
        print("     pip install -r requirements.txt")
        return 1

if __name__ == "__main__":
    sys.exit(main())
