from deepface import DeepFace
import tensorflow as tf
import numpy as np

tf.config.experimental.enable_op_determinism()

class FaceRecognition:
    def __init__(self, model_params={"detector": "retinaface", "recognition_model": 'Facenet512', "is_align": True}):
        self.detector = model_params["detector"]
        self.recognition_model = model_params["recognition_model"]
        self.align = model_params["is_align"]

    def extract_embedding(self, image_path):
        embedding = None
        try:
            embedding = DeepFace.represent(image_path, model_name=self.recognition_model, detector_backend=self.detector, align=self.align)
            embedding = np.array(embedding[0]["embedding"])
            
            # Normalize the embedding to have a unit norm
            embedding = embedding / np.linalg.norm(embedding)
            
            # Convert to list if needed
            embedding = embedding.tolist()

            tf.keras.backend.clear_session()
        except Exception as e:
            pass
        return embedding