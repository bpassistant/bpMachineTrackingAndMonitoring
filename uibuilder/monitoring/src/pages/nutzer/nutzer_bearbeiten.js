
/** Minimalist code for uibuilder and Node-RED */
'use strict'

var userID;
var valideEditUserInput = true;

// run this function when the document is loaded
window.onload = function() {

    checkPersmissionToResetPassword();

    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start()

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    userID = urlParams.get('userid');

    if(userID != undefined){
        uibuilder.send({
            'topic': 'SELECT userid, admin, permission, company FROM user WHERE userid=' + userID,
            'type' : 'getUserValues'
        })
    }else{
        snackbarMessage("Es wurde keine oder eine falsche UserID als Parameter übergeben!");
        valideEditUserInput = false;
    }

    document.getElementById("inputAdmin").addEventListener("input", function(event){

        if(this.checked){
            uibuilder.send({
                'topic': 'SELECT 1 FROM user WHERE userID ='+userID+' AND password!=""',
                'type' : 'checkIfUserHasPasswordToBeAdmin'
            })
        }else{
            document.getElementById("passwordContainer").style.display = "none";
            document.getElementById('inputPassword').value = "";
            valideEditUserInput = true;
        }
    })

    document.getElementById('inputPassword').addEventListener('blur', function(event){

        if(!inputEmptyCheck(this.value)){
            this.style.borderColor = "";
            valideEditUserInput = true;
        }else if(document.getElementById('inputAdmin').checked && inputEmptyCheck(this.value)){
            this.style.borderColor = "red";
            valideEditUserInput = false;
        }
    })

    // Listen for incoming messages from Node-RED
    uibuilder.onChange('msg', function(msg){
        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg)

        if(msg.type == "getUserValues") {
            fillForm(msg);

        } else if(msg.type == "checkIfUserHasPasswordToBeAdmin"){
            if(msg.payload.length == 0){
                document.getElementById("passwordContainer").style.display = "block";
                valideEditUserInput = false;
                snackbarMessage("Noch kein Passwort hinterlegt. Wird für Admins benötigt!");
            }
        } else if(msg.type == "resetPassword"){
            document.getElementById("passwordResetText").innerHTML = "Passwort erfolgreich zurück gesetzt! Das neue Passwort lautet: newPassword";
        }
    })
}

function fillForm(msg) {

    document.getElementById('userID').value = msg.payload[0].userid;
    document.getElementById('inputAdmin').checked = msg.payload[0].admin;
    document.getElementById('inputFirma').value = msg.payload[0].company;
    document.getElementById('berechtigungsstufe').value = msg.payload[0].permission;
}

function editUser(){

    var password = document.getElementById('inputPassword').value;
    var company = document.getElementById('inputFirma').value;
    var admin = document.getElementById('inputAdmin').checked;    
    var permission = document.getElementById('berechtigungsstufe').value;

    if(valideEditUserInput){

        var dbQuerry;
        if(!inputEmptyCheck(password)){
            dbQuerry = 'UPDATE user SET password="'+password+'",admin= '+admin+',permission= '+permission+',company= "'+company+'" WHERE userid = '+userID+'';
        } else {
            dbQuerry = 'UPDATE user SET admin= '+admin+',permission= '+permission+',company= "'+company+'" WHERE userid = '+userID+'';
        }

        uibuilder.send({
            'topic': dbQuerry
        });
        
        var info = document.getElementById('infoModal');

        info.innerHTML = renderInformationModal("Nutzer bearbeitet", "Die Werte wurden übernommen.", "`nutzer.html`"); //be carfull with marks "``"
        $('#infoModal').modal('show');

    }else{
        snackbarMessage("Bearbeiten nicht möglich! Prüfe ob das Passwortfeld sichtbar aber nicht ausgefüllt ist."); 
    }
}

document.body.addEventListener('keypress', function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        
        document.getElementById("editUserButton").click();
    }
});

function checkPersmissionToResetPassword(){
    
    var activeUserID = localStorage.getItem("userID");

    //TODO Achtung! Hardcoded userIDs, diese können Passwörter zurücksetzten!
    if((activeUserID != 100) && (activeUserID != 42) ) {
        document.getElementById("resetPasswordCard").style.display = "none";
    }
}

function resetPassword(){

    var newPasswordHash = convertPasswordToHash("newPassword");

    uibuilder.send({
        'topic': 'UPDATE user SET password="'+newPasswordHash+'" WHERE userid=' + userID,
        'type' : 'resetPassword'
    })

    document.getElementById("passwordResetMessage").style.display = "block";
    document.getElementById("passwordResetText").innerHTML = "Zurücksetzen der Passworts angefragt. " +
    "Sollte sich diese Information nicht ändern, ist ein Fehler bei der Übermittlung aufgetreten.";
}