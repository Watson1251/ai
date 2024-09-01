from deepface import DeepFace
from transformers import ViTModel, AutoImageProcessor
import numpy as np
from PIL import Image
import torch

class FaceRecognition:
    def __init__(self, detector="retinaface", recognition_model="jayanta/vit-base-patch16-224-in21k-face-recognition", align=True):
        self.detector = detector
        self.recognition_model = recognition_model
        self.align = align
        self.processor = AutoImageProcessor.from_pretrained(self.recognition_model)
        self.model = ViTModel.from_pretrained(self.recognition_model)

    def detect_faces(self, image_path):
        # Use DeepFace for face detection
        try:
            # detected_faces = DeepFace.detectFace(image_path, detector_backend=self.detector, align=self.align, enforce_detection=False)
            detected_faces = DeepFace.extract_faces(image_path, detector_backend=self.detector, align=self.align, enforce_detection=False)
            print(f"Detected faces: {detected_faces}")
            return detected_faces
        except Exception as e:
            print(f"Error in face detection: {str(e)}")
            return None

    def extract_embedding(self, image_path):
        embedding = None
        try:
            # Detect a single face using DeepFace
            face_images = self.detect_faces(image_path)
            if face_images is not None:
                # Squeeze out any extra dimensions, ensuring we get (224, 224, 3)
                face_image = np.squeeze(face_images)
                
                # Convert detected face image to uint8 if necessary
                face_image = (face_image * 255).astype(np.uint8)
                
                # Ensure the image is in (224, 224, 3) format
                face_image = Image.fromarray(face_image).resize((224, 224))
                face_image = np.array(face_image).astype(np.float32) / 255.0  # Normalize to [0, 1]

                # Process the image using Hugging Face's processor
                inputs = self.processor(images=face_image, return_tensors="pt", do_rescale=False)

                # Move tensors to GPU if available
                device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
                self.model.to(device)
                inputs = {k: v.to(device) for k, v in inputs.items()}

                # Extract the embedding from the model's output (CLS token)
                outputs = self.model(**inputs)

                embedding = outputs.last_hidden_state[:, 0, :].detach().cpu().numpy().flatten()
                # print(embedding)
                # Convert embedding to list for further use
                embedding = embedding.tolist()
            else:
                print("No face detected.")
        except Exception as e:
            print(f"Error in embedding extraction: {str(e)}")

        return embedding

if __name__ == "__main__":
    # Usage example
    recognition = FaceRecognition()
    embedding = recognition.extract_embedding("/fr/test_data/test/AliSoudAlBimani_3.jpg")
    print(embedding)
