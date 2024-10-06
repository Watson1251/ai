from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection, utility

class MilvusData:
    def __init__(self, person_id, image_path, tag, embedding, facial_area, nameAr, nameEn, nationality, birthdate):
        """
        Class representing the structure of a single data record for Milvus.
        """
        self.person_id = str(person_id)  # Ensure person_id is a string
        self.image_path = image_path
        self.embedding = embedding
        self.facial_area = facial_area
        self.nameAr = nameAr
        self.nameEn = nameEn
        self.nationality = nationality
        self.birthdate = birthdate

class MilvusManager:
    def __init__(self, host="standalone", port="19530", collection_name="faces", model_dim=512, index_params=None, search_params=None):
        """
        Initialize MilvusManager, including collection schema, connection, and indexing.
        """
        self.collection_name = collection_name
        self.model_dim = model_dim
        self.index_params = index_params
        self.search_params = search_params

        # Define the collection schema with additional fields
        self.fields = [
            FieldSchema(name="record_id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="person_id", dtype=DataType.VARCHAR, max_length=100),  # person_id as string
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=self.model_dim),
            FieldSchema(name="facial_area", dtype=DataType.VARCHAR, max_length=100),  # 8 items: [x, y, w, h, left_eye_x, left_eye_y, right_eye_x, right_eye_y]
            FieldSchema(name="image_path", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="nameAr", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="nameEn", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="nationality", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="birthdate", dtype=DataType.VARCHAR, max_length=100),
        ]

        # Connect to Milvus and create or load the collection
        self._connect_to_milvus(host, port)
        self.collection = self._create_or_load_collection()

    def _connect_to_milvus(self, host, port):
        """
        Connect to the Milvus server.
        """
        connections.connect("default", host=host, port=port)

    def _create_or_load_collection(self):
        """
        Create or load the collection schema in Milvus.
        """
        schema = CollectionSchema(self.fields, description="Face recognition schema with metadata")
        
        # Check if the collection already exists
        if utility.has_collection(self.collection_name):
            return Collection(self.collection_name)
        else:
            return Collection(self.collection_name, schema)

    def insert_data(self, records, load_collection=True):
        """
        Insert a list of MilvusData records into the collection.

        Parameters:
        - records: List of MilvusData objects.
        - load_collection: Whether to load the collection after inserting (default is True).
        """
        # Extract the entity fields from each record
        entities = [
            [record.person_id for record in records],   # person_id
            [record.embedding for record in records],   # embedding vector
            [record.facial_area for record in records], # facial_area
            [record.image_path for record in records],  # image_path
            [record.nameAr for record in records],      # name in Arabic
            [record.nameEn for record in records],      # name in English
            [record.nationality for record in records], # nationality
            [record.birthdate for record in records],   # birthdate
        ]
        
        # Insert the records into the collection
        self.collection.insert(entities)
        
        # Create the index if it doesn't exist
        if len(self.collection.indexes) == 0:
            self.collection.create_index("embedding", self.index_params)
        
        # Load the collection into memory if specified
        if load_collection:
            self.collection.load()

    def search(self, embedding, top_k):
        """
        Perform a similarity search in the Milvus collection based on the embedding.

        Parameters:
        - embedding: The embedding vector to search for.
        - top_k: Number of top results to return.

        Returns:
        - The top K search results.
        """
        return self.collection.search(
            data=[embedding],
            anns_field="embedding",
            param=self.search_params,
            limit=top_k,
            output_fields=["person_id", "image_path", "nameAr", "nameEn", "nationality", "birthdate"]
        )

    def get_image_path(self, record_id):
        """
        Query the collection to get the image path for a specific record.

        Parameters:
        - record_id: The record ID to search for.

        Returns:
        - The image path associated with the record.
        """
        result = self.collection.query(
            expr=f"record_id == {record_id}",
            output_fields=["image_path"]
        )
        return result[0]["image_path"] if result else None
