import re
import torch
import os
from kernel_utils import VideoReader, FaceExtractor, confident_strategy, predict_on_video
from training.zoo.classifiers import DeepFakeClassifier
from flask import Flask, request, jsonify
import logging

# GLOBAL VARIABLE
models = []

# Configure logging
logging.basicConfig(level=logging.INFO)

# Ensure no GPU is used
# os.environ["CUDA_VISIBLE_DEVICES"] = ""

app = Flask(__name__)


def load_models():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[+] Loading Model... Device: {device}")

    model_paths = ["weights/" + model for model in [
        "final_111_DeepFakeClassifier_tf_efficientnet_b7_ns_0_36",
        "final_555_DeepFakeClassifier_tf_efficientnet_b7_ns_0_19",
        "final_777_DeepFakeClassifier_tf_efficientnet_b7_ns_0_29",
        "final_777_DeepFakeClassifier_tf_efficientnet_b7_ns_0_31",
        "final_888_DeepFakeClassifier_tf_efficientnet_b7_ns_0_37",
        "final_888_DeepFakeClassifier_tf_efficientnet_b7_ns_0_40",
        "final_999_DeepFakeClassifier_tf_efficientnet_b7_ns_0_23"
    ]]
    for path in model_paths:
        model = DeepFakeClassifier(encoder="tf_efficientnet_b7_ns").to(device)
        logging.info("Loading state dict {}".format(path))
        checkpoint = torch.load(path, map_location=device)
        state_dict = checkpoint.get("state_dict", checkpoint)
        model.load_state_dict({re.sub("^module.", "", k): v for k, v in state_dict.items()}, strict=True)
        model.eval()
        del checkpoint
        models.append(model)

def predict(path):
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

        prediction = predict(path)

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


# load models
load_models()

if __name__ == "__main__":
    app.run()
    logging.info("Flask app is running.")