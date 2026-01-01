import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis
from typing import Optional, List
import logging
from model_manager import model_manager

logger = logging.getLogger(__name__)

class FaceSwapper:
    def __init__(self):
        self.app = None
        self.swapper = None
        self.is_initialized = False

    async def initialize(self):
        if self.is_initialized:
            return

        try:
            logger.info("Loading InsightFace models (buffalo_l + inswapper_128)...")

            self.app = await model_manager.get_face_analysis()
            self.swapper = await model_manager.get_face_swapper()

            self.is_initialized = True
            logger.info("Face swapper initialized successfully with ONNX runtime")

        except Exception as e:
            logger.error(f"Failed to initialize face swapper: {e}")
            raise

    async def swap_face(
        self,
        source_img: np.ndarray,
        target_img: np.ndarray,
        blend_strength: float = 0.8,
        color_correction: bool = True,
        face_scale: float = 1.0
    ) -> np.ndarray:
        if not self.is_initialized:
            await self.initialize()

        try:
            source_faces = self.app.get(source_img)
            target_faces = self.app.get(target_img)

            if len(source_faces) == 0:
                raise ValueError("No face detected in source image")

            if len(target_faces) == 0:
                raise ValueError("No face detected in target image")

            source_face = source_faces[0]

            result = target_img.copy()

            for target_face in target_faces:
                result = self.swapper.get(result, target_face, source_face, paste_back=True)

            if color_correction:
                result = self._apply_color_correction(result, target_img, target_faces)

            if blend_strength < 1.0:
                result = cv2.addWeighted(target_img, 1 - blend_strength, result, blend_strength, 0)

            return result

        except Exception as e:
            logger.error(f"Face swap processing error: {e}")
            raise

    def _apply_color_correction(
        self,
        swapped_img: np.ndarray,
        original_img: np.ndarray,
        faces: list
    ) -> np.ndarray:
        try:
            result = swapped_img.copy()

            for face in faces:
                bbox = face.bbox.astype(int)
                x1, y1, x2, y2 = bbox

                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(original_img.shape[1], x2)
                y2 = min(original_img.shape[0], y2)

                if x2 <= x1 or y2 <= y1:
                    continue

                source_region = swapped_img[y1:y2, x1:x2]
                target_region = original_img[y1:y2, x1:x2]

                if source_region.size == 0 or target_region.size == 0:
                    continue

                source_mean = np.mean(source_region, axis=(0, 1))
                source_std = np.std(source_region, axis=(0, 1))
                target_mean = np.mean(target_region, axis=(0, 1))
                target_std = np.std(target_region, axis=(0, 1))

                corrected_region = source_region.astype(np.float32)
                corrected_region = (corrected_region - source_mean) * (target_std / (source_std + 1e-6)) + target_mean
                corrected_region = np.clip(corrected_region, 0, 255).astype(np.uint8)

                mask = np.ones((y2 - y1, x2 - x1), dtype=np.float32)
                center_y = (y2 - y1) // 2
                center_x = (x2 - x1) // 2
                for i in range(y2 - y1):
                    for j in range(x2 - x1):
                        dist = np.sqrt((i - center_y) ** 2 + (j - center_x) ** 2)
                        max_dist = np.sqrt(center_y ** 2 + center_x ** 2)
                        mask[i, j] = max(0, 1 - (dist / max_dist))

                mask = cv2.GaussianBlur(mask, (21, 21), 11)
                mask = mask[:, :, np.newaxis]

                result[y1:y2, x1:x2] = (
                    corrected_region * mask +
                    result[y1:y2, x1:x2] * (1 - mask)
                ).astype(np.uint8)

            return result

        except Exception as e:
            logger.warning(f"Color correction failed: {e}")
            return swapped_img

    def dispose(self):
        self.app = None
        self.swapper = None
        self.is_initialized = False
