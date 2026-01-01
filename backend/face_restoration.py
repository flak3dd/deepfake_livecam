import cv2
import numpy as np
from typing import Optional
import logging
from model_manager import model_manager

logger = logging.getLogger(__name__)

class FaceRestoration:
    def __init__(self):
        self.is_initialized = False
        self.gfpgan = None

    async def initialize(self):
        if self.is_initialized:
            return

        try:
            logger.info("Initializing face restoration with GFPGAN v1.4...")
            self.gfpgan = await model_manager.get_gfpgan_restorer()
            self.is_initialized = True
            logger.info("Face restoration initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize GFPGAN: {e}")
            logger.warning("Will use fallback restoration methods")
            self.gfpgan = None
            self.is_initialized = True

    async def restore(
        self,
        img: np.ndarray,
        strength: float = 0.5,
        denoise_level: float = 0.3,
        sharpen_amount: float = 0.2,
        enhance_details: bool = True
    ) -> np.ndarray:
        if not self.is_initialized:
            await self.initialize()

        try:
            result = img.copy()

            if self.gfpgan is not None:
                logger.info("Using GFPGAN for face restoration")
                result = self._restore_with_gfpgan(result, strength)
            else:
                logger.info("Using traditional restoration methods")
                if denoise_level > 0:
                    result = self._denoise(result, denoise_level)

                if enhance_details:
                    result = self._enhance_details(result)

                if sharpen_amount > 0:
                    result = self._sharpen(result, sharpen_amount)

                if strength < 1.0:
                    result = cv2.addWeighted(img, 1 - strength, result, strength, 0)

            return result

        except Exception as e:
            logger.error(f"Face restoration error: {e}")
            raise

    def _restore_with_gfpgan(self, img: np.ndarray, strength: float) -> np.ndarray:
        try:
            img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

            _, _, restored_img = self.gfpgan.enhance(
                img_bgr,
                has_aligned=False,
                only_center_face=False,
                paste_back=True,
                weight=strength
            )

            if restored_img is not None:
                result = cv2.cvtColor(restored_img, cv2.COLOR_BGR2RGB)
                return result
            else:
                logger.warning("GFPGAN returned None, using original image")
                return img

        except Exception as e:
            logger.error(f"GFPGAN restoration failed: {e}")
            return img

    def _denoise(self, img: np.ndarray, level: float) -> np.ndarray:
        h = int(level * 10)
        if h < 1:
            return img

        return cv2.fastNlMeansDenoisingColored(img, None, h, h, 7, 21)

    def _enhance_details(self, img: np.ndarray) -> np.ndarray:
        lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)

        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2RGB)

        return enhanced

    def _sharpen(self, img: np.ndarray, amount: float) -> np.ndarray:
        gaussian = cv2.GaussianBlur(img, (0, 0), 2.0)
        sharpened = cv2.addWeighted(img, 1.0 + amount, gaussian, -amount, 0)

        return sharpened

    def dispose(self):
        self.is_initialized = False
        self.gfpgan = None
