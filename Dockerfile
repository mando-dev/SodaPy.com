# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory to /app
WORKDIR /app

# Copy the requirements.txt file and install any needed packages
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . .

# Ensure the static directory is copied
COPY ./static /app/static

# Copy the service account key file into the container
COPY sodapy-96607d34a36f.json /app/sodapy-96607d34a36f.json

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV SECRET_KEY=${SECRET_KEY}
ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV PROJECT_NUMBER=${PROJECT_NUMBER}
ENV ENDPOINT_ID=${ENDPOINT_ID}
ENV SERVICE_ACCOUNT_KEY_PATH=/app/sodapy-96607d34a36f.json

# Run app.py when the container launches
CMD ["python", "app.py"]

