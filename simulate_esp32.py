import requests
import json
import time
import random

url = "http://127.0.0.1:8001/api/v1/hardware/telemetry"
payload = {
    "farm_profile_id": "000000000000000000000000",
    "moisture_percent": random.uniform(30.0, 60.0),
    "temperature_c": random.uniform(22.0, 26.0),
    "humidity_percent": random.uniform(40.0, 55.0),
    "secret_key": "GOO_HARDWARE_SECRET"
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
