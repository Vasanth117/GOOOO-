#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <vector>

// WIFI CONFIGURATION 
const char* ssid = "VASANTH"; 
const char* password = "Vasanthvee07";

// BACKEND CONFIGURATION 
// Adjust the backend IP to your network setup.
const char* serverName = "http://172.20.10.3:8001/api/v1/hardware/telemetry"; 
const char* hardwareSecret = "GOO_HARDWARE_SECRET";
const char* farmProfileId = "000000000000000000000000"; 

// SENSOR PINS
const int MOISTURE_PIN = 34; // Capacitive Soil Moisture Sensor (Analog Pin)
const int DHT_PIN = 4;       // DHT22 Data Pin
const int BUZZER_PIN = 5;    // Buzzer Pin (Change if connected to another GPIO)
#define DHTTYPE DHT22        // White sensor = DHT22

DHT dht(DHT_PIN, DHTTYPE);

// Non-blocking timers
unsigned long previousDataMillis = 0;
const long dataInterval = 3000; // Update every 3 seconds

unsigned long buzzerStartMillis = 0;
bool isBuzzerOn = false;
const long buzzerDuration = 10000; // Buzzer sounds for 10 seconds

// Passive Buzzer Oscillation
unsigned long lastBuzzerToggle = 0;
bool buzzerPinState = HIGH;

// Buffer for unsent readings
struct SensorReading {
  float moisture;
  float temperature;
  float humidity;
};
std::vector<SensorReading> readingBuffer;

void setup() {
  Serial.begin(115200);
  
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, HIGH); // HIGH = OFF for Low-Level Trigger buzzer
  
  dht.begin();
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. NON-BLOCKING BUZZER LOGIC
  if (isBuzzerOn) {
    if (currentMillis - buzzerStartMillis >= buzzerDuration) {
      digitalWrite(BUZZER_PIN, HIGH); // HIGH = OFF
      isBuzzerOn = false;
      Serial.println("Buzzer turned OFF after 10 seconds.");
    } else {
      // Create a sound wave (beep) for Passive Buzzers by rapidly turning it ON and OFF every 1 millisecond (500Hz tone)
      if (currentMillis - lastBuzzerToggle >= 1) {
        lastBuzzerToggle = currentMillis;
        buzzerPinState = !buzzerPinState;
        digitalWrite(BUZZER_PIN, buzzerPinState ? HIGH : LOW);
      }
    }
  }

  // 2. NON-BLOCKING SENSOR READ & SEND LOGIC (Every 3 seconds)
  if (currentMillis - previousDataMillis >= dataInterval) {
    previousDataMillis = currentMillis;

    // READ SENSORS
    int airValue = 3500;   
    int waterValue = 1500; 
    int sensorValue = analogRead(MOISTURE_PIN);
    float moisturePercent = map(sensorValue, airValue, waterValue, 0, 100); 
    
    if(moisturePercent > 100) moisturePercent = 100;
    if(moisturePercent < 0) moisturePercent = 0;
    
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature(); 
    
    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("Failed to read from DHT sensor! Retrying next cycle.");
      return; // Skip this cycle
    }
    
    Serial.printf("Moisture: %.2f%% | Temp: %.2fC | Humidity: %.2f%%\n", moisturePercent, temperature, humidity);
    
    // Check if any sensor exceeds 80% (or temp > 40C) to trigger Buzzer
    if ((moisturePercent > 80.0 || humidity > 80.0 || temperature > 40.0) && !isBuzzerOn) {
      digitalWrite(BUZZER_PIN, LOW); // LOW = ON for Low-Level Trigger buzzer
      isBuzzerOn = true;
      buzzerStartMillis = currentMillis;
      Serial.println("ALERT! Sensor exceeded 80% limit. Buzzer activated for 10s.");
    }
    
    SensorReading currentReading = {moisturePercent, temperature, humidity};
    
    if(WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverName);
      http.addHeader("Content-Type", "application/json");
      
      String httpRequestData = "{\"farm_profile_id\": \"" + String(farmProfileId) + "\", " +
                               "\"moisture_percent\": " + String(currentReading.moisture) + ", " +
                               "\"temperature_c\": " + String(currentReading.temperature) + ", " +
                               "\"humidity_percent\": " + String(currentReading.humidity) + ", " +
                               "\"secret_key\": \"" + String(hardwareSecret) + "\"}";
                               
      int httpResponseCode = http.POST(httpRequestData);
      
      if (httpResponseCode > 0) {
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
        readingBuffer.clear();
      } else {
        Serial.print("Error code: ");
        Serial.println(httpResponseCode);
        if (readingBuffer.size() < 100) {
          readingBuffer.push_back(currentReading);
        }
      }
      http.end();
    } else {
      Serial.println("WiFi Disconnected. Waiting to reconnect and buffering data...");
      if (readingBuffer.size() < 100) {
        readingBuffer.push_back(currentReading);
      }
      WiFi.reconnect();
    }
  }
}
