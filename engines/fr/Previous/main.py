import os
import warnings
import cv2
import numpy as np
from matplotlib import pyplot as plt
from DataLoader import DataLoader
from PreProcessor import PreProcessor
from FaceExtractor import FaceExtractor
from FaceRecognition import FaceRecognition

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Suppress specific Keras warnings
warnings.filterwarnings("ignore", category=UserWarning, module='keras')

def visualize(image):
    # Visualize the image using matplotlib
    plt.imshow(image)
    plt.axis('off')  # Hide axes
    plt.show()

def main():
    data_loader = DataLoader()
    pre_processor = PreProcessor()
    face_extractor = FaceExtractor()
    face_recognition = FaceRecognition()

    # Example of loading images
    path = 'dataset/'
    images = data_loader.load_images_from_directory(path)

    # Example of extracting faces
    faces = face_extractor.extract_faces(images)
    if not faces:
        print("No faces found.")
        return
    
    for i, (face, label) in enumerate(faces):
        # Example of preprocessing the image
        preprocessed_face = pre_processor.preprocess_image(face)

        # Example of getting embeddings
        embedding = face_recognition.get_embedding(preprocessed_face)
        print(f"Embedding shape for face {i+1} with label {label}: {embedding.shape}")

if __name__ == "__main__":
    main()
