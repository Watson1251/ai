#!/bin/bash

# Check if directory name is passed as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 directory_name"
  exit 1
fi

# Compress the directory into a tar.gz file
tar -czvf "$1.tar.gz" "$1"

# Check if compression was successful
if [ $? -eq 0 ]; then
  echo "Directory $1 compressed successfully into $1.tar.gz"
else
  echo "Compression failed"
  exit 1
fi

