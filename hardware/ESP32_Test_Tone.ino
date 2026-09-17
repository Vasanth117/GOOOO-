
#include <Arduino.h>
#define BUZZER_PIN 23
void setup() {
  tone(BUZZER_PIN, 2500, 1000);
}
void loop() {
  tone(BUZZER_PIN, 2500);
  delay(500);
  noTone(BUZZER_PIN);
  delay(500);
}
