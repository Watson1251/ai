# Use the official CUDA image as the base image
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu20.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Update and install necessary packages
RUN apt-get update && \
    apt-get install -y \
    build-essential \
    curl \
    wget \
    git \
    lsb-release \
    gnupg2 \
    software-properties-common \
    mongodb \
    python3.8 \
    python3.8-dev \
    python3-pip \
    libgl1-mesa-glx

# Install the latest Miniconda (flexible with Python version)
RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh && \
    bash /tmp/miniconda.sh -b -p /opt/conda && \
    rm /tmp/miniconda.sh

# Set PATH to include conda
ENV PATH=/opt/conda/bin:$PATH

# Create a conda environment named "deep" with Python 3.8
RUN conda create -y --name deep python=3.8

# Copy the platform directory to the Docker image
COPY ./platform /platform

# Activate the "deep" environment and install Python packages
RUN /bin/bash -c "source activate deep && \
    cd /platform/engine/df_video && \
    pip install -r requirements.txt"

# Make sure the "deep" environment is activated in every shell
RUN echo "source /opt/conda/bin/activate deep" >> ~/.bashrc

# # Install NVM
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# Set NVM environment variables
ENV NVM_DIR=/root/.nvm
ENV NODE_VERSION_14=14
ENV NODE_VERSION_16=16
ENV NODE_VERSION_18=18

# # Install Node.js versions and set default
RUN . "$NVM_DIR/nvm.sh" && \
    nvm install $NODE_VERSION_14 && \
    nvm install $NODE_VERSION_16 && \
    nvm install $NODE_VERSION_18 && \
    nvm alias default $NODE_VERSION_18 && \
    nvm use default

# Install global npm packages
RUN . "$NVM_DIR/nvm.sh" && \
    nvm use default && \
    npm install -g @angular/cli nodemon pm2

# Install npm packages for the application using Node.js 14
WORKDIR /platform

# RUN /bin/bash -c ". $NVM_DIR/nvm.sh && nvm use 14 && npm install"

# Create MongoDB data directory
RUN mkdir -p /data/db && chown -R mongodb:mongodb /data/db

# Copy the startup script to the Docker image
# COPY ./start-services.sh /start-services.sh

# Expose MongoDB port
EXPOSE 27017

# Expose default application port
EXPOSE 3000

# Expose Angular application port
EXPOSE 4200

# Expose FastAPI application port
EXPOSE 8000

# Run the startup script
CMD ["./start-services.sh", "/bin/bash"]
