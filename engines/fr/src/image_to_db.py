import os
import json
from tqdm import tqdm
from multiprocessing import Pool, cpu_count
from face_recognition import FaceRecognition

class ImageToDB:
    def __init__(self, milvus_manager):
        self.milvus_manager = milvus_manager
        self.image_extensions = ('.jpg', '.jpeg', '.png')
        self.log_file = "/fr/logs/paths_batched.json"
        self.path_batch_size = 5000

    @staticmethod
    def get_embedding(image_path):
        face_recognition = FaceRecognition()
        embedding = face_recognition.extract_embedding(image_path)

        # if embedding is not None:
        #     self.milvus_manager.insert_data([embedding], [image_path])
        return embedding

    def insert_to_db(self, data):
        pass

    def save_path_batch_logs(self, paths):

        print(f"[+] Saving path batches into {self.log_file}...")

        # create log file
        log_dir = os.path.dirname(self.log_file)
        os.makedirs(log_dir, exist_ok=True)

        batch_size = self.path_batch_size
        batches = {f"batch_{i + 1}": paths[i * batch_size:(i + 1) * batch_size] for i in range((len(paths) + batch_size - 1) // batch_size)}

        # Save batches to a JSON file
        with open(self.log_file, 'w') as log_file:
            json.dump(batches, log_file, indent=4)
        
        return batches

    def multiprocess_extraction(self, paths):
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

    def process_dataset(self, dataset_path):
        paths = []
    
        # Use tqdm to show a progress bar
        print(f"[+] Building image paths...")
        for root, dirs, files in os.walk(dataset_path):
            for file in files:
                if file.endswith(self.image_extensions):
                    image_path = os.path.join(root, file)
                    paths.append(image_path)

        # Sort paths and save logs
        paths.sort()
        batches = self.save_path_batch_logs(paths)

        # Loop through each batch and process the keys
        for batch_key in batches:
            print(f"Processing {batch_key} with {len(batches[batch_key])} paths")
            self.multiprocess_extraction(batches[batch_key])

            # Here you can add your processing code for each batch
            # for path in batches[batch_key]:
            #     # Do something with each path
            #     pass

        # Initialize a list to store embeddings
        all_embeddings = []

        # Use multiprocessing Pool to parallelize the embedding extraction
        # Adjust the third argument to set a reasonable limit
        # num_workers = min(cpu_count(), len(paths), 12)
        # with Pool(num_workers) as pool:

        #     # Collect embeddings in parallel
        #     for result in tqdm(pool.imap_unordered(self.get_embedding, paths), total=len(paths)):
        #         if result is not None:
        #             all_embeddings.append(result)
        #         # image_path, embedding = result
        #         # if embedding is not None:
        #         #     all_embeddings.append((image_path, embedding))  # Store only valid embeddings
            
        #     print(len(all_embeddings))
