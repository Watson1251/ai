from milvus_manager import MilvusManager
from face_recognition_exp import FaceRecognition
from data_loader import DataLoader
import os
from tqdm import tqdm
import json
import re
import math

def exponential_score(rank, a=5, b=0.5):
    """
    Exponential scoring function. Score decreases exponentially with rank.
    
    :param rank: The rank of the result.
    :param a: Maximum score for rank 1.
    :param b: Decay factor.
    :return: Score based on rank.
    """
    return a * math.exp(-b * (rank - 1))

def clean_filename(filename):
    # Remove file extension
    filename = filename.rsplit('.', 1)[0]
    # Remove any trailing underscores followed by numbers (e.g., _1, _2, _a)
    cleaned_name = re.sub(r'[_\d]+$', '', filename)
    # Replace underscores with nothing (for consistent comparison)
    return cleaned_name.replace('_', '').lower()
    
def search_face(milvus_manager, face_recognition, image_path, top_k=10):
    embedding = face_recognition.extract_embedding(image_path)
    if embedding is None:
        print("Failed to extract embedding.")
        return
    results = milvus_manager.search(embedding, top_k)
    return results

    # Print table header
    #print(f"{'Index':<6} {'Distance':<10} {'Path'}")

    # for idx, hits in enumerate(results):
    #     for id_, score in zip(hits.ids, hits.distances):
    #         img_path = milvus_manager.get_image_path(id_)
    #         print(f"{idx+1:<6} {score:<10.2f} {img_path}")
def search_face_and_calculate_accuracy(milvus_manager, face_recognition, test_folder, output_json, top_k=10):
    total_score = 0
    total_images = 0
    max_possible_score = 0  # To calculate the maximum score
    search_results = {}

    image_files = [f for f in os.listdir(test_folder) if f.endswith((".jpg", ".jpeg", ".png"))]

    # Initialize progress bar
    for filename in image_files:# tqdm(image_files, desc="Processing images"):
        test_image_path = os.path.join(test_folder, filename)
        
        # Clean the filename to extract the ground truth name
        ground_truth_name = clean_filename(filename)
        
        # Search using the provided search_face function
        # print(f"Searching for {test_image_path}...")
        results = search_face(milvus_manager, face_recognition, test_image_path, top_k)

        found = False
        search_data = {"ground_truth": ground_truth_name, "top_results": []}
        
        # Increment the maximum possible score (5 points per image if rank 1 is correct)
        max_possible_score += 5

        if results:
            # Access the first set of results
            hits = results[0]
            for idx, (id_, score) in enumerate(zip(hits.ids, hits.distances)):
                img_path = milvus_manager.get_image_path(id_)
                db_name = clean_filename(os.path.basename(img_path))  # Clean the filename for comparison
                
                # Store top 5 results
                if idx < 5:
                    search_data["top_results"].append({"rank": idx + 1, "db_name": db_name, "image_path": img_path, "score": score})

                # Check if the ground truth matches the result
                if db_name == ground_truth_name:
                    found = True
                    # Calculate the exponential score for this search and add to search data
                    exp_score = exponential_score(idx + 1)
                    print(f"[+] {db_name:<15} -> {ground_truth_name:<15} -> {exp_score:<15}")
                    search_data["exponential_score"] = exp_score
                    total_score += exp_score  # Apply the exponential scoring function
                    break

        if not found:
            # 0 points if not in the top 10
            search_data["top_results"].append({"rank": "Not in top 10", "db_name": None, "image_path": None, "score": 0})
            search_data["exponential_score"] = 0  # No score if not in top 10
        total_images += 1
        
        # Save individual search result
        search_results[filename] = search_data

    # Calculate accuracy percentage
    accuracy_percentage = (total_score / max_possible_score) * 100 if max_possible_score > 0 else 0

    # Write total results to the JSON file
    search_results["total_score"] = total_score
    search_results["max_possible_score"] = max_possible_score
    search_results["accuracy_percentage"] = accuracy_percentage

    # Save results to JSON file
    with open(output_json, 'w') as f:
        json.dump(search_results, f, indent=4)

    print(f"Total Score: {total_score}")
    print(f"Max Possible Score: {max_possible_score}")
    print(f"Accuracy Percentage: {accuracy_percentage}%")
    print(f"Results written to {output_json}")

def main():

   # model configuration
    # model configuration
    #recognition_model = "microsoft/swinv2-base-patch4-window8-256" #"google/vit-base-patch16-224-in21k"
    
    detector = "dlib"
    align = False
    recognition_model = "google/vit-huge-patch14-224-in21k" #"google/vit-base-patch16-224-in21k"
    embedding_dim = 1280
    similarity_metric = "cosine"
    metric_type = "IP"
    collection_name="faces_ViT_Huge_Cosine"
    # Set up index and search parameters
    index_params = {
        "index_type": "IVF_PQ",
        "params": {"nlist": 32768, "m": 64},
        "metric_type": metric_type
    }

    search_params = {
        "metric_type": metric_type,
        "params": {"nprobe": 128}
    }

    # Initialize components
    milvus_manager = MilvusManager(collection_name=collection_name, index_params=index_params, search_params=search_params, model_dim=embedding_dim)
    face_recognition = FaceRecognition(detector=detector, recognition_model=recognition_model, align=align)
    data_loader = DataLoader(milvus_manager, face_recognition)

    # Path to the test folder and output JSON
    test_folder = '/fr/test_data/test'
    output_json = f'/fr/test_data/{collection_name}_2.json'

    # Perform search and calculate accuracy, writing to a JSON file
    search_face_and_calculate_accuracy(milvus_manager, face_recognition, test_folder, output_json, top_k=10)

if __name__ == "__main__":
    main()