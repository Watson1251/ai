from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection, utility

class MilvusManager:
    def __init__(self, host="standalone", port="19530", collection_name="faces", model_dim=512, index_params=None, search_params=None):
        self.collection_name = collection_name
        self.model_dim = model_dim
        self.index_params = index_params
        self.search_params = search_params

        self._connect_to_milvus(host, port)
        self.collection = self._create_or_load_collection()

    def _connect_to_milvus(self, host, port):
        connections.connect("default", host=host, port=port)
    
    def _create_or_load_collection(self):
        fields = [
            FieldSchema(name="face_id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=self.model_dim),
            FieldSchema(name="image_path", dtype=DataType.VARCHAR, max_length=500),
        ]
        schema = CollectionSchema(fields, "Face recognition schema")
        
        if utility.has_collection(self.collection_name):
            return Collection(self.collection_name)
        else:
            collection = Collection(self.collection_name, schema)
            return collection
    
    def insert_data(self, embeddings, image_paths):
        self.collection.insert([embeddings, image_paths])
        if len(self.collection.indexes) == 0:
            self.collection.create_index("embedding", self.index_params)
        self.collection.load()
    
    def search(self, embedding, top_k):
        return self.collection.search([embedding], "embedding", self.search_params, top_k)

    def get_image_path(self, face_id):
        return self.collection.query(expr=f"face_id == {face_id}", output_fields=["image_path"])[0]["image_path"]
