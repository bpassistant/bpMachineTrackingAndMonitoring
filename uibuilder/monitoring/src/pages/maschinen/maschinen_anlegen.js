
/** Minimalist code for uibuilder and Node-RED */
'use strict'

var valideMachineName = false;
var validePhaseNumber = false;

// run this function when the document is loaded
window.onload = function() {
    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start();

    document.getElementById('inputMaschinenname').style.borderColor = "red";
    document.getElementById('inputStromphasen').style.borderColor = "red";

    document.getElementById("inputMaschinenname").addEventListener('blur', function(event){

        if(inputEmptyCheck(this.value)){

            snackbarMessage("Es muss ein Maschinenname angegeben werden!");
            valideMachineName = false;
            document.getElementById('inputMaschinenname').style.borderColor = "red";

        }else {
            checkIfMachineExists(this.value);
        }
    });

    document.getElementById("inputStromphasen").addEventListener('blur', function(event){
        
        if(inputEmptyCheck(this.value)){

            snackbarMessage("Es muss eine Anzahl an Phasen angegeben werden!");
            validePhaseNumber = false;
            document.getElementById('inputStromphasen').style.borderColor = "red";

        }else {
            validePhaseNumber = true;
            document.getElementById('inputStromphasen').style.borderColor = "";
        }
    });

    uibuilder.onChange('msg', function(msg){
        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg);

        if(msg.type == "machineExists"){

            if(msg.payload.length != 0){
                snackbarMessage("Es ist bereits eine Maschine mit diesem Namen vorhanden!");
                valideMachineName = false;
                document.getElementById('inputMaschinenname').style.borderColor = "red";
            }else{
                valideMachineName = true;
                document.getElementById('inputMaschinenname').style.borderColor = "";
            }
        }
    });
}

function checkIfMachineExists(machineName){
    uibuilder.send({
        'topic': "SELECT true FROM machine WHERE machineName ="+ "'" +machineName+"'",
        'type': "machineExists"
    });
}

function addNewMachine(){

    var machineName = document.getElementById('inputMaschinenname').value;
    var phaseNumber = document.getElementById('inputStromphasen').value;
    var fixedCostsPerUsage = document.getElementById('inputFixKosten').value;
    var area = document.getElementById('inputBereich').value;
    var permission = document.getElementById('berechtigungsstufe').value;

    if(valideMachineName && validePhaseNumber){

        uibuilder.send({
            'topic': 'INSERT INTO machine VALUES("'+machineName+'", "'+phaseNumber+'", "'+permission+'", "'+fixedCostsPerUsage+'", "'+area+'")'
        });

        var info = document.getElementById('infoModal');
        var message = "<b>Zusammenfassung</b><br><br>Maschinenname: "+machineName+"<br>Anzahl der Phasen: "+phaseNumber+"<br>Fixkosten pro Nutzung der Maschine: "
        +fixedCostsPerUsage+"<br>Bereich/Raum/Werkstoff: "+area+"<br>Berechtigungsstufe um diese Maschine bedienen zu dürfen: "+permission+"<br>";

        info.innerHTML = renderInformationModal("Maschine angelegt", message, "`maschinen.html`"); //be carfull with marks "``"
        $('#infoModal').modal('show');

    } else {
        snackbarMessage("Maschine kann nicht angelegt werden. Kein Nutzername oder ein bereits vergebener angegeben. Oder keine Phasenanzahl angegeben!");
    }
}
