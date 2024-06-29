import os
from flask import Flask, jsonify, request
import logging
from google.oauth2 import service_account
from google.auth.transport.requests import Request
import vertexai
from vertexai.preview.language_models import TextGenerationModel

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

# Path to your service account key file
key_path = "sodapy-96607d34a36f.json"

# Obtain credentials using the service account key file
credentials = service_account.Credentials.from_service_account_file(key_path, scopes=["https://www.googleapis.com/auth/cloud-platform"])
credentials.refresh(Request())

# Project ID
project = "668617520007"

@app.route('/')
def index():
    return "Welcome to the Soda Consumption Prediction API!"

@app.route('/prediction')
def prediction():
    state = request.args.get('state')
    if not state:
        app.logger.debug("State parameter is missing")
        return jsonify({"error": "State parameter is missing"}), 400
    
    app.logger.debug(f"Received request for state: {state}")
    
    try:
        prediction = predict_from_vertex_ai(state)
        app.logger.debug(f"Prediction for {state}: {prediction}")
        return jsonify({state: prediction})
    except Exception as e:
        app.logger.error(f"Error getting prediction for {state}: {e}")
        return jsonify({"error": str(e)}), 500

def predict_from_vertex_ai(state):
    vertexai.init(project=project, location="us-central1", credentials=credentials)
    model = TextGenerationModel.from_pretrained("text-bison@001")
    
    prompt = f"Please provide the soda consumption prediction percentage for {state} in the next year as a percentage."
    
    response = model.predict(prompt)
    prediction = response.text.strip()
    
    return prediction

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

