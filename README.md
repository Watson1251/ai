# AI Platform
    git clone https://github.com/Watson1251/ai.git
    cd ai

#### Face Recognition Engine
1. Build and run dockers

#####
    cd docker
    ./build.sh

2. Interact with `fr` docker using bash terminal

#####
    ./run.sh

#### Fr Docker Container
1. `env` - environment setup scrpits  - `ignore`
2. `Previous` - rewritten `FR` files - `ignore`
3. `src` - current `FR` system

```
.
├── env
│   ├── activate.sh
│   ├── deactivate.sh
│   ├── env.sh
│   ├── install.sh
│   └── requirements.txt
├── Previous
│   ├── DataLoader.py
│   ├── dataset
│   ├── FaceExtractor.py
│   ├── FaceNet
│   ├── FaceRecognition.py
│   ├── main.py
│   ├── PreProcessor.py
│   └── requirements.txt
└── src
    ├── data_loader.py
    ├── face_recognition.py
    ├── main.py
    └── milvus_manager.py
```

#### 1. `main.py`
Function            | Description
-------------       | -------------
`main()`            | <ul><li>Has db configurations</li><li>Initializes other classes</li></ul>
`search_face()`     | Handles test images and shows results

#### 2. `milvus_manager.py`
Function                        | Description
-------------                   | -------------
`__init__()`                    | Sets db configerations
`_connect_to_milvus()`          | Connects to db
`_create_or_load_collection()`  | Creates and Loads "faces" collection from db
`insert_data()`                 | Inserts embeddings into db
`search()`                      | Searches through embeddings using preset indexing and searching conf
`get_image_path()`              | Gets image path related to resulting embeddings
#### 3. `data_loader.py`
Function                        | Description
-------------                   | -------------
`__init__()`                    | Sets FR and DB class references
`insert_face_embedding()`       | Extracts and inserts embeddings to db
`process_dataset()`             | Loads images from a given dir - it doesn't handle labels yet
#### 4. `face_recognition.py`
Function                        | Description
-------------                   | -------------
`__init__()`                    | Sets Deepface configerations
`extract_embedding()`           | Deepface - extracts embeddings