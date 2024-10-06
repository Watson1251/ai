#!/bin/bash

# Check if any services are passed as arguments
if [ "$#" -eq 0 ]; then
    echo "No services specified. Restarting all services."
    docker compose down
    docker compose up -d
else
    echo "Restarting specified services: $@"
    docker compose down "$@"
    docker compose up -d "$@"
fi