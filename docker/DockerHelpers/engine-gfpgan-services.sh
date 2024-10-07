#!/bin/bash

# Activate the conda environment
source /opt/conda/bin/activate gfpgan

# download all models
cd /gfpgan/GFPGAN
python inference_gfpgan.py -i inputs/whole_imgs -o results -v 1.3 -s 2

# Run the fr processing script
cd /gfpgan
bash ./run.sh

# Keep the script running
tail -f /dev/null