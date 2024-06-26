FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . .

# Copy the service account key file into the container
COPY sodapy-96607d34a36f.json /app/sodapy-96607d34a36f.json

EXPOSE 8080

ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV SECRET_KEY=${SECRET_KEY}
ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV PROJECT_NUMBER=${PROJECT_NUMBER}
ENV ENDPOINT_ID=${ENDPOINT_ID}
ENV SERVICE_ACCOUNT_KEY_PATH=/app/sodapy-96607d34a36f.json

CMD ["python", "app.py"]
