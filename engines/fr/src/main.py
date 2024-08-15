from milvus_manager import MilvusManager
from face_recognition import FaceRecognition
from data_loader import DataLoader

def search_face(milvus_manager, face_recognition, image_path, top_k=10):
    embedding = face_recognition.extract_embedding(image_path)
    if embedding is None:
        print("Failed to extract embedding.")
        return
    results = milvus_manager.search(embedding, top_k)
    
    for idx, (hit_id, distance) in enumerate(zip(results.ids, results.distances), start=1):
        img_path = milvus_manager.get_image_path(hit_id)
        print(f"[{idx}] Distance: {distance:.4f}, Image Path: {img_path}")

def main():
    # Set up index and search parameters
    index_params = {
        "index_type": "IVF_PQ",
        "params": {"nlist": 32768, "m": 64},
        "metric_type": "L2"
    }

    search_params = {
        "metric_type": "L2",
        "params": {"nprobe": 128}
    }

    # model configuration
    detector = "retinaface"
    align = True
    recognition_model = 'Facenet512'
    embedding_dim = 512

    # Initialize components
    milvus_manager = MilvusManager(index_params=index_params, search_params=search_params, model_dim=embedding_dim)
    face_recognition = FaceRecognition(detector=detector, recognition_model=recognition_model, align=align)
    data_loader = DataLoader(milvus_manager, face_recognition)

    # Example usage
    dataset_path = '/fr/Previous/dataset'
    img1 = '/fr/obama.jpg'
    img2 = '/fr/lookalike.jpg'
    
    # Ingest the dataset
    data_loader.process_dataset(dataset_path)
    
    # Search for a face
    # search_face(milvus_manager, face_recognition, img2, top_k=50)

if __name__ == "__main__":
    main()
