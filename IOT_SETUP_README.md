# GOO Platform - Real-Time IoT Sensor Monitoring System

This document outlines the setup and architecture for the Real-Time IoT Sensor Monitoring System integrating an ESP32 hardware node, FastAPI backend, and React frontend over WebSockets.

## Architecture Overview

```mermaid
graph TD
    ESP32[ESP32 Sensor Node] -->|HTTP POST (JSON every 1s)| Backend(FastAPI Backend)
    Backend -->|Validate & Store| DB[(MongoDB)]
    Backend -->|Broadcast via WebSocket| Frontend(React Frontend)
    Frontend -->|Connect & Receive Updates| Dashboard[Dashboard UI]
```

## Features
- **ESP32 Firmware**: Reads DHT22 and Soil Moisture sensors, buffers data when offline, and transmits JSON payloads every second.
- **FastAPI Backend**: Exposes `/api/v1/hardware/telemetry` for data ingestion, handles validation, stores data, and pushes live updates to `/ws`.
- **React Frontend**: Subscribes to the WebSocket via a custom connection manager with exponential backoff and heartbeat, instantly updating the global `SensorContext`.
- **Dashboard UI**: Displays dynamic `SensorCard`s and real-time Recharts `LiveChart`s using Framer Motion animations.

## Setup Instructions

### 1. Backend Setup

Ensure you are in the `backend` directory.

1. **Environment Variables**: Copy `.env.example` to `.env` and adjust the variables.
    ```bash
    cp .env.example .env
    ```
2. **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
3. **Run Server**:
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```
    *The WebSocket endpoint will be available at `ws://localhost:8000/ws`.*

### 2. Frontend Setup

Ensure you are in the `frontend` directory.

1. **Environment Variables**: Copy `.env.example` to `.env` and set `VITE_WS_URL`.
    ```bash
    cp .env.example .env
    ```
2. **Install Dependencies**:
    ```bash
    npm install
    # Note: react-toastify has been added to package.json
    ```
3. **Run Development Server**:
    ```bash
    npm run dev
    ```
    *The new Dashboard will be available at `/hardware`.*

### 3. ESP32 Hardware Setup

Navigate to `hardware/ESP32_SensorNode`.

1. Open `ESP32_SensorNode.ino` in the Arduino IDE.
2. Update the `ssid`, `password`, and `serverName` with your local IP and Wi-Fi credentials.
3. Flash the firmware to your ESP32 board.
4. Open the Serial Monitor at `115200` baud to monitor connection and data transmission.

### 4. Docker (Optional)

To spin up the entire system via Docker:

```bash
docker-compose up --build
```
This will start the backend on port 8000 and the frontend on port 5173.

## Environment Files

### Backend (`backend/.env`)
```env
PORT=8000
HARDWARE_SECRET="GOO_HARDWARE_SECRET"
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
```
