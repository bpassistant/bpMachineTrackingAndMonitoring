/*
   Author: Jan Torge Schneider

   The script handles the machine modules.
   It registers logins and informs the server.


   --->  CONFIGURATION for new machine:  <---
    -change machineName and load script to mikrocontroller (check if board is connected and port is selected, then flash "hochladen")


   CONFIGURATION for debugging, local tests or after changes on the wifi:
    -change machineName
    -change Network config (wifinetwork and wifipassword
    -change ServerName (to the IP of your own computer, but keep the 1880 Port)
    -uncomment the debugging line (remove the // before #define debugging) to get debugging information from system via the serial monitor
    -if you dont have a running server for testing, you could uncomment the line with TestWithoutServerCommunication
*/

//--- Configuration---

// --->  Machine config  <---
//Enter the name of the machine between the "" -> Then upload the script to the mikrocontroller
#define machineName "Bandschleifer" // <---------




//-- Network config ---
#define wifinetwork "network=bauer+planer"
#define wifipassword "craftsandarts"

const char *ssid = wifinetwork;
const char *password = wifipassword;
//Server Hostname: monitoringServer
//IP b+p: 192.168.2.197
String serverName = "http://192.168.2.179:1880/";


//--- Includes (External Libraries) ---
#include <WiFi.h>
#include <HTTPClient.h>
#include <FastLED.h>
#include <Keypad.h>
#include <EasyMFRC522.h>

// If you want to see outputs and logs, the mikrocontroller must be connected to a pc.
// There you can watch the live logs and outputs on a seriell monitor (for example in the Arduino IDE).
// Remove the two Slashes before #define to uncomment the line. The debugging is activated!
// If you dont haven an PC connected permanently to the mikrocontroller or dont need logs, just comment the following line code (with to Slahes //).
//#define debugging


//--- User config ---
int userID = 0;
bool isLoggedIn = false;

//Remove the two Slashes before #define to uncomment the line. Then you can test without a server communication.
//Dont forget to recomment the line before active use!
//#define TestWithoutServerCommunication
int test_id = 100; // change your test id here
int inputID_RFID;
String inputID_PinPad;


//--- LED config ---
enum ledStates
{
  off,
  red,
  green,
  permissionNotHighEnough_Magenta,
  systemError_Blue
};

#define DATA_PIN 13
#define LED_TYPE WS2812B
#define COLOR_ORDER GRB
#define NUM_LEDS 9
#define BRIGHTNESS 100 // 0-255
CRGB leds[NUM_LEDS];

#define BLINK_INTERVALL 250
#define BLINK_DURATION 3000
bool blink = false;
bool ledsOn = true;
unsigned long blinkStartMillis = 0;
unsigned long blinkPreviousMillis = 0;
ledStates ledState;

//--- PinPad config ---
#define ROW_NUMBER 4
#define COLUM_NUMBER 3

char keys[ROW_NUMBER][COLUM_NUMBER] = {
    {'1', '2', '3'},
    {'4', '5', '6'},
    {'7', '8', '9'},
    {'r', '0', 'g'}};

byte pin_rows[ROW_NUMBER] = {25, 26, 32, 33}; // connect to the row pinouts of the keypad
byte pin_column[COLUM_NUMBER] = {27, 14, 12}; // connect to the column pinouts of the keypad

Keypad keypad = Keypad(makeKeymap(keys), pin_rows, pin_column, ROW_NUMBER, COLUM_NUMBER);

//--- RFID config ---
/**
 * ----------------------------------------------------------------------------
 * Easy MFRC522 library (RFID)
 * (Further information: https://github.com/pablo-sampaio/easy_mfrc522 or https://www.aranacorp.com/en/using-an-rfid-module-with-an-esp32/)
 * 
 * -----------------------------------------
 * Pin layout used
 * -----------------------------------------
 * MFRC522      NodeMCU
 * Reader       Esp32
 * Pin          Pin   
 * -----------------------------------------
 * SDA(SS)      5*
 * SCK          18
 * MOSI         23
 * MISO         19
 * RST          17*
 * NC(IRQ)      not used
 * 3.3V         3.3V
 * GND          GND
 * --------------------------------------------------------------------------
 */
#define SDA  5
#define RST  17
int sizeOfInputInByte = 4;

EasyMFRC522 rfidReader(SDA, RST); //the MFRC522 reader, with the SDA and RST pins given. The default (factory) keys A and B are used (or used setKeys to change)

#define BLOCK  1    //the initial block for all operations

//--- Timer ---
// Wait this time in milliseconds until the script asks the server, if there is still an activ session for the machine
#define TIME_CHECK_IF_SESSION_ACTIVE 900000
unsigned long bufferTimeBetweenRFIDReadRequests = 0;
unsigned int timeBetweenRFIDReadRequests = 100;
unsigned long bufferTimeBetweenRequests = 0;

// Sets some initial values
void setup()
{

  #ifdef debugging
  // Starts a serial connection to display infos on the arduino monitor.
  //TODO: Sollte zurück auf 9600 geändert werden! Dann muss nicht so viel umgestellt werden, wenn vorher ein anderer Arduino/MC angeschlossen war!
  Serial.begin(115200);
  if (Serial)
  {
    ; // Wait till a serial Monitor is connected.
  }
  #endif

  // you must call this initialization function!
  rfidReader.init(); 
  delay(500);

  WiFi.begin(ssid, password);

  #ifdef debugging
  Serial.println("Connecting");
  #endif

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    #ifdef debugging
    Serial.print(".");
    #endif
  }

  #ifdef debugging
  Serial.println("");
  Serial.print("Connected to WiFi network with IP address: ");
  Serial.println(WiFi.localIP());
  #endif

  FastLED.addLeds<LED_TYPE, DATA_PIN, COLOR_ORDER>(leds, NUM_LEDS).setCorrection(TypicalLEDStrip);

  // set master brightness control
  FastLED.setBrightness(BRIGHTNESS);

  inputID_PinPad.reserve(2); // maximum input characters is 3, change if needed

  ledState = red;
  updateLEDs(red);

  registerToServer();
}

void registerToServer()
{
  // Send informations about the connection to the server
  String serverPath = serverName + "sayHiToServer" + "?machineName=" + machineName + "&ipAdress=" + WiFi.localIP();

  String payload = httpGETRequest(serverPath);

  #ifdef debugging
  Serial.print("Payload from sayHiToServer request: ");
  Serial.println(payload);
  #endif
}

void loop()
{

  checkPinPadInput();

  checkAutoLogoutTime();

  checkLEDblink();

  //Call checkRFIDInput() every 100 milliseconds
  if(millis() >= bufferTimeBetweenRFIDReadRequests + timeBetweenRFIDReadRequests){
    checkRFIDInput();
  }
}

void checkPinPadInput()
{

  char key = keypad.getKey();

  if (key)
  {
    Serial.println(key);

    if (key == 'r')
    {
      if (isLoggedIn)
      {
        logout();
      }
      inputID_PinPad = ""; // clear input id
    }
    else if (key == 'g' && !isLoggedIn)
    {
      userID = inputID_PinPad.toInt();
      #ifdef TestWithoutServerCommunication
        testID();
      #else
        checkLogin();
      #endif
    }
    else
    {
      if (!isLoggedIn)
      {
        inputID_PinPad += key; // append new character to input password string
      }
    }
  }
}

void checkLogin()
{

  // Send request to server and check if user exists and permission is high enough
  String serverPath = serverName + "checkIfUserExists" + "?userid=" + userID + "&machineName=" + machineName;

  String payload = httpGETRequest(serverPath);
  #ifdef debugging
  Serial.print("Payload from check login request: ");
  Serial.println(payload);
  #endif
  
  evaluateCheckLoginPayload(payload);

  inputID_PinPad = ""; // clear input password
}

void evaluateCheckLoginPayload(String payload)
{
  unsigned long currentMillis = millis();
  
  if(payload == "userExistsPermissionHighEnough")
  {
    //if user exists and permission is correct, buffer user id -> LEDs green
    ledState = green;
    updateLEDs(ledState);
    isLoggedIn = true;
    bufferTimeBetweenRequests = currentMillis;
  }
  else if(payload == "userExistsPermissionNOTHighEnough")
  {
    //if user exists and permission is not high enough, buffer user id -> LEDs blink magenta
    ledState = permissionNotHighEnough_Magenta;
    updateLEDs(ledState);
    isLoggedIn = true;
    bufferTimeBetweenRequests = currentMillis;
  }
  else if(payload == "userDoesNotExist")
  {
    //if user does not exists -> LEDs blink short time red, than back to constant red
    ledState = red;
    blink = true;
    blinkStartMillis = currentMillis;
    userID = 0;
  }
  else{
    //Error occured
    ledState = systemError_Blue;
    blink = true;
    blinkStartMillis = currentMillis;
    userID = 0;
  }
}

void testID()
{
  if (test_id == userID)
  {
    ledState = green;
    updateLEDs(green);
    isLoggedIn = true;
    #ifdef debugging
    Serial.println("ID is correct");
    #endif
  }
  else
  {
    ledState = red;
    blink = true;
    blinkStartMillis = millis();
    #ifdef debugging
    Serial.println("ID is incorrect, try again");
    #endif
  }
  inputID_PinPad = ""; // clear input id
}

void logout()
{
  #ifdef TestWithoutServerCommunication
    ledState = red;
    updateLEDs(red);
  #else
    sendDataToServer();
  #endif
  
  reset();
}

void sendDataToServer()
{
  //TODO vielleicht zwischen logoutFromMachine und autoLogoutFromMachine unterscheiden?
  //Man könnte dann im Monitoring mit aufnehmen, wie oft ein Nutzer automatisch abgemeldet werden muss. Optionales Feature und vielleicht etwas zu viel "Überwachung"
  String serverPath = serverName + "logout" + "?userid=" + userID + "&machineName=" + machineName;

  String payload = httpGETRequest(serverPath);

  #ifdef debugging
  Serial.print("Payload: ");
  Serial.println(payload);
  #endif

  if (payload != "logout")
  {
    ledState = systemError_Blue;
    blink = true;
    blinkStartMillis = millis();
  }else{
    ledState = red;
    updateLEDs(red);
  }
}

void reset()
{
  bufferTimeBetweenRequests = 0;
  userID = 0;
  isLoggedIn = false;
}

void checkAutoLogoutTime()
{
  if (isLoggedIn && (millis() > bufferTimeBetweenRequests + TIME_CHECK_IF_SESSION_ACTIVE))
  {
    #ifdef debugging
    Serial.print("Sende Anfrage an Server, ob die Session noch aktiv ist.");
    #endif

    checkActiveSession();
  }
}

void checkActiveSession()
{
  // Send request to server and check whether the machine has still an active session
  String serverPath = serverName + "checkAutoLogout" + "?machineName=" + machineName;

  String payload = httpGETRequest(serverPath);

  #ifdef debugging
  Serial.print("Payload from active session request: ");
  Serial.println(payload);
  #endif

  evaluateActiveSessionPayload(payload);
}

void evaluateActiveSessionPayload(String payload)
{

  if (payload == "still active" || payload == "nothing messured yet")
  {
    // reset buffer to now
    bufferTimeBetweenRequests = millis();

  }else if (payload == "autoLogout")
  {
    // auto logout
    logout();
  }else
  {
    #ifdef debugging
    Serial.print("Error in function evaluateActiveSessionPayload. Wrong payload!?");
    Serial.println(payload);
    #endif
  }
}

String httpGETRequest(String serverName)
{

  WiFiClient client;
  HTTPClient http;
  String payload = "{}";

  if (WiFi.status() == WL_CONNECTED)
  {
    // Domain name with URL path or IP address with path
    http.begin(client, serverName.c_str());

    // Send HTTP POST request, httpResponseCode gives additional infos about the connection state
    int httpResponseCode = http.GET();

    if (httpResponseCode > 0)
    {

      #ifdef debugging
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      #endif

      payload = http.getString();
    }
    else
    {
      #ifdef debugging
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
      #endif
    }

    // Free resources
    http.end();
  }
  else
  {
    #ifdef debugging
    Serial.println("WiFi Disconnected");
    #endif
  }

  return payload;
}

void checkLEDblink()
{
  if (blink)
  {
    unsigned long currentMillis = millis();

    if (currentMillis - blinkStartMillis >= BLINK_DURATION)
    {
      blink = false;
      ledState = red;
      updateLEDs(ledState);

    }else if (currentMillis - blinkPreviousMillis >= BLINK_INTERVALL)
    {
      blinkPreviousMillis = currentMillis;
      if(ledsOn)
      {
        // Switch leds of
        updateLEDs(off);
      }else
      {
        updateLEDs(ledState);
      }
      // Toggle ledsOn
      ledsOn = !ledsOn;
    }
  }
}

void updateLEDs(ledStates ledState)
{
  switch (ledState)
  {
    case off:
      fill_solid(leds, NUM_LEDS, CRGB::Black);
      break;
    case red:
      fill_solid(leds, NUM_LEDS, CRGB::Red);
      break;
    case green:
      fill_solid(leds, NUM_LEDS, CRGB::Green);
      break;
    case permissionNotHighEnough_Magenta:
      // Magenta, Fuchsia, DeepPink, Crimson are also good warn colors
      fill_solid(leds, NUM_LEDS, CRGB::Magenta);
      break;
    case systemError_Blue:
        fill_solid(leds, NUM_LEDS, CRGB::Blue);
      break;
    default:
      fill_solid(leds, NUM_LEDS, CRGB::Red);
      Serial.println("Default");
      break;
  }
  FastLED.show();
}

void checkRFIDInput(){

  //Reset call time for checkRFIDInput() function to 100
  if(timeBetweenRFIDReadRequests >= 4000) {
    timeBetweenRFIDReadRequests = 100;
  }

  bufferTimeBetweenRFIDReadRequests = millis();

  bool success = rfidReader.detectTag();

  if(success){

    #ifdef debugging
      Serial.println("RFID Tag detected!");
    #endif

    if(isLoggedIn){
      logout();
    }else {
      
      int result;
      // starting from the given block, reads the data from the tag (for the amount of bytes given), loading to the variable "userID"
      // attention: if you didn't write the credentials before, you will get "garbage" here
      result = rfidReader.readRaw(BLOCK, (byte*)&inputID_RFID, sizeOfInputInByte);
  
      if (result >= 0) {
  
        #ifdef debugging
          Serial.print("RFID Input: ");
          Serial.println(inputID_RFID);
        #endif

        userID = inputID_RFID;
        
        #ifdef TestWithoutServerCommunication
          testID();
        #else
          checkLogin();
        #endif
        
      } else { 
        #ifdef debugging
          Serial.print("Error reading the tag, got ");
          Serial.println(result);
        #endif
      }
    }
    // call this after doing all desired operations in the tag
    rfidReader.unselectMifareTag();

    //Set call time for checkRFIDInput() function to 4 seconds to avoid a second input from the same RFID chip
    timeBetweenRFIDReadRequests = 4000;
  }
}
