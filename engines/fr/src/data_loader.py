import os
import multiprocessing
from math import ceil
from face_recognition import FaceRecognition
import torch

# This is the function that exists for every process (multiprocessing)
def worker_function(face_recognition, image_paths_chunk):
    # Create an instance of DataProcessor in each process
    data_processor = DataProcessor(face_recognition)
    for image_path in image_paths_chunk:
        data_processor.process_image(image_path)


class DataProcessor:
    def __init__(self, face_recognition):
        self.face_recognition = face_recognition
        # face_recognition_temp = FaceRecognition(
        #     detector=face_recognition.detector,
        #     recognition_model=face_recognition.recognition_model,
        #     align=face_recognition.align
        # )
        self.embeddings = []

    def process_image(self, image_path):
        try:
            embedding = self.face_recognition.extract_embedding(image_path)
            print(f"Processing {image_path} (Process ID: {os.getpid()})")
        except Exception as e:
            print(f"Error processing {image_path}: {e} (Process ID: {os.getpid()})")
        finally:
            # Clear GPU memory after processing each image
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

class DataLoader:
    def __init__(self, milvus_manager, face_recognition):
        self.milvus_manager = milvus_manager
        self.face_recognition = face_recognition

    def insert_face_embedding(self, image_path):
        embedding = self.face_recognition.extract_embedding(image_path)
        if embedding is None:
            return
        self.milvus_manager.insert_data([embedding], [image_path])
    
    def get_image_paths(self, dataset_path):
        image_paths = []
        for root, dirs, files in os.walk(dataset_path):
            for file in files:
                if file.endswith(('.jpg', '.jpeg', '.png')):
                    image_path = os.path.join(root, file)
                    image_paths.append(image_path)
        return image_paths
    
    def handle_multiprocessing(self, image_paths):

        # Determine the number of CPUs to use (80% of available CPUs)
        available_cpus = multiprocessing.cpu_count()
        num_cpus_to_use = max(1, int(available_cpus * 0.8))  # Ensure at least 1 CPU is used
        
        print(f"image_paths: {len(image_paths)}")
        print(f"num_of_cpus: {num_cpus_to_use}/{available_cpus} CPUs")

        # hold up some gpu resources
        # total_gpu_memory = torch.cuda.get_device_properties(0).total_memory
        # memory_limit_per_process = total_gpu_memory * 0.8 / num_cpus_to_use
        # total_gpu_memory_MB = total_gpu_memory / (1024 ** 2)
        # total_gpu_memory_GB = total_gpu_memory / (1024 ** 3)

        # Split the image_paths into chunks, one for each CPU
        chunk_size = ceil(len(image_paths) / num_cpus_to_use)
        image_path_chunks = [image_paths[i:i + chunk_size] for i in range(0, len(image_paths), chunk_size)]

        # Create a pool of workers
        with multiprocessing.Pool(processes=num_cpus_to_use) as pool:
            # Prepare the arguments as tuples to be unpacked
            args = [(self.face_recognition, chunk) for chunk in image_path_chunks]

            # Use pool.map to distribute chunks of image_paths to worker processes
            pool.starmap(worker_function, args)
        

    def process_dataset(self, dataset_path):
        image_paths = self.get_image_paths(dataset_path)
        self.handle_multiprocessing(image_paths)

        # do split the paths into all available cpus, and call this function in parallel
        image_path = image_paths[0]
        embedding = self.face_recognition.extract_embedding(image_path)
