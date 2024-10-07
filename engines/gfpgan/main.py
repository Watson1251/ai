import shutil
import os
import subprocess
from flask import Flask, request, jsonify
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

gfpgan_script = "/gfpgan/GFPGAN/inference_gfpgan.py"
base_output = "/tmp/gfpgan_output"

def enhance_face(image_path):
    result = {}

    # check if image_path is valid
    if not os.path.exists(image_path):
        return {"message": "Invalid image path"}
    
    # create a dir with the same name as image to hold the output (without extension)
    image_file = os.path.basename(image_path)
    image_name = os.path.splitext(image_file)[0]
    output_dir = os.path.join(base_output, image_name)
    os.makedirs(output_dir, exist_ok=True)

    # run GFPGAN script
    # Construct the command to run the script
    command = ['python', gfpgan_script, '--input', image_path, '--output', output_dir]
    script_result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # Get the output and errors (if any)
    output = script_result.stdout.decode('utf-8')
    errors = script_result.stderr.decode('utf-8')

    # Check the result and handle output/errors
    if script_result.returncode == 0:
        logging.info("Script executed successfully.")

        # build result path of whole image
        result_path = os.path.join(output_dir, 'restored_imgs', image_file)

        # check it exists
        if not os.path.exists(result_path):
            logging.error(f"Enhanced image not found: {result_path}")
            return {"message": "Enhanced image not found"}
        
        # copy to db dir
        db_dir = os.path.join('/db', 'gfpgan')
        os.makedirs(db_dir, exist_ok=True)
        db_path = os.path.join(db_dir, image_file)
        shutil.copyfile(result_path, db_path)

        # remove output dir
        shutil.rmtree(output_dir)

        # return path
        return {"results": db_path}
    else:
        logging.info(f"Error occurred: {errors}")
        return {"message": f"Error occurred: {errors}"}


@app.route('/enhance', methods=['POST'])
def search_face_req():
    try:
        data = request.get_json()
        image_path = data['path']

        result = enhance_face(image_path)

        if result.get("message"):
            return jsonify({'message': result["message"], 'results': []})
        
        return jsonify({'message': 'Enhancing completed successfully', 'results': result})
    
    except Exception as e:
        logging.error(f"Error occurred: {e}")
        return jsonify({'message': str(e), 'results': []})


if __name__ == "__main__":
    app.run()
    logging.info("Flask app is running.")
