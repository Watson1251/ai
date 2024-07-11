#!/bin/bash

# Activate the conda environment
source /opt/conda/bin/activate deep

# Run the deepfake processing script
cd df_video/
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &

# Keep the script running
wait
