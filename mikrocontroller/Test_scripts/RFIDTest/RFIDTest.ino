
#include "EasyMFRC522.h"

//--- RFID config ---
/**
 * ----------------------------------------------------------------------------
 * Easy MFRC522 library (RFID)
 * (Further information: https://github.com/pablo-sampaio/easy_mfrc522)
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
int userID;

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
  delay(500);
}


void loop() {
  Serial.println("========================="); Serial.println();
  Serial.println("CHOOSE an operation: ");
  Serial.println("  'g' to grant access (write credentials)");
  Serial.println("  'r' to read the credentials");

  while (Serial.available() == 0) // waits for incoming data
    ;

  char option = Serial.read();

  Serial.println();
  Serial.println("APPROACH a Mifare tag. Waiting...");

  bool success;
  do {
    // returns true if a Mifare tag is detected
    success = rfidReader.detectTag();
    delay(50); //0.05s
  } while (!success);

  Serial.println("--> TAG DETECTED!\n");
  int result;

  if (option == 'g') {
    Serial.println("GRANTING access:");
    
    // starting from tag's block #1, writes the contents of variable "credentials", whose size is given (and independs of its content)
    result = rfidReader.writeRaw(BLOCK, (byte*)&userID, sizeOfInputInByte);

    if (result >= 0) {
      Serial.print  ("--> Credentials written to the tag, ending in block ");
      Serial.println(result);
    } else {
      Serial.print  ("--> Error writing to the tag: ");
      Serial.println(result);
    }
  
  } else if (option == 'r') {
    Serial.println("LOADING CREDENTIALS from the tag:");

    int bufferInteger;
    // starting from the given block, reads the data from the tag (for the amount of bytes given), loading to the variable "credentials"
    // attention: if you didn't write the credentials before, you will get "garbage" here
    result = rfidReader.readRaw(BLOCK, (byte*)&bufferInteger, sizeOfInputInByte);

    if (result >= 0) {
      Serial.print("UserID: ");
      Serial.println(bufferInteger);
    } else { 
      Serial.print("--> Error reading the tag, got");
      Serial.println(result);
    }

  } else if (option == 'd') {
    // extra: if you want to use the original Balboa's class, just call this
    MFRC522* device = rfidReader.getMFRC522();
    device->PICC_DumpMifareClassicSectorToSerial(&(device->uid), rfidReader.getKey(), 0); // dump the whole sector #0
    Serial.println();

  }

  while (Serial.available() > 0) {  // clear "garbage" input from serial
    Serial.read();
  }

  // call this after doing all desired operations in the tag
  rfidReader.unselectMifareTag();
  
  Serial.println();
  Serial.println("Finished operation!");
  Serial.println();
  delay(3000);
}
