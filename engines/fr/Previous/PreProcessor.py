import numpy as np
import tensorflow as tf
from PIL import Image


class PreProcessor:
    @staticmethod
    def resize_image(image, size=(160, 160)):
        try:
            image = Image.fromarray(image)
            image = image.resize(size)
            return np.array(image)
        except Exception as e:
            print(f"Error resizing image: {e}")
            return None

    @staticmethod
    def normalize_image(image):
        image = image.astype('float32')
        mean, std = image.mean(), image.std()
        image = (image - mean) / std
        return image

    @staticmethod
    def preprocess_image(image, size=(160, 160)):
        image = PreProcessor.resize_image(image, size)
        image = PreProcessor.normalize_image(image)
        return image
