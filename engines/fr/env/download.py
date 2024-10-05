import os
from deepface import DeepFace

# List of all available models in DeepFace
fr_models = [
    "VGG-Face", 
    "Facenet", 
    "Facenet512", 
    "OpenFace", 
    # "DeepFace", 
    "DeepID", 
    "ArcFace", 
    "Dlib", 
    "SFace",
    "GhostFaceNet",
]

# Detectors available for DeepFace
detectors = [
    'opencv', 
    'ssd', 
    'dlib', 
    'mtcnn', 
    'fastmtcnn',
    'retinaface', 
    'mediapipe',
    'yolov8',
    'yunet',
    'centerface',
]

other_models = [
    'age',
    'gender',
    'race',
    'emotion'
]

def download_models():

    test_image = '/fr/env/test_image.jpg'

    # start with default models
    embeddings = DeepFace.represent(img_path=test_image, model_name="Facenet512", detector_backend="retinaface")

    # download fr models
    for model in fr_models:
        print(f"[+] {model}")
        embeddings = DeepFace.represent(img_path=test_image, model_name=model)
    
    # download detectors
    for detector in detectors:
        print(f"[+] {detector}")
        embeddings = DeepFace.represent(img_path=test_image, detector_backend=detector)
    
    # download age, gender, race, and emotion models
    objs = DeepFace.analyze(img_path=test_image, actions=other_models,)

if __name__ == "__main__":
    # download_models()
    pass