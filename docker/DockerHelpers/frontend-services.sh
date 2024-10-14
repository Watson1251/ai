#!/bin/bash

# Source NVM
export NVM_DIR="/root/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use default

# Change to the platform directory
cd /frontend

# Start Node.js server
# nodemon server.js
ng serve --host 0.0.0.0

# Keep the script running
tail -f /dev/null