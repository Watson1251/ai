from milvus_manager import MilvusManager
from face_recognition_exp import FaceRecognition
from data_loader import DataLoader

def search_face(milvus_manager, face_recognition, image_path, top_k=10):
    embedding = face_recognition.extract_embedding(image_path)
    if embedding is None:
        print("Failed to extract embedding.")
        return
    results = milvus_manager.search(embedding, top_k)

    # Print table header
    print(f"{'Index':<6} {'Distance':<10} {'Path'}")

    for idx, hits in enumerate(results):
        for id_, score in zip(hits.ids, hits.distances):
            img_path = milvus_manager.get_image_path(id_)
            print(f"{idx+1:<6} {score:<10.2f} {img_path}")


def main():

    # model configuration
    detector = "dlib"
    align = False
    recognition_model = "google/vit-huge-patch14-224-in21k" #"google/vit-base-patch16-224-in21k"
    embedding_dim = 1280
    similarity_metric = "cosine"
    metric_type = "IP"
    collection_name="faces_ViT_Huge_Cosine"
    # similarity_metric = "IP" # Use Inner Product (Cosine Similarity) for similarity search

    # Set up index and search parameters
    index_params = {
        "index_type": "IVF_PQ",
        "params": {"nlist": 32768, "m": 64},
        "metric_type": metric_type,
        
    }

    search_params = {
        "metric_type": metric_type,
        "params": {"nprobe": 128}
    }

    # Initialize components
    milvus_manager = MilvusManager(collection_name=collection_name,index_params=index_params, search_params=search_params, model_dim=embedding_dim)
    face_recognition =  FaceRecognition(detector=detector, recognition_model=recognition_model, align=align)
    data_loader = DataLoader(milvus_manager, face_recognition)

    # Example usage
    #dataset_path = '/fr/Previous/dataset'
    dataset_path = '/fr/test_data/train'
    #dataset_path = '/fr/sample'
    img1 = '/fr/obama.jpg'
    img2 = '/fr/lookalike.jpg'
    img3 = "/fr/sample/5255/5255.jpg"
    img4 = '/fr/test_data/ali_alhabsi.jpeg'
    # Ingest the dataset
    data_loader.process_dataset(dataset_path)

    # Search for a face
    search_face(milvus_manager, face_recognition, img4, top_k=50)

if __name__ == "__main__":
    main()
