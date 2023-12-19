#include <WiFi.h>
#include "PubSubClient.h"
#include <analogWrite.h>

const char* ssid = "SSID";
const char* password = "KEY";
const char* mqttServer = "broker.emqx.io";
int port = 1883;
String stMac;
char mac[50];
char clientId[50];

WiFiClient espClient;
PubSubClient client(espClient);

int onPeriod = 0;
unsigned long t = 0;
int pwm = 0;

void setup() {
  Serial.begin(115200);
  randomSeed(analogRead(0));

  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  wifiConnect();

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.println(WiFi.macAddress());
  stMac = WiFi.macAddress();
  stMac.replace(":", "_");
  Serial.println(stMac);
  
  client.setServer(mqttServer, port);
  client.setCallback(callback);

  pinMode(22, INPUT_PULLUP);
  pinMode(23, INPUT_PULLUP);
  pinMode(13, OUTPUT);
  analogWriteResolution(10);
  analogWriteFrequency(500);  
}

void wifiConnect() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
}

void mqttReconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    long r = random(1000);
    sprintf(clientId, "clientId-%ld", r);
    if (client.connect(clientId)) {
      Serial.print(clientId);
      Serial.println(" connected");
      client.subscribe("name/up");
      client.subscribe("name/down");
      client.subscribe("name/pwm");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  String stPayload;
  
  for (int i = 0; i < length; i++) {
    Serial.print((char) payload[i]);
    stPayload += (char) payload[i];
  }

  String stTopic = String(topic);
  int val = stPayload.toInt();
  
  if (stTopic == "name/up") {
    onPeriod += val;
  } else if (stTopic == "name/down"){
    onPeriod -= val;
  } else if (stTopic == "name/pwm") {
    onPeriod = val;
  }
}

void loop() {
  delay(10);
  if (!client.connected()) {
    mqttReconnect();
  }
  client.loop();

  int i22 = digitalRead(22);
  int i23 = digitalRead(23);
/*  
  Serial.println(i4);
  if (i4 == 0) {
    digitalWrite(26, HIGH);
  } else {
    digitalWrite(26, LOW); 
  }
*/

  if (i22 == 0) {
    onPeriod -= 10;
  }
  
  if (i23 == 0) {
    onPeriod += 10;
  }

  if (onPeriod < 0) onPeriod = 0;
  if (onPeriod > 1000) onPeriod = 1000;

  t = millis() % 1000;
  pwm = 1023 * onPeriod / 1000;

  analogWrite(13, pwm);    

  /*
  if (t < onPeriod) {
    analogWrite(13, pwm);    
  } else {
    analogWrite(13, 0);
  } 
  */
    
  Serial.println(onPeriod);
  delay(40);
}
