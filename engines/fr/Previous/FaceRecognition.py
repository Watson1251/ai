import tensorflow as tf
import numpy as np

class FaceRecognition:
    def __init__(self, model_path='FaceNet'):
        try:
            self.model = tf.keras.models.load_model(model_path)
        except TypeError as e:
            print(f"Error loading model: {e}")
            print("Attempting to load model with custom objects...")
            self.model = tf.keras.models.load_model(model_path, compile=False)
    
    def get_embedding(self, face_pixels):
        face_pixels = face_pixels.astype('float32')
        mean, std = face_pixels.mean(), face_pixels.std()
        face_pixels = (face_pixels - mean) / std
        samples = np.expand_dims(face_pixels, axis=0)
        yhat = self.model.predict(samples)
        return yhat[0]
