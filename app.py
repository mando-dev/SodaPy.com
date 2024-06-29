import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_restful import Resource, Api
from google.oauth2 import service_account
from google.auth.transport.requests import Request
import google.auth
import vertexai
from vertexai.preview.generative_models import GenerativeModel, GenerationConfig, SafetySetting, HarmCategory, HarmBlockThreshold
import re
from urllib.parse import unquote
from cachetools import TTLCache
import logging
import time
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)
api = Api(app)

logging.basicConfig(level=logging.DEBUG)

# Directly specify the path to your service account file here
key_path = 'sodapy-96607d34a36f.json'
scopes = ["https://www.googleapis.com/auth/cloud-platform"]
credentials = service_account.Credentials.from_service_account_file(key_path, scopes=scopes)

PROJECT_NUMBER = os.getenv('PROJECT_NUMBER')
ENDPOINT_ID = os.getenv('ENDPOINT_ID')
endpoint_name = f"projects/{PROJECT_NUMBER}/locations/us-central1/endpoints/{ENDPOINT_ID}"

app.logger.debug(f"PROJECT_NUMBER: {PROJECT_NUMBER}")
app.logger.debug(f"ENDPOINT_ID: {ENDPOINT_ID}")
app.logger.debug(f"Service Account Key Path: {key_path}")

states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida",
    "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska",
    "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
    "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
]

cache = TTLCache(maxsize=100, ttl=600)

def refresh_credentials_with_retry(credentials, retries=3, delay=5):
    for attempt in range(retries):
        try:
            credentials.refresh(Request())
            return
        except google.auth.exceptions.RefreshError as e:
            if attempt < retries - 1:
                time.sleep(delay)
                continue
            else:
                raise e

def filter_response(text):
    match = re.search(r"\b\d+(\.\d+)?%?\b", text)
    if match:
        value = match.group()
        if len(value) <= 2 or (len(value) == 4 and not value.isdigit()):
            return value
    return None

def fetch_prediction(state, model):
    retries = 5
    for attempt in range(retries):
        prompt = f"Please provide the soda consumption prediction percentage for {state} in the next year as a percentage."
        try:
            response = model.generate_content([prompt], generation_config=generation_config, safety_settings=safety_settings, stream=False)
            logging.debug(f"Response for {state} (attempt {attempt+1}): {response}")
            prediction = filter_response(response.text)
            if prediction is not None:
                return prediction
        except Exception as e:
            logging.error(f"Error fetching prediction for {state} on attempt {attempt+1}: {e}")
            time.sleep(2 ** attempt)
    logging.error(f"Max retries reached for {state}")
    return 'No percentage found'

@app.before_request
def log_request_info():
    app.logger.debug('Headers: %s', request.headers)
    app.logger.debug('Body: %s', request.get_data())

@app.after_request
def log_response_info(response):
    app.logger.debug('Response: %s', response.status)
    return response

@app.route("/")
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(app.static_folder, path)

class Prediction(Resource):
    def get(self):
        state = unquote(request.args.get('state'))
        if state not in states:
            return {'error': 'Invalid state'}, 400

        if state in cache:
            return jsonify({state: cache[state]})

        try:
            refresh_credentials_with_retry(credentials)
            vertexai.init(project=PROJECT_NUMBER, location="us-central1", credentials=credentials)
            model = GenerativeModel(endpoint_name)

            prediction = fetch_prediction(state, model)

            cache[state] = prediction

            return jsonify({state: prediction})
        except Exception as e:
            logging.error(f"Error fetching prediction for {state}: {e}")
            return {'error': str(e)}, 500

generation_config = GenerationConfig(max_output_tokens=2048, temperature=1, top_p=1)
safety_settings = [
    SafetySetting(category=HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
    SafetySetting(category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
    SafetySetting(category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
    SafetySetting(category=HarmCategory.HARM_CATEGORY_HARASSMENT, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
]

api.add_resource(Prediction, '/prediction')


if __name__ == "__main__":
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)

