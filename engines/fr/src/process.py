import sys
import time
from deepface import DeepFace

def process_image(image_path):
    # Replace this with the actual image processing code
    embedding = DeepFace.represent(image_path, model_name='Facenet512', detector_backend="retinaface", align=True)
    print(f"[+] {image_path}")

if __name__ == "__main__":
    # List of image paths passed as arguments
    image_paths = sys.argv[1:]

    for image_path in image_paths:
        process_image(image_path)
