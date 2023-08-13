
/** Minimalist code for uibuilder and Node-RED */
'use strict'

window.login = function (string){
    cls= "string";
    return '<span class="' + cls + '">' + string + '</span>';
}

var userID;
var password;
var errorMessage;

window.login = function login() {

    userID = document.getElementById('userID').value;
    password = convertPasswordToHash(document.getElementById('password').value);

    if (userID.length >= 3){

        uibuilder.send({
            'topic': "SELECT true FROM user WHERE userid ="+userID,
            'type': "checkUser"
        })
    } else {

        showLoginErrorMessage("Die Benutzer ID muss mindestens 3 Ziffern lang sein.");
    }
}

// run this function when the document is loaded
window.onload = function() {

    errorMessage = document.getElementById('error');

    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start();

    // Listen for incoming messages from Node-RED
    uibuilder.onChange('msg', function(msg){
        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg.payload)
   
        if (msg.type == "checkUser"){

            if(msg.payload == ""){

                showLoginErrorMessage("Benutzer ID nicht bekannt.");

            }else if (msg.payload[0]["true"] == 1){

                uibuilder.send({
                    'topic': "SELECT password, admin FROM user WHERE userID =" +userID,
                    'type' : "checkPass"
                })
            }

        }else if (msg.type == "checkPass"){

            if ( msg.payload[0]["password"] == String(password)){

                //set local variables wich will be saved till the browser session is over.
                localStorage.setItem("admin", msg.payload[0]["admin"]);
                localStorage.setItem("userID", userID);

                navigator(msg.payload[0]["admin"]);

            } else {

                showLoginErrorMessage("Falsches Passwort");
            }
        }
    })
}

//Trigger login button when enter key is pressed
document.body.addEventListener('keypress', function(event) {

    if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        
        document.getElementById("loginButton").click();
    }
});

function showLoginErrorMessage(message) {

    errorMessage.style.display = "block";
    errorMessage.innerHTML = message;
}

function navigator(admin) {
    if (admin){
         window.location.href="../uebersicht/uebersicht.html";
     }else{
         window.location.href="../uebersicht/uebersichtNormalerNutzer.html";
     }
 }