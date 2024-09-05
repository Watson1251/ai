import os
import shutil
import argparse
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed

def duplicate_single_directory(source_dir, target_dir, image_file, new_image_name):
    """
    Duplicates a single directory and renames the image inside.

    :param source_dir: The directory to duplicate.
    :param target_dir: The target directory where the duplicate will be stored.
    :param image_file: The image file in the source directory.
    :param new_image_name: The new name for the image in the duplicated directory.
    """
    try:
        shutil.copytree(source_dir, target_dir)
        os.rename(
            os.path.join(target_dir, image_file),
            os.path.join(target_dir, new_image_name)
        )
    except Exception as e:
        print(f"Error duplicating directory '{source_dir}' to '{target_dir}': {e}")

def duplicate_directory_with_image_rename_parallel(source_dir, num_duplicates, target_base_dir, start_number):
    """
    Duplicates a directory a specified number of times with ascending numeric names and renames the image inside.

    :param source_dir: The directory to duplicate.
    :param num_duplicates: The number of times to duplicate the directory.
    :param target_base_dir: The base directory where duplicates will be stored.
    :param start_number: The starting number for naming the duplicated directories and images.
    """
    if not os.path.isdir(source_dir):
        print(f"Source directory '{source_dir}' does not exist.")
        return

    # Ensure target base directory exists
    os.makedirs(target_base_dir, exist_ok=True)

    # Identify the image file in the source directory
    image_files = [f for f in os.listdir(source_dir) if os.path.isfile(os.path.join(source_dir, f)) and f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'))]
    
    if not image_files:
        print(f"No image files found in source directory '{source_dir}'.")
        return

    if len(image_files) > 1:
        print(f"Multiple image files found in source directory '{source_dir}'. Only one image file should be present.")
        return

    image_file = image_files[0]

    tasks = []
    with ThreadPoolExecutor() as executor:
        # Loop to create duplicates and add them to the thread pool
        for i in range(num_duplicates):
            target_dir = os.path.join(target_base_dir, str(start_number + i))
            new_image_name = f"{start_number + i}{os.path.splitext(image_file)[1]}"
            tasks.append(executor.submit(duplicate_single_directory, source_dir, target_dir, image_file, new_image_name))

        # Display progress bar while tasks are being executed
        for _ in tqdm(as_completed(tasks), total=num_duplicates, desc="Duplicating directories", unit="copy"):
            pass

if __name__ == "__main__":
    # Set up argument parsing
    parser = argparse.ArgumentParser(description="Duplicate a directory a specified number of times with numeric names and rename images.")
    parser.add_argument("source_directory", type=str, help="The path of the directory to duplicate.")
    parser.add_argument("number_of_duplicates", type=int, help="The number of times to duplicate the directory.")
    parser.add_argument("target_directory_base", type=str, help="The base directory where duplicates will be stored.")
    parser.add_argument("start_number", type=int, help="The starting number for naming the duplicated directories and images.")

    args = parser.parse_args()

    # Call the function with command-line arguments
    duplicate_directory_with_image_rename_parallel(args.source_directory, args.number_of_duplicates, args.target_directory_base, args.start_number)
