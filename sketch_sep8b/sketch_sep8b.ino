#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <vector>

// --- WIFI CONFIGURATION ---
const char* ssid = "OPPO A6x 5G a4z2"; 
const char* password = "123456789";

// --- BACKEND CONFIGURATION ---
// IMPORTANT: Put your laptop's IP here, and make sure the port is 8002!
const char* serverName = "http://192.168.163.220:8002/api/v1/hardware/telemetry"; 
const char* hardwareSecret = "GOO_HARDWARE_SECRET";
const char* farmProfileId = "000000000000000000000000"; 

// --- SENSOR PINS ---
const int MOISTURE_PIN = 34; // Capacitive Soil Moisture Sensor (Analog)
const int DHT_PIN = 4;       // DHT22 Data Pin (Digital)
const int BUZZER_PIN = 23;   // Buzzer Pin (GPIO 23 where you verified it works!)
#define DHTTYPE DHT22

DHT dht(DHT_PIN, DHTTYPE);

// Timers
unsigned long previousDataMillis = 0;
const long dataInterval = 3000; // Push telemetry every 3 seconds

unsigned long buzzerStartMillis = 0;
bool isBuzzerOn = false;
const long buzzerDuration = 3000; // Alert beep for 3 seconds

// Buffer for offline readings
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
  
  Serial.println("\n🌱 Starting GOO IoT Node...");
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n✅ WiFi Connected!");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());

  // Quick confirmation beep
  digitalWrite(BUZZER_PIN, LOW);
  delay(100);
  digitalWrite(BUZZER_PIN, HIGH);
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. AUTO-SHUTOFF BUZZER AFTER ALERT DURATION
  if (isBuzzerOn && (currentMillis - buzzerStartMillis >= buzzerDuration)) {
    digitalWrite(BUZZER_PIN, HIGH); // HIGH = OFF
    isBuzzerOn = false;
    Serial.println("🔕 Buzzer alert turned OFF.");
  }

  // 2. READ SENSORS & SEND TELEMETRY (EVERY 3 SECONDS)
  if (currentMillis - previousDataMillis >= dataInterval) {
    previousDataMillis = currentMillis;

    // Read Soil Moisture
    int airValue = 3500;   // dry air
    int waterValue = 1500; // submerged in water
    int sensorValue = analogRead(MOISTURE_PIN);
    float moisturePercent = map(sensorValue, airValue, waterValue, 0, 100); 
    if (moisturePercent > 100) moisturePercent = 100;
    if (moisturePercent < 0) moisturePercent = 0;
    
    // Read DHT22
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature(); 
    
    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("⚠️ DHT reading retry...");
      return; 
    }
    
    Serial.printf("📊 Soil: %.1f%% | Temp: %.1f°C | Hum: %.1f%%\n", moisturePercent, temperature, humidity);
    
    // Safety Alert: Buzz if Soil < 15% (drought) or Temp > 38°C
    if ((moisturePercent > 75.0 || moisturePercent < 15.0 || humidity > 80.0 || temperature > 38.0) && !isBuzzerOn) {
      digitalWrite(BUZZER_PIN, LOW); // LOW = ON
      isBuzzerOn = true;
      buzzerStartMillis = currentMillis;
      Serial.println("🚨 ALERT! Moisture low or heat high. Buzzer activated!");
    }
    
    // Prepare JSON payload
    String httpRequestData = "{\"farm_profile_id\": \"" + String(farmProfileId) + "\", " +
                             "\"moisture_percent\": " + String(moisturePercent, 1) + ", " +
                             "\"temperature_c\": " + String(temperature, 1) + ", " +
                             "\"humidity_percent\": " + String(humidity, 1) + ", " +
                             "\"secret_key\": \"" + String(hardwareSecret) + "\"}";

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverName);
      http.addHeader("Content-Type", "application/json");
      
      int httpResponseCode = http.POST(httpRequestData);
      
      if (httpResponseCode == 200) {
        Serial.println("📡 Telemetry sent to Backend [200 OK]");
      } else {
        Serial.printf("⚠️ Backend HTTP Code: %d\n", httpResponseCode);
      }
      http.end();
    } else {
      Serial.println("❌ WiFi Disconnected. Reconnecting...");
      WiFi.reconnect();
    }
  }
}
