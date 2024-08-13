from deepface import DeepFace
from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection, utility
import numpy as np
import tensorflow as tf
import os

tf.config.experimental.enable_op_determinism()


recognition_model = 'Facenet512'
model_dim = 512
is_align = True
detector = "retinaface"
metric = "cosine" # "l2"

# Step 1: Connect to Milvus
connections.connect("default", host="10.13.13.161", port="19530")

# Step 2: Define the Milvus schema with an additional image_path field
fields = [
    FieldSchema(name="face_id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=model_dim),
    FieldSchema(name="image_path", dtype=DataType.VARCHAR, max_length=500),
]
schema = CollectionSchema(fields, "Face recognition schema")
collection = Collection("faces", schema)

# Step 3: Extract face embeddings using DeepFace
def extract_face_embedding(image_path):
    embedding = None
    try:
        embedding = DeepFace.represent(image_path, model_name=recognition_model, detector_backend=detector, align=is_align)
        embedding = np.array(embedding[0]["embedding"]).tolist()
    except Exception as e:
        pass

    return embedding

# Step 4: Ingest the embedding and image path into Milvus
def insert_face_embedding(image_path):
    embedding = extract_face_embedding(image_path)
    if embedding is None:
        return
    
    # Separate embeddings and paths into different lists
    collection.insert([[embedding], [image_path]])

    if len(collection.indexes) == 0:
        index_params = {
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128},
            "metric_type": "L2"
        }
        collection.create_index("embedding", index_params)

    collection.load()

# Step 6: Process all images in the nested directories
def process_dataset(dataset_path):
    for root, dirs, files in os.walk(dataset_path):
        for file in files:
            if file.endswith(('.jpg', '.jpeg', '.png')):
                image_path = os.path.join(root, file)
                print(f"Ingesting: {image_path}")
                insert_face_embedding(image_path)

# Step 7: Search for a face in Milvus and display the matched images
def search_face(image_path, top_k=10):
    embedding = extract_face_embedding(image_path)
    search_params = {"metric_type": "L2", "params": {"nprobe": 10}}
    results = collection.search([embedding], "embedding", search_params, top_k)

    for hits in results:
        for idx, score in zip(hits.ids, hits.distances):
            print(f"Face ID: {idx}, Distance: {score}")
            # Retrieve the image path from the collection
            img_path = collection.query(expr=f"face_id == {idx}", output_fields=["image_path"])[0]["image_path"]
            print(img_path)


# Example usage
dataset_path = '/fr/Previous/dataset'

img1 = '/fr/obama.jpg'
img2 = '/fr/lookalike.jpg'
# process_dataset(dataset_path)
search_face(img2)