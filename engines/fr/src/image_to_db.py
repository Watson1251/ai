import os
import json
from tqdm import tqdm
from multiprocessing import Pool, cpu_count
from face_recognition import FaceRecognition
from milvus_manager import MilvusData

fr_global = None

def get_embedding(rabbit_data):
    image_path = rabbit_data['path']

    if fr_global is None:
        raise Exception("Face recognition model is not initialized")
    
    embedding = fr_global.extract_embedding(image_path)

    # Get the base name (filename with extension), then strip the extension, then make sure to handle underscores
    base_name = os.path.basename(image_path)
    label = os.path.splitext(base_name)[0]
    id = label.split('_')[0]

    record: MilvusData = MilvusData(
                        person_id=id,
                        image_path=image_path,
                        tag=rabbit_data['tag'],
                        embedding=embedding
                    )
    
    return record

class ImageToDB:
    def __init__(self, milvus_manager, face_recognition, rabbit_mq, image_queue ='image_paths', corrupt_queue ='corrupt_image_paths'):
        self.milvus_manager = milvus_manager
        self.rabbit_mq = rabbit_mq
        self.image_extensions = ('.jpg', '.jpeg', '.png')
        self.batch_size = 1000

        self.image_queue = image_queue
        self.corrupt_queue = corrupt_queue

        global fr_global
        fr_global = face_recognition

    def insert_to_db(self, records, load_collection=False):
        try:
            if records:
                self.milvus_manager.insert_data(records=records, load_collection=load_collection)
        except Exception as e:
            pass

        for record in records:
            self.rabbit_mq.ack_message(record.tag)

    def multiprocess_extraction(self, rabbit_data, targeted_workers):
        records = []

        # Adjust the third argument to set a reasonable limit
        num_workers = min(cpu_count(), len(rabbit_data), targeted_workers)
        with Pool(num_workers) as pool:

            # Collect embeddings in parallel
            for record in tqdm(pool.imap_unordered(get_embedding, rabbit_data), total=len(rabbit_data)):
                if record is not None:
                    records.append(record)
            
        return records

    def publish_to_rabbitmq(self, image_path, queue='image_paths'):
        status_code = self.rabbit_mq.publish(message=image_path, queue=queue)
        return status_code
    
    def dataset_walk(self, dataset_path):

        # build image paths, publish "{person_id}, {image_path}" to RabbitMQ
        print(f"[+] Building image paths...")
        for root, dirs, files in os.walk(dataset_path):
            for file in files:
                if file.endswith(self.image_extensions):

                    # build image path
                    image_path = os.path.join(root, file)

                    # publish to queue
                    self.publish_to_rabbitmq(image_path, queue=self.image_queue)
    
    def consume_batch(self, queue='image_paths'):
        # consume images [batch number] and process them
        rabbit_data = []
        while True:
            message, delivery_tag = self.rabbit_mq.consume(queue=queue)

            if message is not None:
                data = {
                    'path': message,
                    'tag': delivery_tag
                }
                rabbit_data.append(data)
            else:
                break

            if len(rabbit_data) >= self.batch_size:
                break
        
        return rabbit_data
    
    def process_records(self, records):
        processed_records = []

        for record in records:
            if record.embedding is not None:
                processed_records.append(record)
            else:
                # publish to corrupt_image_paths queue, and ack message
                self.rabbit_mq.publish(message=record.image_path, queue=self.corrupt_queue)
                self.rabbit_mq.ack_message(record.tag)
        
        return processed_records

    def process_dataset(self, dataset_path, do_publish=False, targeted_workers=12):

        # publish image paths to rabbitMq
        if do_publish:
            self.dataset_walk(dataset_path)

        # consume images [batch number] and process them
        while True:
            
            # get paths from rabbitmq
            rabbit_data = self.consume_batch(queue=self.image_queue)
            if not rabbit_data:
                break
            
            # extract embeddings
            records = self.multiprocess_extraction(rabbit_data, targeted_workers)
            
            # process none records
            processed_records = self.process_records(records)

            # insert to db
            self.insert_to_db(processed_records, False)
        


