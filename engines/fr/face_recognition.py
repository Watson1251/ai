from deepface import DeepFace
import tensorflow as tf
import numpy as np

tf.config.experimental.enable_op_determinism()

class DeepFaceData:
    def __init__(self, facial_area, face_confidence, embedding):
        self.facial_area = facial_area
        self.face_confidence = face_confidence
        self.embedding = embedding

class FaceRecognition:
    def __init__(self, model_params={"detector": "retinaface", "recognition_model": 'Facenet512', "is_align": True}):
        self.detector = model_params["detector"]
        self.recognition_model = model_params["recognition_model"]
        self.align = model_params["is_align"]
    
    def normalize(self, embedding):
        np_embedding = np.array(embedding)
        normalized = np_embedding / np.linalg.norm(np_embedding)
        return normalized.tolist()

    def construct_facial_area(self, facial_area):
        x = facial_area['x']
        y = facial_area['y']
        w = facial_area['w']
        h = facial_area['h']
        left_eye_x, left_eye_y = facial_area['left_eye']
        right_eye_x, right_eye_y = facial_area['right_eye']

        # 8 items: [x, y, w, h, left_eye_x, left_eye_y, right_eye_x, right_eye_y]
        # joint them all in one string with underscore
        result = f"{x}_{y}_{w}_{h}_{left_eye_x}_{left_eye_y}_{right_eye_x}_{right_eye_y}"
        return result

    def extract_embedding(self, image_path):
        results = []
        try:
            faces = DeepFace.represent(image_path, model_name=self.recognition_model, detector_backend=self.detector, align=self.align)

            for face in faces:
                embedding = face["embedding"]
                facial_area = face["facial_area"]
                face_confidence = face["face_confidence"]
                
                # Normalize the embedding to have a unit norm
                normalized_embedding = self.normalize(embedding)
                facial_area_vector = self.construct_facial_area(facial_area)
                
                # bundle and add to results
                fr_data: DeepFaceData = DeepFaceData(
                    facial_area=facial_area_vector,
                    face_confidence=face_confidence,
                    embedding=normalized_embedding
                )
                results.append(fr_data)

            tf.keras.backend.clear_session()
        except Exception as e:
            pass
        return results