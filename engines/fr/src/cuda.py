import os
from deepface import DeepFace
from concurrent.futures import ProcessPoolExecutor, as_completed
import torch

# Set the maximum GPU memory allocated
torch.cuda.set_per_process_memory_fraction(0.8, 0)  # Use 80% of GPU memory

def process_image(image_path):
    """
    Process a single image to extract its embedding, and clears GPU memory.
    
    Args:
    - image_path (str): Path to the image file.
    
    Returns:
    - dict: A dictionary containing image path and its embedding.
    """
    try:
        embedding = DeepFace.represent(img_path=image_path, model_name='Facenet512', detector_backend='retinaface', enforce_detection=False)
        return {"image_path": image_path, "embedding": embedding}
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None
    finally:
        # Clear GPU memory after processing each image
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

def parallel_process_images(image_paths, max_workers=4):
    """
    Process images in parallel to extract embeddings, clearing GPU memory after each process.
    
    Args:
    - image_paths (list): List of image file paths.
    - max_workers (int): Number of worker processes to use.
    
    Returns:
    - list: List of dictionaries containing image paths and their embeddings.
    """
    results = []
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(process_image, image_path): image_path for image_path in image_paths}
        for future in as_completed(futures):
            result = future.result()
            if result:
                results.append(result)
    return results

if __name__ == "__main__":
    # Example: Replace with your actual image directory
    dataset_directory = '/fr/Previous/dataset'
    
    # Recursively gather all image paths
    image_paths = [os.path.join(dp, f) for dp, dn, filenames in os.walk(dataset_directory) for f in filenames if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    # Process images in parallel
    embeddings = parallel_process_images(image_paths, max_workers=8)
    
    # Now, you can flush the data to the database as needed.
    # Example: flush_to_db(embeddings)