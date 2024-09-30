#!/bin/bash

# Check if archive file is passed as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 archive_name.tar.gz"
  exit 1
fi

# Extract the tar.gz file
tar -xzvf "$1"

# Check if extraction was successful
if [ $? -eq 0 ]; then
  echo "Archive $1 extracted successfully"
else
  echo "Extraction failed"
  exit 1
fi

