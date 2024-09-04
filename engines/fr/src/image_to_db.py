import os
from tqdm import tqdm
from multiprocessing import Pool, cpu_count
import tensorflow as tf
import time
import gc
from face_recognition import FaceRecognition

class ImageToDB:
    def __init__(self, milvus_manager):
        self.milvus_manager = milvus_manager

    @staticmethod
    def get_embedding(image_path):
        face_recognition = FaceRecognition()
        embedding = face_recognition.extract_embedding(image_path)

        # if embedding is not None:
        #     self.milvus_manager.insert_data([embedding], [image_path])
        return embedding

    def insert_to_db(self, data):
        pass

    def process_dataset(self, dataset_path):
        paths = []
        for root, dirs, files in os.walk(dataset_path):
            for file in files:
                if file.endswith(('.jpg', '.jpeg', '.png')):
                    image_path = os.path.join(root, file)
                    paths.append(image_path)

        # Initialize a list to store embeddings
        all_embeddings = []

        # Use multiprocessing Pool to parallelize the embedding extraction
        # Adjust the third argument to set a reasonable limit
        num_workers = min(cpu_count(), len(paths), 12)
        with Pool(num_workers) as pool:

            # Collect embeddings in parallel
            for result in tqdm(pool.imap_unordered(self.get_embedding, paths), total=len(paths)):
                if result is not None:
                    all_embeddings.append(result)
                # image_path, embedding = result
                # if embedding is not None:
                #     all_embeddings.append((image_path, embedding))  # Store only valid embeddings
            
            print(len(all_embeddings))
