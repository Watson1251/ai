from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection, utility

class MilvusData:
    def __init__(self, person_id, image_path, embedding):
        self.person_id = str(person_id)  # Ensure person_id is a string
        self.image_path = image_path
        self.embedding = embedding

class MilvusManager:
    def __init__(self, host="standalone", port="19530", collection_name="faces", model_dim=512, index_params=None, search_params=None):
        self.collection_name = collection_name
        self.model_dim = model_dim
        self.index_params = index_params
        self.search_params = search_params

        self.fields = [
            FieldSchema(name="record_id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="person_id", dtype=DataType.VARCHAR, max_length=100),  # person_id as string
            FieldSchema(name="Facenet512", dtype=DataType.FLOAT_VECTOR, dim=self.model_dim),
            FieldSchema(name="image_path", dtype=DataType.VARCHAR, max_length=100),
        ]

        self._connect_to_milvus(host, port)
        self.collection = self._create_or_load_collection()

    def _connect_to_milvus(self, host, port):
        connections.connect("default", host=host, port=port)
    
    def _create_or_load_collection(self):
        schema = CollectionSchema(self.fields, "Face recognition schema")
        
        if utility.has_collection(self.collection_name):
            return Collection(self.collection_name)
        else:
            return Collection(self.collection_name, schema)
    
    def insert_data(self, records, load_collection=True):
        entities = [
            [record.person_id for record in records],
            [record.embedding for record in records],
            [record.image_path for record in records]
        ]
        
        self.collection.insert(entities)
        if len(self.collection.indexes) == 0:
            self.collection.create_index("Facenet512", self.index_params)
        
        if load_collection:
            self.collection.load()
    
    def search(self, embedding, top_k):
        return self.collection.search([embedding], "Facenet512", self.search_params, top_k)

    def get_image_path(self, record_id):
        return self.collection.query(expr=f"record_id == {record_id}", output_fields=["image_path"])[0]["image_path"]