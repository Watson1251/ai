#!/bin/bash

# Check if any services are passed as arguments
if [ "$#" -eq 0 ]; then
    echo "No services specified. Building all services."
    docker compose build
else
    echo "Building specified services: $@"
    docker compose build "$@"
fi
