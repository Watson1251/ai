import os
from tqdm import tqdm

class DataLoader:
    def __init__(self, milvus_manager, face_recognition):
        self.milvus_manager = milvus_manager
        self.face_recognition = face_recognition
        self.embeddings = []
        self.image_paths = []

    def insert_face_embedding(self, image_path):
        embedding = self.face_recognition.extract_embedding(image_path)
        if embedding is not None:
            self.embeddings.append(embedding)
            self.image_paths.append(image_path)

    def process_dataset(self, dataset_path):
        # Calculate total number of images to process
        total_files = sum([len(files) for _, _, files in os.walk(dataset_path) if any(f.endswith(('.jpg', '.jpeg', '.png')) for f in files)])
        
        with tqdm(total=total_files, desc="Processing Images") as pbar:
            for root, dirs, files in os.walk(dataset_path):
                for file in files:
                    if file.endswith(('.jpg', '.jpeg', '.png')):
                        image_path = os.path.join(root, file)
                        self.insert_face_embedding(image_path)
                        pbar.update(1)  # Update the progress bar

        # Flush all data into the database after processing the entire dataset
        self.flush_data()

    def flush_data(self):
        if self.embeddings and self.image_paths:
            self.milvus_manager.insert_data(self.embeddings, self.image_paths)
            print(f"Inserted {len(self.embeddings)} embeddings into the database.")
            self.embeddings.clear()
            self.image_paths.clear()
