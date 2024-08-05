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
from concurrent.futures import ThreadPoolExecutor
from flask_compress import Compress
import pandas as pd
import xgboost as xgb
from statsmodels.tsa.arima.model import ARIMA
import joblib

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__, static_folder='static', static_url_path='/')
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
Compress(app)
api = Api(app)

key_path = 'sodapy-96607d34a36f.json'
scopes = ["https://www.googleapis.com/auth/cloud-platform"]
credentials = service_account.Credentials.from_service_account_file(key_path, scopes=scopes)

PROJECT_NUMBER = os.getenv('PROJECT_NUMBER')
ENDPOINT_ID = os.getenv('ENDPOINT_ID')
endpoint_name = f"projects/{PROJECT_NUMBER}/locations/us-central1/endpoints/{ENDPOINT_ID}"

state = "Texas"

# Cache with increased TTL and configurable maxsize
cache = TTLCache(maxsize=100, ttl=3000)  # Cache expires after 50 minutes
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

def fetch_prediction(state, model, force_refresh=False):
    if state in cache and not force_refresh:
        return cache[state]
    retries = 10
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
    cache[state] = 'refresh your browser'
    logging.info(f"Default prediction used for {state}: refresh your browser")
    return 'refresh your browser'

@app.after_request
def add_header(response):
    response.cache_control.max_age = 86400
    return response

@app.route("/")
def serve():
    response = make_response(send_from_directory(app.static_folder, 'index.html'))
    response.cache_control.max_age = 86400
    return response

@app.route("/static/<path:path>")
def serve_static(path):
    response = make_response(send_from_directory(app.static_folder, path))
    response.cache_control.max_age = 86400
    return response

class Prediction(Resource):
    def get(self):
        logging.debug("Received request for prediction")
        state = unquote(request.args.get('state'))
        force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
        logging.debug(f"Request state: {state}, force_refresh: {force_refresh}")
        if state != "Texas":
            return {'error': 'Invalid state'}, 400
        vertexai.init(project=PROJECT_NUMBER, location="us-central1", credentials=credentials)
        model = GenerativeModel(endpoint_name)
        future = executor.submit(fetch_prediction, state, model, force_refresh)
        prediction = future.result()
        logging.debug(f"Prediction result: {prediction}")
        return jsonify({state: prediction})

class PredictSoda(Resource):
    def post(self):
        data = request.get_json()
        features = [col for col in data.keys() if col not in ['Data_Value', 'split']]
        input_df = pd.DataFrame([data])

        # Load XGBoost model
        xgb_model_path = "xgboost_model_tuned.json"
        xgb_model = xgb.Booster()
        xgb_model.load_model(xgb_model_path)
        dinput = xgb.DMatrix(input_df[features])
        xgb_prediction = xgb_model.predict(dinput)[0]

        # ARIMA model prediction
        arima_model_path = "arima_model.pkl"
        arima_model = joblib.load(arima_model_path)
        arima_prediction = arima_model.forecast(steps=1)[0]

        # Gemini prediction
        gemini_prediction = get_gemini_predictions(input_df[features].to_dict(orient='records'))[0]

        # Ensemble prediction
        ensemble_prediction = (xgb_prediction + arima_prediction + gemini_prediction) / 3

        return jsonify({
            'xgboost_prediction': xgb_prediction,
            'arima_prediction': arima_prediction,
            'gemini_prediction': gemini_prediction,
            'ensemble_prediction': ensemble_prediction
        })

generation_config = GenerationConfig(max_output_tokens=2048, temperature=1, top_p=1)
safety_settings = [
    SafetySetting(category=HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
    SafetySetting(category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
    SafetySetting(category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
    SafetySetting(category=HarmCategory.HARM_CATEGORY_HARASSMENT, threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE),
]

api.add_resource(Prediction, '/prediction')
api.add_resource(PredictSoda, '/predict')

if __name__ == "__main__":
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
