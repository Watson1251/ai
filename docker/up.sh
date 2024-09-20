#!/bin/bash

# Check if any services are passed as arguments
if [ "$#" -eq 0 ]; then
    echo "No services specified. Bringing up all services."
    docker compose up -d
else
    echo "Bringing up specified services: $@"
    docker compose up -d "$@"
fi
