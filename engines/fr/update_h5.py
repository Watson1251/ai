import csv
import argparse
import sys
import os
import h5py
from concurrent.futures import ThreadPoolExecutor, as_completed
from milvus_manager import MilvusData, MilvusManager
from datetime import datetime
import time

# Define the expected column names based on your header
EXPECTED_COLUMNS = ['P_ID_NUMBER', 'P_FULL_NAME_ARABIC_', 'P_FULL_NAME_ENGLISH_', 'P_NATIONALITY', 'P_DATE_OF_BIRTH']

def is_valid_id_number(value):
    """ Helper function to check if P_ID_NUMBER is valid (numeric). """
    return value.isdigit()

def load_csv_to_dict(csv_file):
    """ Load CSV into a dictionary with P_ID_NUMBER as the key """
    csv_data = {}
    skipped_rows = 0
    
    try:
        # Open the CSV file using Python's built-in CSV reader
        with open(csv_file, 'r', encoding='utf-8-sig') as file:
            reader = csv.DictReader(file)
            for line_number, row in enumerate(reader, start=1):
                try:
                    person_id = row['P_ID_NUMBER']
                    
                    if not is_valid_id_number(person_id):
                        skipped_rows += 1
                        print(f"Skipping line {line_number} due to invalid P_ID_NUMBER: {person_id}")
                        continue

                    # Map the row to the person_id without processing birthdate
                    csv_data[person_id] = {
                        'nameAr': row['P_FULL_NAME_ARABIC_'],
                        'nameEn': row['P_FULL_NAME_ENGLISH_'],
                        'nationality': row['P_NATIONALITY'],
                        'birthdate': row['P_DATE_OF_BIRTH']  # Keep birthdate as is (string)
                    }

                except Exception as e:
                    skipped_rows += 1
                    print(f"Skipping line {line_number} due to error: {e}")
                    print(f"Content of problematic row: {row}")

        print(f"CSV file '{csv_file}' loaded successfully with {skipped_rows} rows skipped.")
        return csv_data

    except FileNotFoundError:
        print(f"Error: File '{csv_file}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error occurred: {e}")
        sys.exit(1)

def find_h5_files(directory):
    """ Traverse directory to find all .h5 files at any nested level """
    h5_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".h5"):
                h5_files.append(os.path.join(root, file))
    return sorted(h5_files)  # Sort the files alphabetically by filename

def process_and_collect_h5_data(file_path, csv_data, corrupt_file_path):
    """ Process an .h5 file, collect data for insertion into Milvus, and log missing IDs. """
    records = []
    skipped_ids = []  # To track IDs not found in the CSV
    
    try:
        with h5py.File(file_path, 'r') as h5_file:
            print(f"\nProcessing H5 file: {file_path}")
            
            # Ensure person_id exists in the H5 file
            person_ids = h5_file['person_id']
            image_paths = h5_file['image_path']
            embeddings = h5_file['embedding']
            facial_areas = h5_file['facial_area']

            for idx, person_id in enumerate(person_ids):
                person_id_str = person_id.decode('utf-8')  # Decode bytes to string

                # Check if person_id exists in CSV
                if person_id_str in csv_data:
                    csv_entry = csv_data[person_id_str]
                    # Process the birthdate to Unix timestamp
                    birthdate = process_birthdate(csv_entry['birthdate'])
                    # Collect data into MilvusData objects
                    record = MilvusData(
                        person_id=person_id_str,
                        image_path=image_paths[idx].decode('utf-8'),
                        embedding=embeddings[idx],
                        facial_area=facial_areas[idx].decode('utf-8'),  # Decode to string
                        nameAr=csv_entry['nameAr'],
                        nameEn=csv_entry['nameEn'],
                        nationality=csv_entry['nationality'],
                        birthdate=birthdate  # Use the processed Unix timestamp
                    )
                    records.append(record)
                else:
                    # Try removing leading zeros and check again
                    person_id_no_zeros = person_id_str.lstrip('0')
                    if person_id_no_zeros in csv_data:
                        csv_entry = csv_data[person_id_no_zeros]
                        # Process the birthdate to Unix timestamp
                        birthdate = process_birthdate(csv_entry['birthdate'])
                        # Collect data into MilvusData objects
                        record = MilvusData(
                            person_id=person_id_no_zeros,
                            image_path=image_paths[idx].decode('utf-8'),
                            embedding=embeddings[idx],
                            facial_area=facial_areas[idx].decode('utf-8'),  # Decode to string
                            nameAr=csv_entry['nameAr'],
                            nameEn=csv_entry['nameEn'],
                            nationality=csv_entry['nationality'],
                            birthdate=birthdate  # Use the processed Unix timestamp
                        )
                        records.append(record)
                    else:
                        # Log and print person_id if still not found
                        skipped_ids.append(person_id_str)
                        print(f"Person ID not found in CSV: {person_id_str}")
    
    except Exception as e:
        print(f"Error processing .h5 file {file_path}: {e}")

    # Write skipped IDs to the corrupt file
    if skipped_ids:
        with open(corrupt_file_path, 'a') as corrupt_file:
            for skipped_id in skipped_ids:
                corrupt_file.write(f"Missing in CSV: {skipped_id}\n")
    
    return records

def process_birthdate(birthdate_str):
    """ Convert birthdate string to a Unix timestamp or return -1 if empty or invalid. """
    if not birthdate_str.strip():
        # Return -1 for empty birthdates
        return -1
    try:
        # Convert birthdate to Unix timestamp
        birthdate = datetime.strptime(birthdate_str, '%Y-%m-%d')
        timestamp = int(time.mktime(birthdate.timetuple()))  # Convert to Unix timestamp
        return timestamp
    except ValueError:
        print(f"Invalid birthdate format: {birthdate_str}. Assigning default '-1'.")
        return -1  # Default for invalid dates

def insert_records_to_milvus(milvus_manager, records, batch_size=50000):
    """ Insert records into Milvus in batches """
    total_records = len(records)
    if total_records > batch_size:
        print(f"Total records ({total_records}) exceed batch size ({batch_size}). Splitting into batches.")
    
    # Split and insert data in batches if necessary
    for i in range(0, total_records, batch_size):
        batch = records[i:i+batch_size]
        print(f"Inserting batch of size {len(batch)}...")
        milvus_manager.insert_data(batch)

def process_files_in_parallel(h5_files, csv_data, milvus_manager, corrupt_file_path, max_workers=4):
    """ Process multiple H5 files in parallel and insert data into Milvus """
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_file = {executor.submit(process_and_collect_h5_data, file, csv_data, corrupt_file_path): file for file in h5_files}
        
        for future in as_completed(future_to_file):
            file = future_to_file[future]
            try:
                records = future.result()
                if records:
                    insert_records_to_milvus(milvus_manager, records)
            except Exception as exc:
                print(f"Error processing file {file}: {exc}")

if __name__ == "__main__":
    # Initialize argument parser
    parser = argparse.ArgumentParser(description="CSV and H5 file processing script.")
    
    # Add the CSV file argument
    parser.add_argument('csv_file', type=str, help="Path to the CSV file")
    
    # Add the directory argument to find .h5 files
    parser.add_argument('h5_dir', type=str, help="Directory containing .h5 files")
    
    # Add an argument for the number of parallel workers
    parser.add_argument('--workers', type=int, default=4, help="Number of parallel workers (default: 4)")

    # Parse the command-line arguments
    args = parser.parse_args()

    # Load the CSV file data into a dictionary
    print(f"[+] Loading CSV file: {args.csv_file}")
    csv_data = load_csv_to_dict(args.csv_file)
    print(f"[+] Loaded {len(csv_data)} valid entries from the CSV file.")

    # Initialize MilvusManager for inserting data
    milvus_manager = MilvusManager()

    # Create a 'corrupt.txt' file to store unfound person_id entries in the same directory as the script
    corrupt_file_path = os.path.join(os.getcwd(), 'corrupt.txt')
    open(corrupt_file_path, 'w').close()  # Clear the file if it exists

    # Find all .h5 files in the provided directory
    h5_files = find_h5_files(args.h5_dir)

    if h5_files:
        print(f"\nFound {len(h5_files)} .h5 files in directory: {args.h5_dir}")
        # Process the files in parallel and insert data into Milvus
        process_files_in_parallel(h5_files, csv_data, milvus_manager, corrupt_file_path, max_workers=args.workers)
    else:
        print(f"No .h5 files found in directory: {args.h5_dir}")

    print(f"\nCorrupt person IDs recorded in: {corrupt_file_path}")
