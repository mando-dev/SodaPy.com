import os
from flask import Flask, jsonify, request, send_from_directory, make_response
from flask_cors import CORS
from flask_restful import Resource, Api
from google.oauth2 import service_account
from google.auth.transport.requests import Request
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
import pandas as pd
import xgboost as xgb
from statsmodels.tsa.arima.model import ARIMA
import joblib

# Load environment variables
load_dotenv()

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

states = ["Texas"]

cache = TTLCache(maxsize=100, ttl=3600)
executor = ThreadPoolExecutor(max_workers=10)

def refresh_credentials_with_retry(credentials, retries=3, delay=5):
    for attempt in range(retries):
        try:
            credentials.refresh(Request())
            return
        except google.auth.exceptions.RefreshError:
            if attempt < retries - 1:
                time.sleep(delay)
                continue
            else:
                raise

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
                return prediction
        except Exception:
            time.sleep(2 ** attempt)

    cache[state] = 'next month'
    return 'next month'

def fetch_all_predictions():
    refresh_credentials_with_retry(credentials)
    vertexai.init(project=PROJECT_NUMBER, location="us-central1", credentials=credentials)
    model = GenerativeModel(endpoint_name)

    with ThreadPoolExecutor() as executor:
        future_to_state = {executor.submit(fetch_prediction, state, model): state for state in states}
        for future in as_completed(future_to_state):
            state = future_to_state[future]
            prediction = future.result() or cache.get(state, 'next month')
            cache[state] = prediction

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

class Prediction(Resource):
    def get(self):
        state = unquote(request.args.get('state'))
        if state not in states:
            return {'error': 'Invalid state'}, 400

        vertexai.init(project=PROJECT_NUMBER, location="us-central1", credentials=credentials)
        model = GenerativeModel(endpoint_name)
        future = executor.submit(fetch_prediction, state, model)
        prediction = future.result()
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

scheduler = BackgroundScheduler()
scheduler.add_job(fetch_all_predictions, 'interval', days=31)  # Every 31 days
scheduler.start()

fetch_all_predictions()

if __name__ == "__main__":
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
