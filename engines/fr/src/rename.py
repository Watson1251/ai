import os

def rename_dirs_and_images(dataset_path):
    # List all directories in the dataset path
    dirs = [d for d in os.listdir(dataset_path) if os.path.isdir(os.path.join(dataset_path, d))]
    
    # Sort directories to ensure ascending order
    dirs.sort()

    for i, dir_name in enumerate(dirs):
        # New directory name based on ascending numbers
        new_dir_name = str(i + 1)

        # Full paths for renaming directories
        old_dir_path = os.path.join(dataset_path, dir_name)
        new_dir_path = os.path.join(dataset_path, new_dir_name)

        # Rename the directory
        os.rename(old_dir_path, new_dir_path)
        print(f'Renamed directory: {old_dir_path} -> {new_dir_path}')

        # Find the image file in the new directory path
        images = [f for f in os.listdir(new_dir_path) if os.path.isfile(os.path.join(new_dir_path, f))]
        if images:
            image_name = images[0]  # Assuming one image per directory
            image_extension = os.path.splitext(image_name)[1]  # Preserve the original file extension

            # New image name matching the directory name
            new_image_name = f'{new_dir_name}{image_extension}'

            # Full paths for renaming images
            old_image_path = os.path.join(new_dir_path, image_name)
            new_image_path = os.path.join(new_dir_path, new_image_name)

            # Rename the image file
            os.rename(old_image_path, new_image_path)
            print(f'Renamed image: {old_image_path} -> {new_image_path}')

# Replace 'path/to/your/dataset' with the actual path to your dataset
dataset_path = '/fr/dataset/'
rename_dirs_and_images(dataset_path)
