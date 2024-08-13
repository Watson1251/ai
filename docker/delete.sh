#!/bin/bash

# Function to display all Docker images
list_images() {
    echo ""
    echo "Available Docker Images:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}\t{{.Size}}"
}

# Function to prompt user for selection
select_image() {
    echo ""
    echo "Please enter the Image ID of the Docker image you want to delete:"
    read -r image_id
    echo "You have selected Image ID: $image_id"
}

# Function to delete the selected image
delete_image() {
    echo ""
    echo "Are you sure you want to delete the image with ID $image_id? (y/n)"
    read -r confirmation
    if [ "$confirmation" == "y" ]; then
        # Check if any containers are using the image
        containers=$(docker ps -a -q --filter ancestor="$image_id")

        if [ -n "$containers" ]; then
            echo ""
            echo "The image is being used by the following containers:"
            docker ps -a --filter ancestor="$image_id" --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"

            echo ""
            echo "Do you want to stop and remove these containers? (y/n)"
            read -r stop_and_remove

            if [ "$stop_and_remove" == "y" ]; then
                docker stop $containers
                docker rm $containers
            else
                echo "Deletion cancelled because the image is still in use."
                exit 1
            fi
        fi

        # Try to delete the image again
        docker rmi "$image_id"
        if [ $? -eq 0 ]; then
            echo "Image $image_id has been deleted successfully."
        else
            echo "Failed to delete image $image_id. Please check if the image ID is correct."
        fi
    else
        echo "Deletion cancelled."
    fi
}

# Main script execution
list_images
select_image
delete_image
