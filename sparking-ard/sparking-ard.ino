#include <WiFiUdp.h>

#include <NTPClient.h>

#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>

#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"


#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Servo.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo myservo;


  
#define WIFI_SSID "iotg" 
#define WIFI_PASSWORD "iotg1234" 

#define API_KEY "AIzaSyC0smQ311k3ZcmEQp6DYzuD5kLfZ8gE--I"
#define DATABASE_URL "https://test-45d5d-default-rtdb.firebaseio.com/"

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "ntp.ubuntu.com", 123, 60000);


FirebaseData fdbo;
FirebaseAuth auth;
FirebaseConfig config;

bool signupOK = false;
int test;


const int IR_IN = D6; 
const int IR_OUT = D8; 
int Slot = 3;
bool vehicleEnteringProcess = false;
bool vehicleExitingProcess = false;
bool parkingFull = false;
int hh, mm;
String h, m;

String vrijemeUlaska, vrijemeIzlaska;


void setup() {



  Serial.begin(9600);
   WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("connecting");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("connected: ");
  Serial.println(WIFI_SSID);

   config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if(Firebase.signUp(&config, &auth, "", ""))
  {
    Serial.println("signUp OK");
    signupOK = true;
  }else
  {
    Serial.printf("nesto");
  }

  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);


  Serial.println("Parking System Initialized");

  lcd.begin();
  lcd.backlight();

  pinMode(IR_IN, INPUT);
  pinMode(IR_OUT, INPUT);

  myservo.attach(D3); 
  myservo.write(50);  

  lcd.setCursor(0, 0);
  lcd.print("Parking System");

  delay(500);

  Slot = 3; 

}

void loop() {



int brojSlobodnih = 0;
  if (Firebase.getInt(fdbo, "/brojSlobodnih/", &brojSlobodnih)) { 
    Serial.print("Broj slobodnih mjesta: ");
    Serial.println(brojSlobodnih);
    lcd.setCursor(0, 1); 
    lcd.print("Slobodno: "); 
    lcd.print(brojSlobodnih);



  timeClient.update();
  hh = timeClient.getHours() + 1;
  mm = timeClient.getMinutes();
  h = String(hh);
  m = String(mm);


  if (digitalRead(IR_IN) == LOW && brojSlobodnih > 0) {
    Serial.println("Detected vehicle entering");
    vrijemeUlaska = h + ":" + m;
    Firebase.setString(fdbo, "/vrijemeUlaska/", vrijemeUlaska);
    Serial.println(vrijemeUlaska);
  }


   if (digitalRead(IR_OUT) == LOW && brojSlobodnih < 3) {
    Serial.println("Detected vehicle exiting");
    vehicleExitingProcess = true; 
    myservo.write(180); 
    delay(2000); 
    myservo.write(50); 
    brojSlobodnih++;
    Firebase.setInt(fdbo, "/brojSlobodnih/", brojSlobodnih);

    vrijemeIzlaska = h + ":" + m;
    Firebase.setString(fdbo, "/vrijemeIzlaska/", vrijemeIzlaska);
    Serial.println(vrijemeIzlaska);

    Serial.println("Vehicle Exited, Slots Left: " + String(Slot));
    delay(1000); 
  }



int rampaStatus = 0;

int mahanjeArd = 0;

Firebase.getInt(fdbo, "/rampa/", &rampaStatus);

Serial.print("Putanja: /rampa/, Vrijednost: ");
Serial.println(rampaStatus);


int mahanjeArd = 0;
Firebase.getInt(fdbo, "/mahanje/", &mahanjeArd);

if(mahanjeArd == 1)
{
    Serial.println("mahanje uslo");
    myservo.write(180);
    delay(2000);
    myservo.write(50);
    delay(1000);
    myservo.write(180);
    delay(2000);
    myservo.write(50);
    delay(1000);
     myservo.write(180);
    delay(2000);
    myservo.write(50);
    Firebase.setInt(fdbo, "/mahanje/", 0); 
}


if (rampaStatus) {
    Serial.println("Rampa je otvorena.");
    myservo.write(180);
    delay(2000);
    Firebase.setInt(fdbo, "/rampa/", 0); 
} else {
    Serial.println("Rampa je zatvorena.");
    myservo.write(50); 
}
   


  if (Slot == 0 && !parkingFull) {
    parkingFull = true;
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Parking is full");
    Serial.println("Parking is full, Come back later");
  } else if (Slot > 0 && parkingFull) {
    parkingFull = false;
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Parking System");
  }
}
}
