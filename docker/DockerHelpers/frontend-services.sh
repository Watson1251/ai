#!/bin/bash

# Source NVM
export NVM_DIR="/root/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use default

# Change to the platform directory
cd /frontend

# Start Angular application
# ng serve --host 0.0.0.0 --port 4200
nodemon server.js

# Keep the script running
tail -f /dev/null