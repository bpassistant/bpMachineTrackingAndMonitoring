
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

var machineName;

function inputEmptyCheck(inputtxt) {
    console.log(inputtxt.length);
    if (inputtxt == null || inputtxt == "") {
        return true;}
    else{
        return false;
    }
}

function inputLetterCheck(inputtxt) {
    if((/^[0-9]+$/.test(inputtxt))){
        return true;
    }
    else{
        return false;
    }
}

function snackbarMessage(str){
    var x = document.getElementById("snackbar");
    x.innerHTML= str;
    x.className = "show";
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}

function editMachine(){

    var phaseNumber = document.getElementById('inputStromphasen').value;
    var permission = document.getElementById('berechtigungsstufe').value;
    var fixedCostsPerUsage = document.getElementById('inputFixKosten').value;
    var area = document.getElementById('inputBereich').value;

    if(inputEmptyCheck(phaseNumber)){

        snackbarMessage("Es muss eine Anzahl an Phasen angegeben werden!");
    }else{ 
        uibuilder.send({
            'topic': 'UPDATE machine SET phaseNumber='+phaseNumber+', permission='+permission+', fixedCostsPerUsage='+fixedCostsPerUsage+', area= "'+area+'" WHERE machineName = "'+machineName+'"'
        });

        snackbarMessage("Die Daten wurden erfolgreich aktualisiert");
        setTimeout(function() {window.location.href="maschinen.html"; }, 1000);
    }
}

// run this function when the document is loaded
window.onload = function() {
    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start()

    document.getElementById('inputMaschinenname').ariaReadOnly = true;

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    machineName = urlParams.get('machine')

    if(userID != undefined && typeof machineName === 'string'){

        uibuilder.send({
            'topic': "SELECT * FROM machine WHERE machineName=" + "'" + machine + "'"
        });
    }else{
        snackbarMessage("Es wurde kein oder ein falscher Maschinenname als Parameter übergeben!");
    }
    
    // Listen for incoming messages from Node-RED
    uibuilder.onChange('msg', function(msg){
        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg)
        
        document.getElementById('inputStromphasen').value = msg.payload[0].phaseNumber;
        document.getElementById('berechtigungsstufe').value = msg.payload[0].permission;
        document.getElementById('inputFixKosten').value = msg.payload[0].fixedCostsPerUsage;
        document.getElementById('inputBereich').value = msg.payload[0].area;
    })
}

document.body.addEventListener('keypress', function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        
        document.getElementById("editMachineButton").click();
    }
});