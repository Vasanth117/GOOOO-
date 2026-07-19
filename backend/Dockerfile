FROM python:3.9-slim

WORKDIR /app

# System dependencies for OpenCV, etc. if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose backend port
EXPOSE 5000

CMD ["python", "run.py"]
