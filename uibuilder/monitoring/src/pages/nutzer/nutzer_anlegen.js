
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
    if(admin && !inputEmptyCheck(password)){
        return true;
    }else if (admin && inputEmptyCheck(password)){
        return false;
    }else if (!admin && inputEmptyCheck(password)){
        return true;
    }else if (!admin && !inputEmptyCheck(password)){
        return true;
    }
}
function snackbarMessage(str){
    var x = document.getElementById("snackbar");
    x.innerHTML= str;
    x.className = "show";
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}

function addNewUser(){
    var firstName = document.getElementById('inputVorname').value;
    var lastName = document.getElementById('inputNachname').value;
    var password = document.getElementById('inputPasswort').value;
    var company = document.getElementById('inputFirma').value;
    var admin = document.getElementById('inputAdmin').checked;
    var permission = document.getElementById('berechtigungsstufe').value;

    if (inputEmptyCheck(lastName)) {
        snackbarMessage("Der Nachname ist nicht ausgef??llt!");
    }else if(!inputLetterCheck(firstName) || !inputLetterCheck(lastName)){
        snackbarMessage("D??rfen keine Sonderzeichnen oder Nummern bei den Namen eingegeben werden!"); 
    }else if(!adminPassCheck(admin, password)){
        snackbarMessage("Bei Admin muss ein Passwort gesetzt werden!"); 

    }else{
        uibuilder.send({
            'topic': 'INSERT INTO user(password, lastName, firstName, admin, permission, company) VALUES("'+password+'", "'+lastName+'", "'+firstName+'", '+admin+', '+permission+', "'+company+'")'
        })
        snackbarMessage("Neuer Nutzer ist erforderlich hinzugef??gt."); 
        setTimeout(function() { window.location.href="nutzer.html"; }, 1000);
    }
}

// run this function when the document is loaded
window.onload = function() {

    document.getElementById('passwordLabel').innerHTML = "Passwort (optional)";

    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start()
}

document.body.addEventListener('keypress', function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        
        document.getElementById("addUserButton").click();
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