from deepface import DeepFace
import tensorflow as tf
import numpy as np

tf.config.experimental.enable_op_determinism()

class FaceRecognition2:
    def __init__(self, detector="retinaface", recognition_model='Facenet512', align=True):
        self.detector = detector
        self.recognition_model = recognition_model
        self.align = align

    def extract_embedding(self, image_path):
        embedding = None
        try:
            embedding = DeepFace.represent(image_path, model_name=self.recognition_model, detector_backend=self.detector, align=self.align)
            embedding = np.array(embedding[0]["embedding"])
            
            # Normalize the embedding to have a unit norm
            embedding = embedding / np.linalg.norm(embedding)
            
            # Convert to list if needed
            embedding = embedding.tolist()
        except Exception as e:
            pass
        return embedding