
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

function checkIfMachineExists(){
    uibuilder.send({
        'topic': "SELECT true FROM machine WHERE machineName ="+ "'" +document.getElementById('inputMaschinenname').value +"'",
        'type': "machineExists"
    });
}

function addNewMachine(){

    var machineName = document.getElementById('inputMaschinenname').value;
    var phaseNumber = document.getElementById('inputStromphasen').value;
    var permission = document.getElementById('berechtigungsstufe').value;
    var fixedCostsPerUsage = document.getElementById('inputFixKosten').value;
    var area = document.getElementById('inputBereich').value;


    if(inputEmptyCheck(machineName)){

        snackbarMessage("Es muss ein Maschinenname angegeben werden!");

    }else if(inputEmptyCheck(phaseNumber)){

        snackbarMessage("Es muss eine Anzahl an Phasen angegeben werden!");

    }else{ 
        uibuilder.send({
            'topic': 'INSERT INTO machine VALUES("'+machineName+'", "'+phaseNumber+'", "'+permission+'", "'+fixedCostsPerUsage+'", "'+area+'")'
        });
        snackbarMessage("Neue Maschine angelegt!");
        setTimeout(function() { window.location.href="maschinen.html"; }, 1000);
    }
}

// run this function when the document is loaded
window.onload = function() {
    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start();

    uibuilder.onChange('msg', function(msg){
        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg);

        if(msg.type == "machineExists"){

            if(msg.payload.length != 0){
                snackbarMessage("Es ist bereits eine Maschine mit diesem Namen vorhanden!");
            }else{
                addNewMachine();
            }
        }
    });
}

document.body.addEventListener('keypress', function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        
        document.getElementById("addMachineButton").click();
    }
});