/*
   Author: Jan Torge Schneider

   The script handles the machine modules.
   It registers logins and informs the server about these.
*/

//--- Includes (External Libraries) ---
#include <WiFi.h>
#include <HTTPClient.h>
#include <FastLED.h>
#include <Keypad.h>
#include <EasyMFRC522.h>

//--- Config ---
// If you want to see outputs and logs, the mikrocontroller must be connected to a pc.
// There you can watch the live logs and outputs on a seriell monitor (for example in the Arduino IDE).
// Remove the two Slashes before #define to uncomment the line. The debugging is activated!
// If you dont haven an PC connected permanently to the mikrocontroller or dont need logs, just comment the following line code (with to Slahes //).
#define debugging

//-- Network config ---
#define wifinetwork "Bill Clinternet"
#define wifipassword "MartinRouterKing"

const char *ssid = wifinetwork;
const char *password = wifipassword;
//Server Hostname: monitoringServer
//IP b+p: 192.168.2.197
String serverName = "http://192.168.10.82:1880/";


//--- User and Machine config ---
#define machineName "Tischkreissäge"
int userId = 0;
int defaultId = 100;
bool isLoggedIn = false;

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

byte pin_rows[ROW_NUMBER] = {25, 26, 0, 2}; // connect to the row pinouts of the keypad
byte pin_column[COLUM_NUMBER] = {27, 14, 15}; // connect to the column pinouts of the keypad

Keypad keypad = Keypad(makeKeymap(keys), pin_rows, pin_column, ROW_NUMBER, COLUM_NUMBER);

//Remove the two Slashes before #define to uncomment the line. Then you can test without a server communication.
//Dont forget to recomment the line before active use!
//#define TestWithoutServerCommunication
int test_id = 100; // change your test id here
String inputID;

/**
 * ----------------------------------------------------------------------------
 * Easy MFRC522 library - Unlabeled Data - Example #1
 * (Further information: https://github.com/pablo-sampaio/easy_mfrc522)
 * 
 * -----------------------------------------
 * Simple example of reading/writing data chunks using the unlabeled operations. 
 * You must provide the exact number of bytes both to write and to read. 
 * (Useful if your data size is fixed). 
 * 
 * In this example, we store and retrieve the content of a "struct" variable.
 * 
 * -----------------------------------------
 * Pin layout used (where * indicates configurable pin):
 * -----------------------------------------
 * MFRC522      Arduino       NodeMCU
 * Reader       Uno           Esp8266
 * Pin          Pin           Pin    
 * -----------------------------------------
 * SDA(SS)      4*            D4*
 * SCK          13            D5   
 * MOSI         11            D7
 * MISO         12            D6
 * RST          3*            D3*
 * NC(IRQ)      not used      not used
 * 3.3V         3.3V          3V
 * GND          GND           GND
 * --------------------------------------------------------------------------
 * Obs.: This code may not work if you use different types of boards to alternately
 * read/write, because of the memory size and alignment of the struct.
 */
#define SDA  5
#define RST  17
int sizeOfInputInByte = 4;

EasyMFRC522 rfidReader(SDA, RST); //the MFRC522 reader, with the SDA and RST pins given
                                //the default (factory) keys A and B are used (or used setKeys to change)

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

  inputID.reserve(2); // maximum input characters is 3, change if needed

  ledState = red;
  updateLEDs(red);

  #ifdef debugging
  Serial.println("APPROACH a RFID tag. Waiting...");
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
      inputID = ""; // clear input id
    }
    else if (key == 'g' && !isLoggedIn)
    {
      userId = inputID.toInt();
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
        inputID += key; // append new character to input password string
      }
    }
  }
}

void checkLogin()
{

  // Send request to server and check if user exists and permission is high enough
  String serverPath = serverName + "checkIfUserExists" + "?userid=" + userId + "&machineName=" + machineName;

  String payload = httpGETRequest(serverPath);
  #ifdef debugging
  Serial.print("Payload from check login request: ");
  Serial.println(payload);
  #endif
  
  evaluateCheckLoginPayload(payload);

  inputID = ""; // clear input password
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
    userId = 0;
  }
  else{
    //Error occured
    ledState = systemError_Blue;
    blink = true;
    blinkStartMillis = currentMillis;
    userId = 0;
  }
}

void testID()
{
  if (test_id == userId)
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
  inputID = ""; // clear input id
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
  String serverPath = serverName + "logout" + "?userid=" + userId + "&machineName=" + machineName;

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
  userId = 0;
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

      // starting from the given block, reads the data from the tag (for the amount of bytes given), loading to the variable "inputID"
      // attention: if you didn't write the inputID before, you will get "garbage" here
      result = rfidReader.readRaw(BLOCK, (byte*)&userId, sizeOfInputInByte);
  
      if (result >= 0) {
  
        #ifdef debugging
          Serial.print("RFID Input: ");
          Serial.println(userId);
        #endif
        
        #ifdef TestWithoutServerCommunication
          testID();
        #else
          checkLogin();
        #endif
        
      } else { 
        #ifdef debugging
          Serial.print("Error reading the tag, got ");
          Serial.println(userId);
        #endif
      }
    }
    // call this after doing all desired operations in the tag
    rfidReader.unselectMifareTag();

    //Set call time for checkRFIDInput() function to 4 seconds to avoid a second input from the same RFID chip
    timeBetweenRFIDReadRequests = 4000;
  }
}
