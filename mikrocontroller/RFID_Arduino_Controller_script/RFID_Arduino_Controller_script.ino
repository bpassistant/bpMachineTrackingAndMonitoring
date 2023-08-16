
#include "EasyMFRC522.h"

//--- RFID config for Arduino Uno ---
/**
 * ----------------------------------------------------------------------------
 * Easy MFRC522 library (RFID)
 * (Further information: https://github.com/pablo-sampaio/easy_mfrc522)
 * 
 * -----------------------------------------
 * Pin layout used
 * -----------------------------------------
 * MFRC522      Arduino Uno
 * Reader       ATmega328P U
 * Pin          Pin   
 * -----------------------------------------
 * SDA(SS)      10*
 * SCK          13
 * MOSI         11
 * MISO         12
 * RST          9*
 * NC(IRQ)      not used
 * 3.3V         3.3V
 * GND          GND
 * --------------------------------------------------------------------------
 */
#define SDA  10
#define RST  9
//TODO: Kann man das reduzieren?
int sizeOfInputInByte = 4;
int userID = 100;

EasyMFRC522 rfidReader(SDA, RST); //the MFRC522 reader, with the SDA and RST pins given
                                //the default (factory) keys A and B are used (or used setKeys to change)

#define BLOCK  1    //the initial block for all operations


void setup() {
  Serial.begin(9600);
  Serial.setTimeout(20000); // to wait for up to 20s in "read" functions
  
  while (!Serial)
    ;

  // you must call this initialization function!
  rfidReader.init();
  Serial.println("Initialisiern");
  delay(3000);
}


void loop() {
  Serial.println("========================="); Serial.println();
  Serial.println("Wähle eine Operation aus: ");
  Serial.println("  's' um eine UserID auf einen RFID-Tag zu schreiben");
  Serial.println("  'l' um die UserID eines RDID-Tags zu lesen");
  Serial.println("Tippe den entsprechenden Buchstaben in das Schreibfeld und klicke anschließend auf 'Senden'.");
  Serial.println();

  while (Serial.available() == 0) // waits for incoming data
    ;
  
  char option = Serial.read();

  //TODO andere bzw. falsche Buchstaben abfangen

  if(option == 's'){

    Serial.println("--- RFID-Tag mit einer UserID beschreiben ---");
    Serial.println("Gib dafür im Schreibfeld die gewünschte UserID ein und klicke anschließend auf 'Senden'.");
    Serial.println();

    while (Serial.available() == 0) // waits for incoming data
      ;
  
    userID = Serial.parseInt();

    //UserIDs müssen dreistellig sein
    if(userID > 99){
      
      Serial.print("Folgende UserID wurde als Eingabe erkannt: ");
      Serial.println(userID);
      Serial.println("Um diese auf einen RFID-Tag zu schreiben, halte einen kompatiblen Tag oder eine Karte vor das Lese-/Schreibgerät.");
      Serial.println();
  
      bool success;
      do {
        // returns true if a RFID-Tag is detected
        success = rfidReader.detectTag();
        delay(50); //0.05s
      } while (!success);
  
      Serial.println("RFID-Tag erkannt. Dieser wird nun beschrieben.");
      Serial.println();
  
      int result;
      // starting from tag's block #1, writes the content of variable "userID", whose size is given (and independs of its content)
      result = rfidReader.writeRaw(BLOCK, (byte*)&userID, sizeOfInputInByte);
  
      if (result >= 0) {
  
        Serial.print  ("--> UserID erfolgreich auf den RFID-Tag geschrieben. Schreibvorgang beendet mit dem Block: ");
        Serial.println(result);
        Serial.println("Zur Überprüfung kann nach der gleich folgenden Rückkehr zur Optionsauswahl die UserID auf dem RFID-Tag ausgelesen werden.");
        Serial.println();
  
      } else {
  
        Serial.print  ("--> Fehler beim Beschreiben des RFID-Tag: ");
        Serial.println(result);
        Serial.println("Versuche es in einem weiteren Versuch oder verwende einen anderen RFID-Tag.");
        Serial.println();
  
      }
    } else {
      Serial.println("Die eingegebene UserID besteht nicht aus drei Ziffern oder ein anderer Fehler ist bei der Übertragung aufgetreten.");
      Serial.println();
    }

  }else if(option == 'l'){

    Serial.println("--- UserID von einem RFID-Tag auslesen ---");
    Serial.println("Um die UserID auf einem RFID-Tag auszulesen, halte den kompatiblen Tag oder eine Karte vor das Lese-/Schreibgerät.");
    Serial.println();

    bool success;
    do {
      // returns true if a RFID-Tag is detected
      success = rfidReader.detectTag();
      delay(50); //0.05s
    } while (!success);

    Serial.println("RFID-Tag erkannt. Dieser wird nun ausgelesen.");
    Serial.println();

    int result;

    int bufferInteger;
    // starting from the given block, reads the data from the tag (for the amount of bytes given), loading to the variable "userID"
    // attention: if you didn't write the credentials before, you will get "garbage" here
    result = rfidReader.readRaw(BLOCK, (byte*)&bufferInteger, sizeOfInputInByte);

    if (result >= 0) {
      Serial.print("--> Auf dem RFID-Tag wurde folgende UserID erkannt: ");
      Serial.println(bufferInteger);
      Serial.println();
    } else { 
      Serial.print("--> Fehler beim Auslesen des RFID-Tags aufgetreten! Folgender Wert wurde gelesen: ");
      Serial.println(result);
      Serial.println();
    }

  } else if(option != 's' && option != 'l'){

    Serial.print("Fehlerhafter Input. Eine Opteration mit dem Kürzel: ");
    Serial.print(option);
    Serial.print(" ist nicht bekannt.");
    Serial.println();

  }

  while (Serial.available() > 0) {  // clear "garbage" input from serial
    Serial.read();
  }
  
  // call this after doing all desired operations in the tag
  rfidReader.unselectMifareTag();
  
  Serial.println("Rückkehr zur Optionsauswahl!");
  Serial.println();
  Serial.println();
  Serial.println();
  delay(2000);
}
