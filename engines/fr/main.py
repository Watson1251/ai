import re
import torch
import os
import sys
from deepface import DeepFace
from flask import Flask, request, jsonify
import logging
from milvus_manager import MilvusManager
from face_recognition import FaceRecognition

# Configure logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

model_name = 'ArcFace'
detector_backend = 'retinaface'

embedding_dim = 512
# similarity_metric = "L2"
similarity_metric = "IP" # Use Inner Product (Cosine Similarity) for similarity search

# model configuration
model_params = {
    "detector": detector_backend,
    "recognition_model": model_name,
    "is_align": True
}

# Set up index and search parameters
index_params = {
    "index_type": "IVF_PQ",
    "params": {"nlist": 32768, "m": 64},
    "metric_type": similarity_metric
}

search_params = {
    "metric_type": similarity_metric,
    "params": {"nprobe": 128}
}

# Initialize FaceRecognition and MilvusManager
face_recognition = FaceRecognition(model_params)
milvus_manager = MilvusManager(index_params=index_params, search_params=search_params, model_dim=embedding_dim)


def search_face(milvus_manager, face_recognition, image_path, top_k=10):
    embeddings_data = face_recognition.extract_embedding(image_path)
    
    if not embeddings_data:
        logging.error("Failed to extract any valid embeddings.")
        return {"message": "No embeddings found"}

    search_results = []
    index = 1

    for face_data in embeddings_data:
        embedding = face_data.embedding

        if embedding is None or not isinstance(embedding, list) or not all(isinstance(e, (float, int)) for e in embedding):
            logging.error(f"Invalid embedding for face {index}.")
            continue  # Skip to the next face

        try:
            # Perform search in Milvus with top_k results
            results = milvus_manager.search(embedding, top_k)
            metric_type = milvus_manager.search_params['metric_type']

            # Table header for search results
            if metric_type == "IP":
                header = f"{'Index':<6} {'Similarity Score':<20} {'ID':<30} {'Path':<40} {'NameAr':<20} {'NameEn':<20} {'Birthdate':<12} {'Nationality':<20}"
            else:  # L2 distance
                header = f"{'Index':<6} {'L2 Distance':<20} {'ID':<30} {'Path':<40} {'NameAr':<20} {'NameEn':<20} {'Birthdate':<12} {'Nationality':<20}"

            print(header)

            for hits in results:
                for id_, score in zip(hits.ids, hits.distances):
                    # Get additional data from Milvus for each result
                    record = milvus_manager.collection.query(
                        expr=f"record_id == {id_}",
                        output_fields=["person_id", "image_path", "nameAr", "nameEn", "birthdate", "nationality"]
                    )[0]  # Assume there's exactly one result for the ID

                    img_id = record["person_id"]
                    img_path = record["image_path"]
                    nameAr = record["nameAr"]
                    nameEn = record["nameEn"]
                    birthdate = record["birthdate"]
                    nationality = record["nationality"]
                    similarity_score = score * 100

                    print(f"{index:<6} {similarity_score:<20.4f} {img_id:<30} {img_path:<40} {nameAr:<20} {nameEn:<20} {birthdate:<12} {nationality:<20}")
                    
                    search_results.append({
                        'index': index,
                        'similarity_score': similarity_score,
                        'image_id': img_id,
                        'image_path': img_path,
                        'nameAr': nameAr,
                        'nameEn': nameEn,
                        'birthdate': birthdate,
                        'nationality': nationality
                    })
                    index += 1

        except Exception as e:
            logging.error(f"Error during Milvus search for face {index}: {e}")

    return {"results": search_results}



@app.route('/search-face', methods=['POST'])
def search_face_req():
    try:
        data = request.get_json()
        image_path = data['path']
        top_k = data.get('top_k', 200)

        result = search_face(milvus_manager, face_recognition, image_path, top_k)

        if result.get("message"):
            return jsonify({'message': result["message"], 'results': []})
        
        return jsonify({'message': 'Search completed successfully', 'results': result["results"]})
    
    except Exception as e:
        logging.error(f"Error occurred: {e}")
        return jsonify({'message': str(e), 'results': []})


def process_image(image_path):
    """
    Extract embedding from an image.
    """
    try:
        embedding = DeepFace.represent(image_path, model_name=model_name, detector_backend=detector_backend, align=True)
        return embedding
    except Exception as e:
        logging.error(f"Error processing image {image_path}: {e}")
        return None


def extract_faces(image_path):
    """
    Extract faces from an image.
    """
    try:
        # extract faces
        faces = DeepFace.extract_faces(image_path, detector_backend=detector_backend, align=True)
        
        # Remove the "face" key from each object if it exists
        for obj in faces:
            obj.pop("face", None)
        
        return faces

    except Exception as e:
        logging.error(f"No faces detected in {image_path}: {e}")
        return None  # Return None if no faces are detected


@app.route('/extract-faces', methods=['POST'])  # Ensure no trailing slash
def extract_faces_req():
    result = {}
    try:
        data = request.get_json()
        path = data['path']

        print(path)

        # extract_faces
        faces = extract_faces(path)

        if faces is not None:
            result = {
                'message': 'Processed data successfully',
                'result': faces
            }
        else:
            result = {
                'message': 'No faces detected!',
                'result': []
            }

    except Exception as e:
        logging.error(f"{e}")

        result = {
            'message': f"{e}",
            'result': []
        }

    return jsonify(result)


if __name__ == "__main__":
    app.run()
    logging.info("Flask app is running.")
