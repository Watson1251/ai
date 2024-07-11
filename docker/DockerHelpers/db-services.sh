#!/bin/bash

# Start MongoDB
mongod --bind_ip_all --logpath /var/log/mongodb.log --fork

# Keep the script running
tail -f /dev/null