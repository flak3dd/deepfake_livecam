from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import cv2
import numpy as np
from PIL import Image
import io
import logging
import torch
from typing import Optional
from face_swapper import FaceSwapper
from face_restoration import FaceRestoration
from model_manager import model_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Deep Live Cam - Face Processing API",
    description="Professional face swapping and restoration using InsightFace, GFPGAN, and PyTorch",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

face_swapper = FaceSwapper()
face_restoration = FaceRestoration()

@app.on_event("startup")
async def startup_event():
    try:
        logger.info("=" * 60)
        logger.info("Deep Live Cam - Face Processing API v2.0.0")
        logger.info("=" * 60)
        logger.info(f"Device: {model_manager.device}")
        logger.info(f"CUDA Available: {torch.cuda.is_available()}")
        logger.info("Initializing AI models...")
        logger.info("  - InsightFace buffalo_l (Face Detection & Landmarks)")
        logger.info("  - InsightFaceSwap inswapper_128 (Face Swapping)")
        logger.info("  - GFPGAN v1.4 (Face Restoration)")
        logger.info("  - RealESRGAN (Background Enhancement)")
        await face_swapper.initialize()
        await face_restoration.initialize()
        logger.info("All models initialized successfully!")
        logger.info("=" * 60)
    except Exception as e:
        logger.error(f"Failed to initialize models: {e}")
        raise

@app.get("/")
async def root():
    return {
        "message": "Deep Live Cam Face Processing API",
        "version": "2.0.0",
        "status": "ready",
        "models": {
            "face_detection": "InsightFace buffalo_l (CenterFace + FaceMesh)",
            "face_swapping": "InsightFaceSwap inswapper_128 (ONNX)",
            "face_restoration": "GFPGAN v1.4 + RealESRGAN",
            "landmarks": "FaceMarkerLBF + 68/468-point tracking",
            "runtime": "PyTorch + ONNX Runtime"
        },
        "device": model_manager.device,
        "endpoints": [
            "/api/face-swap",
            "/api/face-restore",
            "/api/face-swap-video-frame"
        ]
    }

@app.get("/health")
async def health_check():
    cuda_available = torch.cuda.is_available()
    return {
        "status": "healthy",
        "models_loaded": face_swapper.is_initialized and face_restoration.is_initialized,
        "device": model_manager.device,
        "cuda_available": cuda_available,
        "models": {
            "face_analysis": face_swapper.app is not None,
            "face_swapper": face_swapper.swapper is not None,
            "gfpgan_restorer": face_restoration.gfpgan is not None
        }
    }

@app.post("/api/face-swap")
async def swap_face(
    source_face: UploadFile = File(...),
    target_image: UploadFile = File(...),
    blend_strength: float = Form(0.8),
    color_correction: bool = Form(True),
    face_scale: float = Form(1.0),
):
    try:
        source_bytes = await source_face.read()
        target_bytes = await target_image.read()

        source_img = np.array(Image.open(io.BytesIO(source_bytes)))
        target_img = np.array(Image.open(io.BytesIO(target_bytes)))

        if source_img.shape[-1] == 4:
            source_img = cv2.cvtColor(source_img, cv2.COLOR_RGBA2RGB)
        if target_img.shape[-1] == 4:
            target_img = cv2.cvtColor(target_img, cv2.COLOR_RGBA2RGB)

        result = await face_swapper.swap_face(
            source_img,
            target_img,
            blend_strength=blend_strength,
            color_correction=color_correction,
            face_scale=face_scale
        )

        result_pil = Image.fromarray(result)
        img_byte_arr = io.BytesIO()
        result_pil.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)

        return Response(content=img_byte_arr.getvalue(), media_type="image/png")

    except Exception as e:
        logger.error(f"Face swap error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/face-restore")
async def restore_face(
    image: UploadFile = File(...),
    strength: float = Form(0.5),
    denoise_level: float = Form(0.3),
    sharpen_amount: float = Form(0.2),
    enhance_details: bool = Form(True)
):
    try:
        image_bytes = await image.read()
        img = np.array(Image.open(io.BytesIO(image_bytes)))

        if img.shape[-1] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)

        result = await face_restoration.restore(
            img,
            strength=strength,
            denoise_level=denoise_level,
            sharpen_amount=sharpen_amount,
            enhance_details=enhance_details
        )

        result_pil = Image.fromarray(result)
        img_byte_arr = io.BytesIO()
        result_pil.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)

        return Response(content=img_byte_arr.getvalue(), media_type="image/png")

    except Exception as e:
        logger.error(f"Face restoration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/face-swap-video-frame")
async def swap_face_video_frame(
    source_face: UploadFile = File(...),
    frame: UploadFile = File(...),
    blend_strength: float = Form(0.8),
):
    try:
        source_bytes = await source_face.read()
        frame_bytes = await frame.read()

        source_img = np.array(Image.open(io.BytesIO(source_bytes)))
        frame_img = np.array(Image.open(io.BytesIO(frame_bytes)))

        if source_img.shape[-1] == 4:
            source_img = cv2.cvtColor(source_img, cv2.COLOR_RGBA2RGB)
        if frame_img.shape[-1] == 4:
            frame_img = cv2.cvtColor(frame_img, cv2.COLOR_RGBA2RGB)

        result = await face_swapper.swap_face(
            source_img,
            frame_img,
            blend_strength=blend_strength,
            color_correction=True,
            face_scale=1.0
        )

        _, encoded = cv2.imencode('.jpg', cv2.cvtColor(result, cv2.COLOR_RGB2BGR))

        return Response(content=encoded.tobytes(), media_type="image/jpeg")

    except Exception as e:
        logger.error(f"Video frame swap error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
