import os
import json
from tqdm import tqdm
from multiprocessing import Pool, cpu_count
from face_recognition import FaceRecognition
from milvus_manager import MilvusData

class ImageToDB:
    def __init__(self, milvus_manager, rabbit_mq):
        self.milvus_manager = milvus_manager
        self.rabbit_mq = rabbit_mq
        self.image_extensions = ('.jpg', '.jpeg', '.png')
        self.logs_dir = "/fr/logs"
        self.dataset_logs_file = "dataset_logs.json"
        self.batch_size = 5000

    @staticmethod
    def get_embedding(record):
        face_recognition = FaceRecognition()
        embedding = face_recognition.extract_embedding(record.image_path)
        if embedding is not None:
            record.embedding = embedding
        return record

    def insert_to_db(self, records):
        if records:
            self.milvus_manager.insert_data(records=records, load_collection=False)

    def multiprocess_extraction(self, batch):
        records = []

        # Adjust the third argument to set a reasonable limit
        num_workers = min(cpu_count(), len(batch), 12)
        with Pool(num_workers) as pool:

            # Collect embeddings in parallel
            for record in tqdm(pool.imap_unordered(self.get_embedding, batch), total=len(batch)):
                if record is not None:
                    records.append(record)
            
        return records

    def save_path_batch_logs(self, records, dataset_path):

        print(f"[+] Creating batches and logging them...")

        # get dataset path dir name
        dataset_dir = os.path.basename(dataset_path)

        # create log file
        dataset_log_dir = os.path.join(self.logs_dir, dataset_dir)
        os.makedirs(dataset_log_dir, exist_ok=True)

        # Create batches of MilvusData instances
        batches = [records[i:i + self.batch_size] for i in range(0, len(records), self.batch_size)]

        # Create a dictionary with keys as "batch_{i}" and values as lists of JSON serialized MilvusData instances
        batches_dict = {f"batch_{i}": [data.__dict__ for data in batch] for i, batch in enumerate(batches)}

        # keep track of unpublished
        unpublished = []

        # loop through batches, create log files and save them
        for batch_key, batch in enumerate(batches):
            batch_log_path = os.path.join(dataset_log_dir, f"batch_{batch_key}.json")
            with open(batch_log_path, 'w') as log_file:
                json.dump(batches_dict[f"batch_{batch_key}"], log_file, indent=4)

            # send the batch key to RabbitMQ
            status_code = self.rabbit_mq.publish(message=f"batch_{batch_key}", queue='image_paths')
            if status_code == 1:
                print(f"Error publishing batch_{batch_key} to RabbitMQ")
                unpublished.append(batch_key)
            else:
                print(f"[+] Published batch_{batch_key} to RabbitMQ")

        return batches, unpublished
    
    def get_batches(self, dataset_path):
        records = []

        # build image paths, publish "{person_id}, {image_path}" to RabbitMQ
        print(f"[+] Building image paths...")
        for root, dirs, files in os.walk(dataset_path):
            for file in files:
                if file.endswith(self.image_extensions):
                    image_path = os.path.join(root, file)
                    record: MilvusData = MilvusData(
                        person_id=os.path.basename(root),
                        image_path=image_path,
                        embedding=None
                    )
                    records.append(record)
        
        # Sort paths and save logs
        records.sort(key=lambda x: x.person_id)
        batches, unpublished = self.save_path_batch_logs(records, dataset_path)

        return batches, unpublished

    def process_dataset(self, dataset_path):
            
        # create a dataset log
        dataset_log = {
            "dataset_path": dataset_path,
            "is_batched": False,
            "is_processed": False,
            "batches": [],
            "unpublished_batches": []
        }

        dataset_logs = []
        batches = []
        
        # read dataset log file
        dataset_log_path = os.path.join(self.logs_dir, self.dataset_logs_file)

        # Ensure the logs directory exists
        os.makedirs(self.logs_dir, exist_ok=True)
        
        # log file has an array of dataset logs, check if this dataset_path is in that list
        if os.path.exists(dataset_log_path):
            with open(dataset_log_path, 'r') as log_file:
                dataset_logs = json.load(log_file)
                for log in dataset_logs:
                    if log['dataset_path'] == dataset_path:
                        dataset_log = log
                        break
        
        # if not found, create it and add dataset_log to the list
        else:
            dataset_logs = []
            dataset_logs.append(dataset_log)

            # save an initial log file
            with open(dataset_log_path, 'w') as log_file:
                json.dump(dataset_logs, log_file, indent=4)
        
        
        # if dataset is already processed, return
        if dataset_log['is_processed']:
            print(f"[+] Dataset {dataset_path} is already processed")
            return
        
        # if dataset is not batched, create batches
        if not dataset_log['is_batched']:
            print(f"[+] Dataset {dataset_path} is not batched... Creating batches")

            # divide dataset into batches and log them
            batches, unpublished = self.get_batches(dataset_path)

            # log that batches are created, read the list of logs, update the current log
            dataset_log['is_batched'] = True
            dataset_log['batches'] = [f"batch_{i}" for i in range(len(batches))]
            dataset_log['unpublished_batches'] = unpublished

            # read log file which has array of logs, update the current log, save it again
            with open(dataset_log_path, 'r') as log_file:
                dataset_logs = json.load(log_file)
                for i, log in enumerate(dataset_logs):
                    if log['dataset_path'] == dataset_path:
                        dataset_logs[i] = dataset_log
                        break
                
                # save updated logs
                with open(dataset_log_path, 'w') as log_file:
                    json.dump(dataset_logs, log_file, indent=4)
        
        # if batches list is empty, read the log file and get the batches
        if not batches:
            print(f"[+] Dataset {dataset_path} is batched... Reading batches")
            for batch_key in dataset_log['batches']:
                batch_log_path = os.path.join(self.logs_dir, os.path.basename(dataset_path), f"{batch_key}.json")
                with open(batch_log_path, 'r') as log_file:
                    batch = json.load(log_file)

                    # convert JSON serialized MilvusData instances to MilvusData instances
                    records = [MilvusData(**data) for data in batch]
                    batches.append(records)
        
        # start consuming messages from RabbitMQ and processing the image paths
        print(f"[+] Consuming image paths from RabbitMQ...")
        while True:
            # consume message from RabbitMQ, ensure not to ack the message until the image is processed
            
            message, delivery_tag = self.rabbit_mq.consume(queue='image_paths')
            if message is None:
                break
            
            # the message has the batch key, get the batch from the batches list above
            if message.startswith("batch_"):
                print(f"[+] Processing {message}")
                batch_key = message
                batch = batches[int(batch_key.split("_")[-1])]
                records = self.multiprocess_extraction(batch)
                self.insert_to_db(records)

                self.rabbit_mq.ack_message(delivery_tag)

                # remove the batch from the list of batches, and update and save the log
                batches.pop(int(batch_key.split("_")[-1]))
                dataset_log['batches'].remove(batch_key)

                # read log file which has array of logs, update the current log, save it again
                with open(dataset_log_path, 'r') as log_file:
                    dataset_logs = json.load(log_file)
                    for i, log in enumerate(dataset_logs):
                        if log['dataset_path'] == dataset_path:
                            dataset_logs[i] = dataset_log
                            break
                    
                    # save updated logs
                    with open(dataset_log_path, 'w') as log_file:
                        json.dump(dataset_logs, log_file, indent=4)


        # mark the dataset as processed, and save the log
        dataset_log['is_processed'] = True
        with open(dataset_log_path, 'r') as log_file:
            dataset_logs = json.load(log_file)
            for i, log in enumerate(dataset_logs):
                if log['dataset_path'] == dataset_path:
                    dataset_logs[i] = dataset_log
                    break
            
            # save updated logs
            with open(dataset_log_path, 'w') as log_file:
                json.dump(dataset_logs, log_file, indent=4)
