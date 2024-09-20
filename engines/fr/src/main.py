import os
from milvus_manager import MilvusManager
from face_recognition import FaceRecognition
from image_to_db import ImageToDB
from rabbit_mq import RabbitMQ


# Example usage
dataset_path = '/fr/dataset'
# dataset_path = '/fr/large_dataset'

targeted_workers = 12
do_publish = True

embedding_dim = 512
similarity_metric = "L2"
# similarity_metric = "IP" # Use Inner Product (Cosine Similarity) for similarity search

# model configuration
model_params = {
    "detector": "retinaface",
    "recognition_model": 'Facenet512',
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

# Initialize RabbitMQ
rabbit_mq = RabbitMQ()
if rabbit_mq is None:
    print("Cannot connect to RabbitMQ")
    exit()

# Initialize components
milvus_manager = MilvusManager(index_params=index_params, search_params=search_params, model_dim=embedding_dim)
face_recognition = FaceRecognition(model_params)
data_loader = ImageToDB(milvus_manager, face_recognition, rabbit_mq)


def search_face(milvus_manager, face_recognition, image_path, top_k=10):
    embedding = face_recognition.extract_embedding(image_path)
    if embedding is None:
        print("Failed to extract embedding.")
        return
    results = milvus_manager.search(embedding, top_k)

    # Determine the similarity metric from MilvusManager's configuration
    metric_type = milvus_manager.search_params['metric_type']

    # Print the appropriate table header based on the metric
    if metric_type == "IP":
        print(f"{'Index':<6} {'Similarity Score':<20} {'ID':<30} {'Path'}")
    elif metric_type == "L2":
        print(f"{'Index':<6} {'L2 Distance':<20} {'ID':<30} {'Path'}")

    # Initialize the index variable
    index = 1

    for hits in results:
        for id_, score in zip(hits.ids, hits.distances):
            img_path = milvus_manager.get_image_path(id_)
            img_id = os.path.splitext(os.path.basename(img_path))[0]  # Extract the image name without the extension
            
            if metric_type == "IP":
                similarity_score = score  # Directly use the score
            else:  # For L2, just use the score directly
                similarity_score = score

            print(f"{index:<6} {similarity_score:<20.4f} {img_id:<30} {img_path}")
            index += 1  # Increment the index for each row


def injest():
    # Ingest the dataset
    data_loader.process_dataset(dataset_path, do_publish, targeted_workers)


def main(rabbit_mq):

    # Ingest the dataset
    injest()

    # Search for a face
    # search_face(milvus_manager, face_recognition, img2, top_k=50)


if __name__ == "__main__":

    # Start the main function
    main(rabbit_mq)

    # close connection
    if rabbit_mq is not None:
        rabbit_mq.close_connection()