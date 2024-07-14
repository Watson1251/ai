#!/bin/bash

# Activate the conda environment
source /opt/conda/bin/activate deep

# Run the deepfake processing script
cd df_video/
bash ./run.sh

# Keep the script running
tail -f /dev/null