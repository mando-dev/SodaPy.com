import os
from flask import Flask, jsonify, request, send_from_directory, Response, stream_with_context
from flask_cors import CORS
from google.oauth2 import service_account
from google.auth.transport.requests import Request
import google
import vertexai
from vertexai.preview.generative_models import GenerativeModel, GenerationConfig, SafetySetting, HarmCategory, HarmBlockThreshold
import re
import json
from datetime import datetime, timedelta
import threading
import time
from cachetools import TTLCache
import logging
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})

logging.basicConfig(level=logging.DEBUG)

key_path = os.getenv('KEY_PATH')
scopes = ["https://www.googleapis.com/auth/cloud-platform"]
credentials = service_account.Credentials.from_service_account_file(key_path, scopes=scopes)

PROJECT_NUMBER = os.getenv('PROJECT_NUMBER')
ENDPOINT_ID = os.getenv('ENDPOINT_ID')
endpoint_name = f"projects/{PROJECT_NUMBER}/locations/us-central1/endpoints/{ENDPOINT_ID}"

states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida",
    "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska",
    "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
    "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
]

cache = TTLCache(maxsize=100, ttl=3600)  # Cache for 1 hour
CACHE_FILE = 'prediction_cache.json'
DEFAULT_VALUE = '20.0'

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
    # First, try to find a percentage
    match = re.search(r"\b(\d{1,2}(\.\d+)?)\s*%", text)
    if match:
        return match.group(1)
    
    # If no percentage, look for any number
    match = re.search(r"\b(\d{1,2}(\.\d+)?)\b", text)
    if match:
        return match.group(1)
    
    return None

def fetch_prediction(state, model):
    retries = 3
    for attempt in range(retries):
        prompt = f"Please provide the soda consumption prediction percentage for {state} in the next year as a percentage."
        try:
            response = model.generate_content([prompt], generation_config=generation_config, safety_settings=safety_settings, stream=False)
            
            # Clean the response text
            cleaned_text = response.text.strip()
            
            # Try to parse the entire response as JSON
            try:
                json_response = json.loads(cleaned_text)
                if isinstance(json_response, dict) and 'prediction' in json_response:
                    return str(json_response['prediction'])
            except json.JSONDecodeError:
                pass  # If it's not valid JSON, continue with normal processing
            
            prediction = filter_response(cleaned_text)
            if prediction is not None:
                return prediction
            
            logging.warning(f"Unable to extract prediction from response for {state}: {cleaned_text}")
        except Exception as e:
            logging.error(f"Error fetching prediction for {state} on attempt {attempt+1}: {e}")
            if attempt == retries - 1:
                raise
        time.sleep(2 ** attempt)
    return DEFAULT_VALUE

def load_cache():
    try:
        with open(CACHE_FILE, 'r') as f:
            data = f.read().strip()
            if data:
                return json.loads(data)
            else:
                return {}
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError as e:
        logging.error(f"Error decoding cache file: {e}")
        return {}

def save_cache(cache_data):
    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache_data, f)
    except Exception as e:
        logging.error(f"Error saving cache: {e}")

def get_prediction(state):
    if state in cache:
        return cache[state]
    
    persistent_cache = load_cache()
    if state in persistent_cache:
        cache[state] = persistent_cache[state]
        return persistent_cache[state]
    
    return None

def set_prediction(state, prediction):
    cache[state] = prediction
    persistent_cache = load_cache()
    persistent_cache[state] = prediction
    save_cache(persistent_cache)

def update_predictions():
    while True:
        try:
            refresh_credentials_with_retry(credentials)
            vertexai.init(project=PROJECT_NUMBER, location="us-central1", credentials=credentials)
            model = GenerativeModel(endpoint_name)

            for state in states:
                try:
                    prediction = fetch_prediction(state, model)
                    set_prediction(state, prediction)
                    logging.debug(f"Updated prediction for {state}: {prediction}")
                except Exception as e:
                    logging.error(f"Error updating prediction for {state}: {e}")
                    # Use the default value or the last known good value
                    last_known = get_prediction(state)
                    if last_known is None:
                        last_known = DEFAULT_VALUE
                    set_prediction(state, last_known)
                    logging.info(f"Using fallback value for {state}: {last_known}")
                
                time.sleep(1)  # Add a small delay between requests to avoid rate limiting
            
            time.sleep(3600)  # Update every hour
        except Exception as e:
            logging.error(f"Error in update_predictions: {e}")
            time.sleep(60)  # Wait 1 minute before retrying

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route("/prediction", methods=["GET"])
def prediction():
    state = request.args.get('state')
    if state not in states:
        return jsonify({'error': 'Invalid state'}), 400

    prediction = get_prediction(state)
    if prediction is None:
        prediction = DEFAULT_VALUE
        set_prediction(state, prediction)

    return jsonify({state: prediction})

@app.route("/all_predictions", methods=["GET"])
def all_predictions():
    def generate():
        yield '{'
        for i, state in enumerate(states):
            prediction = get_prediction(state) or DEFAULT_VALUE
            yield f'"{state}": "{prediction}"'
            if i < len(states) - 1:
                yield ', '
        yield '}'

    return Response(stream_with_context(generate()), mimetype='application/json')

generation_config = GenerationConfig(max_output_tokens=2048, temperature=1, top_p=1)
safety_settings = [
    SafetySetting(category=HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
    SafetySetting(category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
    SafetySetting(category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
    SafetySetting(category=HarmCategory.HARM_CATEGORY_HARASSMENT, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
]

if __name__ == "__main__":
    threading.Thread(target=update_predictions, daemon=True).start()
    app.run(debug=True, host='0.0.0.0', port=5000)
