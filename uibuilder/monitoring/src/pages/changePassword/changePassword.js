
/** Minimalist code for uibuilder and Node-RED */
'use strict'

var userID;
var passwordIdentical = false;

// run this function when the document is loaded
window.onload = function() {

    userID = localStorage.getItem("userID");

    document.getElementById("retypePassword").addEventListener('blur', function(){
        checkPasswordsIdenticaly();
    });
    document.getElementById("newPassword").addEventListener('blur', function(){
        checkPasswordsIdenticaly();
    });

    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start();

    // Listen for incoming messages from Node-RED
    uibuilder.onChange('msg', function(msg){

        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg.payload)
   
        if(msg.type == "resetPassword"){
            document.getElementById("passwordResetText").innerHTML = "Passwort erfolgreich geändert!";
        }
    })
}

function checkPasswordsIdenticaly(){
    var retypePassword = document.getElementById("retypePassword");
    var newPassword = document.getElementById("newPassword");

    if(newPassword.value == retypePassword.value){
        passwordIdentical = true;
        retypePassword.style = "border-color: ;";
        newPassword.style = "border-color: ;";
    }else{
        passwordIdentical = false;
        retypePassword.style = "border-color: red; border-style: solid";
        newPassword.style = "border-color: red; border-style: solid";
    }
}

function changePassword(){

    if(passwordIdentical){

        var newPasswordHash = convertPasswordToHash(document.getElementById('retypePassword').value);

        uibuilder.send({
            'topic': 'UPDATE user SET password="'+newPasswordHash+'" WHERE userid=' + userID,
            'type' : 'resetPassword'
        })
    
        document.getElementById("passwordResetMessage").style.display = "block";
        document.getElementById("passwordResetText").innerHTML = "Ändern der Passworts angefragt. " +
        "Sollte sich diese Information nicht aktualisieren, ist ein Fehler bei der Übermittlung aufgetreten!";
    }
}
