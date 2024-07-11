from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/process', methods=['POST'])  # Ensure no trailing slash
def process_data():
    data = request.get_json()
    
    path = data['path']
    print(path)

    result = {
        'message': 'Processed data successfully',
        'input': data
    }
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
