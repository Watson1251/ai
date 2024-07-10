#!/bin/bash

# Start MongoDB
mongod --bind_ip_all --logpath /var/log/mongodb.log --fork

# Source NVM
export NVM_DIR="/root/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use default

# Change to the platform directory
cd /platform

# Start Angular application
ng serve --host 0.0.0.0 --port 4200 &

# Start Node.js server
nodemon backend/server.js &

# Keep the script running
wait
