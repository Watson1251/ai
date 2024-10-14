#!/bin/bash

# Activate the conda environment
source /opt/conda/bin/activate fr

# download all models
# python /fr/env/download.py

# Run the fr processing script
cd /fr
bash ./run.sh

# Keep the script running
tail -f /dev/null