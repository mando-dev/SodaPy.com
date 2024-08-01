# Start with a base image containing Python runtime
FROM python:3.12-slim

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV SERVICE_ACCOUNT_KEY_PATH=/app/sodapy-96607d34a36f.json

# Set the working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the service account file and application code
COPY sodapy-96607d34a36f.json /app/sodapy-96607d34a36f.json
COPY . /app

# Copy React build files from static directory
COPY static /app/static

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["flask", "run", "--host=0.0.0.0", "--port=8080"]
