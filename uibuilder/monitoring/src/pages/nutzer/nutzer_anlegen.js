
/** Minimalist code for uibuilder and Node-RED */
'use strict'

var optionalNewUserIDInRow;
var valideNewUserInput = true;

// run this function when the document is loaded
window.onload = function() {

    document.getElementById('passwordLabel').innerHTML = "Passwort (optional)";

    //Info: blus is an event like "lostFocus"
    document.getElementById('userID').addEventListener('blur', function(event){

        if(userIDCheck(this.value)){
            checkUserIDUnique(this.value, 'checkCustomID');
        }else {
            this.style.borderColor =  "red";
            valideNewUserInput = false;
        }
    })

    document.getElementById('inputAdmin').addEventListener('input', function(event){

        var password = document.getElementById('inputPassword');
        var label = document.getElementById('passwordLabel');

        if(this.checked){
            label.innerHTML = "Passwort (Pflichtfeld)";
        }else{
            label.innerHTML = "Passwort (optional)";
        }

        if(this.checked && inputEmptyCheck(password.value)){
            snackbarMessage("Für Admins muss ein Passwort gesetzt werden!");
            password.style.borderColor =  "red";
            valideNewUserInput = false;
        } else {
            password.style.borderColor = "";
            valideNewUserInput = true;
        }
    });

    document.getElementById('inputPassword').addEventListener('blur', function(event){

        if(!inputEmptyCheck(this.value)){
            this.style.borderColor = "";
            valideNewUserInput = true;
        }else if(document.getElementById('inputAdmin').checked && inputEmptyCheck(this.value)){
            this.style.borderColor = "red";
            valideNewUserInput = false;
        }
    })

    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start()

    uibuilder.send({
        'topic' : 'SELECT lastUserIDInRow FROM config',
        'type': 'getLastUserID'
    });

    uibuilder.onChange('msg', function(msg){
        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg);

        if(msg.type == "getLastUserID"){

            optionalNewUserIDInRow = msg.payload[0].lastUserIDInRow + 1;
            checkUserIDUnique(optionalNewUserIDInRow, 'checkAutoincrementID');

        } else if(msg.type == "checkAutoincrementID"){

            //recursive: check if optionalNewUserIDInRow is already taken
            if(msg.payload.length != 0){
                optionalNewUserIDInRow += 1;
                checkUserIDUnique(optionalNewUserIDInRow, 'checkAutoincrementID');
            }else{
                document.getElementById('userID').value = optionalNewUserIDInRow;
            }
        } else if(msg.type == "checkCustomID"){

            if(msg.payload.length != 0){
                snackbarMessage("Gewählte UserID ist bereits vergeben!");
                document.getElementById('userID').style.borderColor =  "red";
                valideNewUserInput = false;
            } else {
                document.getElementById('userID').style.borderColor =  "";
                valideNewUserInput = true;
            }
        }
    });
}

//Removed. Could cause problems for user
/*
document.body.addEventListener('keypress', function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        
        document.getElementById("addUserButton").click();
    }
});
*/

function checkUserIDUnique(ID, type){

    uibuilder.send({
        'topic': 'SELECT * FROM user WHERE userid =' + ID,
        'type': type
    });
}

function addNewUser(){

    if(valideNewUserInput){

        var userid = document.getElementById('userID').value;
        var admin = (document.getElementById('inputAdmin').checked ? 1 : 0); //i had to do this specific cast, otherwise i got problems when extracting the string value "true" from json
        var password = convertPasswordToHash(document.getElementById('inputPassword').value);
        var permission = document.getElementById('berechtigungsstufe').value;
        var company = document.getElementById('inputFirma').value;


        uibuilder.send({
            'topic': 'INSERT INTO user(userid, password, admin, permission, company) VALUES ("'+userid+'", "'+password+'", "'+admin+'", "'+permission+'", "'+company+'")'
        })

        if(userid == optionalNewUserIDInRow){
            uibuilder.send({
                'topic': 'UPDATE config set lastUserIDInRow='+ optionalNewUserIDInRow
            }) 
        }

        var info = document.getElementById('infoModal');
        var message = "<b>Zusammenfassung</b><br><br>UserID: "+userid+"<br>"+(admin ? "Ist Admin" : "Kein Admin")+"<br>"
        +(inputEmptyCheck(password) ? "Kein Paswort gesetzt" : "Eigenes Passwort veregeben")+"<br>Berechtigungsstufe: "+permission+"<br>"+(inputEmptyCheck(company) ? "" : "Firmenzugehörigkeit: "+company)+"<br>";

        info.innerHTML = renderInformationModal("Nutzer angelegt", message, "`nutzer.html`"); //be carfull with marks "``"
        $('#infoModal').modal('show');

    }else{

        snackbarMessage("Eingaben nicht gültig! Übrprüfe die UserID oder das Passwort für Admins.");
    }
}

function togglePasswordInputType(checked){

    var password = document.getElementById('inputPassword');
    if(checked){
        password.type = "text";
    } else {
        password.type = "password";
    }
}
