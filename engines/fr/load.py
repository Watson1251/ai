import h5py
import os
import argparse
from milvus_manager import MilvusManager, MilvusData

def load_milvus_data_from_h5(file_name):
    """
    Load MilvusData from an HDF5 file and return a list of MilvusData objects.
    
    Parameters:
    - file_name: The name of the HDF5 file to load from.
    
    Returns:
    - data: List of MilvusData objects.
    """
    data = []
    
    with h5py.File(file_name, 'r') as h5f:
        # Load datasets
        person_ids = h5f['person_id'][:]
        image_paths = h5f['image_path'][:]
        embeddings = h5f['embedding'][:]
        facial_areas = h5f['facial_area'][:]
        nameAr = h5f['nameAr'][:]
        nameEn = h5f['nameEn'][:]
        nationality = h5f['nationality'][:]
        birthdate = h5f['birthdate'][:]
        
        # Reconstruct data into list of MilvusData objects
        for i in range(len(person_ids)):
            record = MilvusData(
                person_id=person_ids[i].decode('utf-8'),  # Decode from bytes to string
                image_path=image_paths[i].decode('utf-8'),
                tag="",  # Assuming no 'tag' for now
                embedding=embeddings[i].tolist(),  # Convert NumPy array to list
                facial_area=facial_areas[i].decode('utf-8'),
                nameAr=nameAr[i].decode('utf-8'),  # Arabic name
                nameEn=nameEn[i].decode('utf-8'),  # English name
                nationality=nationality[i].decode('utf-8'),  # Nationality
                birthdate=birthdate[i].decode('utf-8')  # Birthdate
            )
            data.append(record)
    
    return data

def find_h5_files(target_dir):
    """
    Recursively find all .h5 files in the target directory and subdirectories.
    
    Parameters:
    - target_dir: The root directory to search for .h5 files.
    
    Returns:
    - h5_files: List of paths to .h5 files.
    """
    h5_files = []
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith('.h5'):
                h5_files.append(os.path.join(root, file))
    return h5_files

def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="Ingest HDF5 data into Milvus.")
    parser.add_argument('target_dir', type=str, help="The path to the target directory containing .h5 files.")
    args = parser.parse_args()

    # Initialize MilvusManager
    milvus_manager = MilvusManager()

    # Find all .h5 files in the target directory
    h5_files = find_h5_files(args.target_dir)

    if not h5_files:
        print(f"No .h5 files found in directory: {args.target_dir}")
        return

    # Load and insert data from each .h5 file into Milvus
    for h5_file in h5_files:
        print(f"Loading data from {h5_file}")
        loaded_data = load_milvus_data_from_h5(h5_file)
        
        if loaded_data:
            print(f"Ingesting {len(loaded_data)} records from {h5_file} into Milvus")
            # Insert loaded data into Milvus
            milvus_manager.insert_data(loaded_data)

if __name__ == "__main__":
    main()
