#!/bin/bash

# Check if any services are passed as arguments
if [ "$#" -eq 0 ]; then
    echo "No services specified. Bringing down all services."
    docker compose down
else
    echo "Bringing down specified services: $@"
    docker compose rm -s -f "$@"
fi