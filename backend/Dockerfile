FROM python:3.11-slim

WORKDIR /app

# System dependencies for OpenCV, etc. if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Install CPU-only PyTorch first to save gigabytes of disk space and prevent EC2 crash
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose backend port
EXPOSE 5000

CMD ["python", "run.py"]
