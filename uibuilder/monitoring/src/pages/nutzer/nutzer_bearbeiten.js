
/** Minimalist code for uibuilder and Node-RED */
'use strict'

// return formatted HTML version of JSON object
window.syntaxHighlight = function (json) {
    json = JSON.stringify(json, undefined, 4)
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    json = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number'
        if ((/^"/).test(match)) {
            if ((/:$/).test(match)) {
                cls = 'key'
            } else {
                cls = 'string'
            }
        } else if ((/true|false/).test(match)) {
            cls = 'boolean'
        } else if ((/null/).test(match)) {
            cls = 'null'
        }
        return '<span class="' + cls + '">' + match + '</span>'
    })
    return json
} // --- End of syntaxHighlight --- //

var userID;

function inputEmptyCheck(inputtxt) {
    if (inputtxt == null || inputtxt == "" || inputtxt.length <= 2) {
        return true;}
    else{
        return false;
    }
}

function inputLetterCheck(inputtxt) {
    if((!/[^a-zA-Z]/.test(inputtxt))){
        return true;
    }
    else{
        return false;
    }
}

function adminPassCheck(admin, password){
    if (admin && inputEmptyCheck(password)){
        return false;
    }else{
        return true;
    }
}

function editUser(){

    var firstName = document.getElementById('inputVorname').value;
    var lastName = document.getElementById('inputNachname').value;
    var password = document.getElementById('inputPasswort').value;
    var company = document.getElementById('inputFirma').value;
    var admin = document.getElementById('inputAdmin').checked;    
    var permission = document.getElementById('berechtigungsstufe').value;

    if (inputEmptyCheck(lastName)) {

        snackbarMessage("Der Nachname/Beschreibung ist nicht angegeben!");

    }else if(!inputLetterCheck(firstName) || !inputLetterCheck(lastName)){

        snackbarMessage("Bei den Namen dürfen keine Sonderzeichnen oder Nummern angegeben werden!"); 

    }else if(!adminPassCheck(admin, password)){

        snackbarMessage("Für einen Admin muss ein Passwort gesetzt werden!"); 

    }else{
        uibuilder.send({
            'topic': 'UPDATE user SET password="'+password+'",lastName= "'+lastName+'",firstname ="'+firstName+'",admin= '+admin+',permission= '+permission+',company= "'+company+'" WHERE userid = '+userID+''
        });
        snackbarMessage("Die Daten wurden erfolgreich aktualisiert"); 
        setTimeout(function() { window.location.href="nutzer.html"; }, 1000);
    }
}

// run this function when the document is loaded
window.onload = function() {
    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start()

    document.getElementById('passwordLabel').innerHTML = "Passwort (optional)";

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    userID = urlParams.get('userid');

    if(userID != undefined && userID.length == 3){
        uibuilder.send({
            'topic': "SELECT * FROM user WHERE userid=" + userID
        })
    }else{
        snackbarMessage("Es wurde keine oder eine falsche UserID als Parameter übergeben!");
    }

    // Listen for incoming messages from Node-RED
    uibuilder.onChange('msg', function(msg){
        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg)

        fillForm(msg);
    })
}

function fillForm(msg) {
    document.getElementById('inputVorname').value = msg.payload[0].firstName
    document.getElementById('inputNachname').value = msg.payload[0].lastName
    document.getElementById('inputPasswort').value = msg.payload[0].password
    document.getElementById('inputFirma').value = msg.payload[0].company
    document.getElementById('inputAdmin').checked = msg.payload[0].admin
    document.getElementById('berechtigungsstufe').value = msg.payload[0].permission

    document.getElementById('inputPasswort').type = "text"
}

document.body.addEventListener('keypress', function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        
        document.getElementById("editUserButton").click();
    }
});

function isAdmin(checkbox){

    var admin = document.getElementById('passwordLabel');
    if(checkbox.checked) {
        admin.innerHTML = "Passwort (Pflichtfeld)";
    } else {
        admin.innerHTML = "Passwort (Optional)";
    }
}

function snackbarMessage(str){
    var x = document.getElementById("snackbar");
    x.innerHTML= str;
    x.className = "show";
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}
