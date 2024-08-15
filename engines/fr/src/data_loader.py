import os
from concurrent.futures import ThreadPoolExecutor, as_completed

class DataLoader:
    def __init__(self, milvus_manager, face_recognition):
        self.milvus_manager = milvus_manager
        self.face_recognition = face_recognition

    def insert_face_embedding(self, image_path):
        embedding = self.face_recognition.extract_embedding(image_path)
        if embedding is None:
            return
        self.milvus_manager.insert_data([embedding], [image_path])

    def process_dataset(self, dataset_path):
        for root, dirs, files in os.walk(dataset_path):
            for file in files:
                if file.endswith(('.jpg', '.jpeg', '.png')):
                    image_path = os.path.join(root, file)
                    print(f"Ingesting: {image_path}")
                    self.insert_face_embedding(image_path)
