
/** Minimalist code for uibuilder and Node-RED */
'use strict'

var validePhaseNumber = true;

// run this function when the document is loaded
window.onload = function() {
    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start()

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var machineName = urlParams.get('machine')

    if(typeof machineName === 'string'){

        uibuilder.send({
            'topic': "SELECT * FROM machine WHERE machineName=" + "'" + machineName + "'"
        });
    }else{
        snackbarMessage("Es wurde kein oder ein falscher Maschinenname als Parameter übergeben!");
        validePhaseNumber = false;
    }

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

    // Listen for incoming messages from Node-RED
    uibuilder.onChange('msg', function(msg){
        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg)
        
        fillForm(msg);
    })
}

function fillForm(msg) {

    document.getElementById('inputMaschinenname').value = msg.payload[0].machineName;
    document.getElementById('inputStromphasen').value = msg.payload[0].phaseNumber;
    document.getElementById('berechtigungsstufe').value = msg.payload[0].permission;
    document.getElementById('inputFixKosten').value = msg.payload[0].fixedCostsPerUsage;
    document.getElementById('inputBereich').value = msg.payload[0].area;
}

function editMachine(){

    if(validePhaseNumber){

        var machineName = document.getElementById('inputMaschinenname').value;
        var phaseNumber = document.getElementById('inputStromphasen').value;
        var permission = document.getElementById('berechtigungsstufe').value;
        var fixedCostsPerUsage = document.getElementById('inputFixKosten').value;
        var area = document.getElementById('inputBereich').value;

        uibuilder.send({
            'topic': 'UPDATE machine SET phaseNumber='+phaseNumber+', permission='+permission+', fixedCostsPerUsage='+fixedCostsPerUsage+', area= "'+area+'" WHERE machineName = "'+machineName+'"'
        });

        var info = document.getElementById('infoModal');

        info.innerHTML = renderInformationModal("Maschine bearbeitet", "Die neuen Werte wurden übernommen.", "`maschinen.html`"); //be carfull with marks "``"
        $('#infoModal').modal('show');
    } else {
        snackbarMessage("Maschine kann nicht berarbeitet werden. Übrprüfe, ob die Parameter der Maschine richtig geladen wurden und ob die Stromphasen eingetragen sind!");
    }
}

document.body.addEventListener('keypress', function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        
        document.getElementById("editMachineButton").click();
    }
});