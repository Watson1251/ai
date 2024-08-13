import os
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
from tqdm import tqdm


class DataLoader:
    @staticmethod
    def load_image_single(image_path):
        try:
            image = Image.open(image_path).convert('RGB')
            image_id = os.path.basename(os.path.dirname(image_path))
            return np.array(image), image_id
        except Exception as e:
            print(f"Error loading image {image_path}: {e}")
            return None, None

    @staticmethod
    def load_image(image_path):
        image, image_id = DataLoader.load_image_single(image_path)
        if image is not None:
            return [(image, image_id)]
        else:
            return []

    @staticmethod
    def load_images_from_directory(directory_path):
        images = []
        image_files = []
        for root, _, files in os.walk(directory_path):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
                    image_path = os.path.join(root, file)
                    image_id = os.path.basename(root)
                    image_files.append((image_path, image_id))

        for image_path, image_id in tqdm(image_files, desc="Loading images"):
            image, image_id = DataLoader.load_image_single(image_path)
            if image is not None:
                images.append((image, image_id))
        return images
