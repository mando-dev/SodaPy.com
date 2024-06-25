# Use the official Python image.
# https://hub.docker.com/_/python
FROM python:3.9-slim

# Set the working directory.
WORKDIR /app

# Install dependencies.
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Copy the application files.
COPY . .

# Expose the port the app runs on.
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV SECRET_KEY=${SECRET_KEY}
ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV PROJECT_NUMBER=${PROJECT_NUMBER}
ENV ENDPOINT_ID=${ENDPOINT_ID}

# Run the application.
CMD ["flask", "run", "--host=0.0.0.0"]
