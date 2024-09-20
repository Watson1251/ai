import os
from milvus_manager import MilvusManager
from face_recognition import FaceRecognition
from image_to_db import ImageToDB
from rabbit_mq import RabbitMQ
import sys

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


def main(rabbit_mq, model_params, similarity_metric, embedding_dim, collection_name, image_queue, corrupt_queue):

    # # model configuration
    # model_params = {
    #     "detector": "retinaface",
    #     "recognition_model": 'Facenet512',
    #     "is_align": True
    # }

    # embedding_dim = 512
    # similarity_metric = "L2"
    # similarity_metric = "IP" # Use Inner Product (Cosine Similarity) for similarity search

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

    rabbit_mq.get_channel().queue_declare(queue=image_queue, durable=True)
    rabbit_mq.get_channel().queue_declare(queue=corrupt_queue, durable=True)

    # Initialize components
    milvus_manager = MilvusManager(index_params=index_params, collection_name=collection_name, search_params=search_params, model_dim=embedding_dim)
    face_recognition = FaceRecognition(model_params)
    data_loader = ImageToDB(milvus_manager, face_recognition, rabbit_mq, image_queue, corrupt_queue)

    # Example usage
    dataset_path = '/fr/dataset'
    # dataset_path = '/fr/large_dataset'

    do_publish = True

    targeted_workers = 1

    # Ingest the dataset
    data_loader.process_dataset(dataset_path, do_publish, targeted_workers)

    # Search for a face
    # search_face(milvus_manager, face_recognition, img2, top_k=50)

    # close connection

if __name__ == "__main__":

    # Extract command-line arguments
    detector = sys.argv[1]
    recognition_model = sys.argv[2]
    is_align = sys.argv[3].lower() == 'true'
    similarity_metric = sys.argv[4]
    embedding_dim = int(sys.argv[5])

    print(f"[+] {recognition_model} {detector} {is_align} {similarity_metric} {embedding_dim}")

    # model configuration
    model_params = {
        "detector": detector,
        "recognition_model": recognition_model,
        "is_align": is_align
    }

    collection_name = f"faces_{recognition_model}_{detector}_{similarity_metric}_align_{is_align}"
    image_queue = f"image_{collection_name}"
    corrupt_queue = f"corrupt_{collection_name}"

    # Initialize RabbitMQ
    rabbit_mq = RabbitMQ()
    if rabbit_mq is None:
        print("Cannot connect to RabbitMQ")
    else:
        # Start the main function
        main(rabbit_mq, model_params, similarity_metric, embedding_dim, collection_name, image_queue, corrupt_queue)

        # close connection
        rabbit_mq.close_connection()
