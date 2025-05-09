from flask import Flask, jsonify, Response
import json
import os

app = Flask(__name__)

@app.route('/')
def show_scraped_data():
    try:
        # Read the raw file content
        with open('scraped_data.json', 'r') as file:
            raw_content = file.read()
        
        # Return the raw JSON as a response with the correct content type
        return Response(raw_content, mimetype='application/json')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health')
def health_check():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)