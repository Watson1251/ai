#!/bin/bash

# Define configurations
alignment=("False" "True")
models=("Dlib" "Facenet" "VGG-Face" "ArcFace" "GhostFaceNet" "SFace" "OpenFace" "DeepFace" "DeepID") # Don't forget "Facenet512" 
detectors=("fastmtcnn" "yolov8" "retinaface" "mtcnn" "dlib" "yunet" "centerface" "mediapipe" "ssd" "opencv" "skip")
distance_metrics=("L2" "IP")

# Define embedding dimensions for each model
declare -A embedding_dims
embedding_dims["Facenet512"]=512
embedding_dims["Facenet"]=128
embedding_dims["VGG-Face"]=4096
embedding_dims["ArcFace"]=512
embedding_dims["Dlib"]=128
embedding_dims["GhostFaceNet"]=512
embedding_dims["SFace"]=128
embedding_dims["OpenFace"]=128
embedding_dims["DeepFace"]=4096
embedding_dims["DeepID"]=160

# Iterate over all combinations
for align in "${alignment[@]}"; do
    for model in "${models[@]}"; do
        for detector in "${detectors[@]}"; do
            for metric in "${distance_metrics[@]}"; do
                embedding_dim="${embedding_dims[$model]}"
                echo "Running with: detector=$detector, model=$model, align=$align, metric=$metric, embedding_dim=$embedding_dim"
                python3 injest.py "$detector" "$model" "$align" "$metric" "$embedding_dim"
            done
        done
    done
done
