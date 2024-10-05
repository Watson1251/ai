import re
import torch
import os
import sys
from deepface import DeepFace
from flask import Flask, request, jsonify
import logging

app = Flask(__name__)


def process_image(image_path):
    # Replace this with the actual image processing code
    embedding = DeepFace.represent(image_path, model_name='Facenet512', detector_backend="retinaface", align=True)
    return embedding


def predict(path):
    return 30
    frames_per_video = 32
    video_reader = VideoReader()
    video_read_fn = lambda x: video_reader.read_frames(x, num_frames=frames_per_video)

    face_extractor = FaceExtractor(video_read_fn)
    input_size = 380
    strategy = confident_strategy

    y_pred = predict_on_video(face_extractor=face_extractor, video_path=path, input_size=input_size, batch_size=frames_per_video, models=models, strategy=strategy, apply_compression=False)
    
    # Ensure the prediction is JSON serializable
    y_pred = y_pred.astype(float).tolist() * 100
    
    return y_pred

@app.route('/process', methods=['POST'])  # Ensure no trailing slash
def process_data():
    result = {}
    try:
        
        data = request.get_json()
        
        path = data['path']
        print(path)

        prediction = process_image(path)

        result = {
            'message': 'Processed data successfully',
            'result': prediction
        }

    except Exception as e:
        logging.error(f"{e}")

        result = {
            'message': f"{e}"
        }

    return jsonify(result)

if __name__ == "__main__":
    app.run()
    logging.info("Flask app is running.")