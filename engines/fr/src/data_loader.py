import os
from deepface import DeepFace
from tqdm import tqdm
from multiprocessing import Pool, cpu_count
import tensorflow as tf

class DataLoader:
    def __init__(self, milvus_manager, face_recognition):
        self.milvus_manager = milvus_manager
        self.face_recognition = face_recognition

    def insert_face_embedding(self, image_path):
        try:
            embedding = DeepFace.represent(image_path, model_name='Facenet512', detector_backend='retinaface', align=True)
        except Exception as e:
            pass
        # embedding = self.face_recognition.extract_embedding(image_path)
        # if embedding is None:
        #     return
        # self.milvus_manager.insert_data([embedding], [image_path])
    
    @staticmethod
    def get_embeddings(self, image_path):
        embedding = self.face_recognition.extract_embedding(image_path)
        return embedding
        if embedding is None:
            return
        # self.milvus_manager.insert_data([embedding], [image_path])

    @staticmethod
    def extract(image_path):
        try:
            # Extract the embedding
            embedding = DeepFace.represent(
                image_path, model_name='Facenet512', detector_backend='retinaface', align=True
            )
            
            # After processing, clear TensorFlow session to free up GPU memory
            tf.keras.backend.clear_session()

            return (image_path, embedding)
            
        except Exception as e:
            # Handle exceptions (log or print for debugging)
            print(f"Error processing {image_path}: {e}")

            return (image_path, None)

    def process_dataset(self, dataset_path):
        paths = []
        for root, dirs, files in os.walk(dataset_path):
            for file in files:
                if file.endswith(('.jpg', '.jpeg', '.png')):
                    image_path = os.path.join(root, file)
                    # print(f"Ingesting: {image_path}")
                    paths.append(image_path)

        # Initialize a list to store embeddings
        all_embeddings = []

        # Use multiprocessing Pool to parallelize the embedding extraction
        num_workers = min(cpu_count(), len(paths), 12)  # Adjust the third argument to set a reasonable limit
        with Pool(num_workers) as pool:
            # Use imap_unordered to process paths in parallel
            # list(tqdm(pool.imap_unordered(self.extract, paths), total=len(paths)))

            # Collect embeddings in parallel
            for result in tqdm(pool.imap_unordered(self.extract, paths), total=len(paths)):
                image_path, embedding = result
                if embedding is not None:
                    all_embeddings.append((image_path, embedding))  # Store only valid embeddings
            
            print(len(all_embeddings))
