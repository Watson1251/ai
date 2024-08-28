import ray
from deepface import DeepFace
import os
from glob import glob
import time

# Start time
start_time = time.time()
print(f"[*] Start Time: {start_time}")

# Initialize Ray
ray.init()

# Function to extract embeddings using DeepFace
@ray.remote(num_gpus=1)  # Specify that each task will use 1 GPU
def extract_embedding(image_path, model_name='Facenet512'):
    try:
        # Extract embedding using DeepFace
        embedding = DeepFace.represent(img_path=image_path, model_name=model_name, enforce_detection=False)
        print(f"[+] Processed {image_path}")
        return (image_path, embedding)
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return (image_path, None)

    
def get_image_paths(dataset_path):
    image_paths = []
    for root, dirs, files in os.walk(dataset_path):
        for file in files:
            if file.endswith(('.jpg', '.jpeg', '.png')):
                image_path = os.path.join(root, file)
                image_paths.append(image_path)
    return image_paths
    
# Path to your dataset
dataset_dir = '/fr/Previous/dataset'  # Replace with the actual path to your dataset

# Get a list of all image paths (modify the glob pattern if your images are in different formats)
image_paths = get_image_paths(dataset_dir)

# Start parallel processing of image embeddings
futures = [extract_embedding.remote(image_path) for image_path in image_paths]

# Collect the results
results = ray.get(futures)

# Optionally, save the results or process them further
# Example: Save to a file
with open("embeddings_results.txt", "w") as f:
    for image_path, embedding in results:
        if embedding is not None:
            f.write(f"{image_path}: {embedding}\n")
        else:
            f.write(f"{image_path}: Failed to extract embedding\n")


# End time
end_time = time.time()
print(f"[*] End Time: {end_time}")

# Calculate execution time
execution_time = end_time - start_time
print(f"Execution time: {execution_time} seconds")