import os
import logging
from flask import Flask, jsonify, request, send_from_directory, make_response
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
import time
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask_compress import Compress

# Load environment variables from .env.local
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__, static_folder='static', static_url_path='/')
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
Compress(app)
api = Api(app)

# Load environment variables
key_path = os.getenv('KEY_PATH')
print(f"Key path: {key_path}")  # Debugging line

scopes = ["https://www.googleapis.com/auth/cloud-platform"]
credentials = service_account.Credentials.from_service_account_file(key_path, scopes=scopes)

PROJECT_NUMBER = os.getenv('PROJECT_NUMBER')
ENDPOINT_ID = os.getenv('ENDPOINT_ID')
print(f"Project Number: {PROJECT_NUMBER}")  # Debugging line
print(f"Endpoint ID: {ENDPOINT_ID}")  # Debugging line

endpoint_name = f"projects/{PROJECT_NUMBER}/locations/us-central1/endpoints/{ENDPOINT_ID}"
print(f"Endpoint Name: {endpoint_name}")  # Debugging line

states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida",
    "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska",
    "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
    "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
]

cache = TTLCache(maxsize=100, ttl=3600)
executor = ThreadPoolExecutor(max_workers=10)

def refresh_credentials_with_retry(credentials, retries=3, delay=5):
    for attempt in range(retries):
        try:
            credentials.refresh(Request())
            logging.info("Credentials refreshed successfully")
            return
        except google.auth.exceptions.RefreshError as e:
            logging.error(f"Failed to refresh credentials: {e}")
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
    if state in cache:
        return cache[state]
    
    retries = 5
    for attempt in range(retries):
        prompt = f"Please provide the soda consumption prediction percentage for {state} in the next year as a percentage."
        try:
            response = model.generate_content([prompt], generation_config=generation_config, safety_settings=safety_settings, stream=False)
            prediction = filter_response(response.text)
            if prediction is not None:
                cache[state] = prediction
                logging.info(f"Prediction fetched for {state}: {prediction}")
                return prediction
        except Exception as e:
            logging.error(f"Error fetching prediction for {state}: {e}")
            time.sleep(2 ** attempt)
    
    cache[state] = 'next hour'
    logging.info(f"Default prediction used for {state}: next hour")
    return 'next hour'

def fetch_all_predictions():
    try:
        refresh_credentials_with_retry(credentials)
        vertexai.init(project=PROJECT_NUMBER, location="us-central1", credentials=credentials)
        model = GenerativeModel(endpoint_name)
        logging.info("Vertex AI model initialized")

        with ThreadPoolExecutor() as executor:
            future_to_state = {executor.submit(fetch_prediction, state, model): state for state in states}
            for future in as_completed(future_to_state):
                state = future_to_state[future]
                try:
                    prediction = future.result()
                    if prediction is None:
                        prediction = cache.get(state, 'No percentage found')
                        if prediction is None:
                            prediction = 'No percentage found'
                    cache[state] = prediction
                    logging.info(f"Prediction for {state}: {prediction}")
                except Exception as e:
                    logging.error(f"Error in fetch_all_predictions for {state}: {e}")
                    cache[state] = cache.get(state, 'No percentage found')
    except Exception as e:
        logging.error(f"Failed to fetch all predictions: {e}")

@app.after_request
def add_header(response):
    response.cache_control.max_age = 86400
    return response

@app.route("/")
def serve():
    response = make_response(send_from_directory(app.static_folder, 'index.html'))
    response.cache_control.max_age = 86400
    return response

@app.route("/<path:path>")
def serve_static(path):
    response = make_response(send_from_directory(app.static_folder, path))
    response.cache_control.max_age = 86400
    return response

# Ensure you schedule the fetch_all_predictions to run at the desired interval
scheduler = BackgroundScheduler()
scheduler.add_job(fetch_all_predictions, 'interval', hours=1)
scheduler.start()

if __name__ == "__main__":
    fetch_all_predictions()
    app.run(host='0.0.0.0', port=8080)
