#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// --- WIFI CONFIGURATION ---
// IMPORTANT: ESP32 requires a 2.4GHz network. Make sure 'Maximise Compatibility' is ON in your iPhone settings!
// IMPORTANT: ESP32 requires a 2.4GHz network. Make sure 'Maximise Compatibility' is ON in your iPhone settings!
const char* ssid = "VASANTH"; 
const char* password = "Vasanthvee07";

// --- BACKEND CONFIGURATION ---
// IMPORTANT: Replace this IP with the local IP address of the computer running your FastAPI backend
// You can find it by typing 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux) in your terminal.
const char* serverName = "http://172.20.10.3:8000/api/v1/hardware/telemetry"; 
const char* hardwareSecret = "GOO_HARDWARE_SECRET";
const char* farmProfileId = "REPLACE_WITH_YOUR_FARM_PROFILE_ID"; // Get this from your MongoDB database (e.g. 64d9f7...)

// --- SENSOR PINS ---
const int MOISTURE_PIN = 34; // Capacitive Soil Moisture Sensor (Analog Pin)
const int DHT_PIN = 4;       // DHT11 or DHT22 Data Pin (Digital Pin)
#define DHTTYPE DHT22        // Change to DHT11 if using DHT11

DHT dht(DHT_PIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Connect to Wi-Fi
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");
    
    // --- 1. READ SOIL MOISTURE ---
    // The ESP32 ADC reads 0-4095. Usually, higher value means drier for capacitive sensors.
    // You might need to calibrate these values:
    int airValue = 3500;   // Read this when the sensor is completely dry in the air
    int waterValue = 1500; // Read this when the sensor is submerged in water
    
    int sensorValue = analogRead(MOISTURE_PIN);
    float moisturePercent = map(sensorValue, airValue, waterValue, 0, 100); 
    
    // Clamp values between 0 and 100
    if(moisturePercent > 100) moisturePercent = 100;
    if(moisturePercent < 0) moisturePercent = 0;
    
    // --- 2. READ DHT SENSOR (TEMP & HUMIDITY) ---
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature(); // Celsius
    
    // Check if any reads failed and exit early (to try again).
    if (isnan(humidity) || isnan(temperature)) {
      Serial.println(F("Failed to read from DHT sensor!"));
      delay(2000);
      return;
    }
    
    Serial.printf("Moisture: %.2f%% | Temp: %.2fC | Humidity: %.2f%%\n", moisturePercent, temperature, humidity);
    
    // --- 3. CREATE JSON PAYLOAD ---
    String httpRequestData = "{\"farm_profile_id\": \"" + String(farmProfileId) + "\", " +
                             "\"moisture_percent\": " + String(moisturePercent) + ", " +
                             "\"temperature_c\": " + String(temperature) + ", " +
                             "\"humidity_percent\": " + String(humidity) + ", " +
                             "\"secret_key\": \"" + String(hardwareSecret) + "\"}";
                             
    Serial.println("Sending Data:");
    Serial.println(httpRequestData);
    
    // --- 4. SEND POST REQUEST ---
    int httpResponseCode = http.POST(httpRequestData);
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println(response);
    }
    
    http.end();
  } else {
    Serial.println("WiFi Disconnected. Waiting to reconnect...");
  }
  
  // Wait 1 minute before next reading 
  // (In production, consider 10-30 minutes and using ESP32 deep sleep)
  delay(60000); 
}
