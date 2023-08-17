
/** Minimalist code for uibuilder and Node-RED */
'use strict'

const MessageType = {
    getUserIDs: "getUserIDs",
    getMachineNames: "getMachineNames",
    getDataForThisMonth: "getDataForThisMonth",
    getDataForSelected: "getDataForSelected"
}

var startDatePicker;
var endDatePicker;
var bufferData;
 
// run this function when the document is loaded
window.onload = function() {

    setDatePicker();

    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start()

    getAllDataForThisMonth();

    getUserAndMachines();
}

function setDatePicker() {
    
    startDatePicker = document.getElementById("start");
    endDatePicker = document.getElementById("end");

    var date = new Date();
    //date.setHours(0, 0, 0);
    //set endDatePicker to current date
    endDatePicker.valueAsDate = date;

    //set startDatePicker to first day in current month
    date.setDate(1);
    startDatePicker.valueAsDate = date;
}

// Listen for incoming messages from Node-RED
uibuilder.onChange('msg', function(msg){

    console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg)
    
    if(msg.messageType == MessageType.getDataForThisMonth){

        var overViewData = createOverviewDataObject(msg.payload);

        $('#overviewTable').bootstrapTable({
            columns: [{
                field: 'machineHours',
                title: 'Summe der Maschinenstunden',
            }, {
                field: 'wattHours',
                title: 'Summe der Wattstunden',
                formatter: "kWHFormatterTwoDecimalDigits"
            }, {
                field: 'powerCosts',
                title: 'Stromkosten (' + localStorage.getItem("powerCost") + " €/kWh)",
            }],
            data: overViewData
        });
    }
    
    //Important: no else if in this case, because we want to fill both tables
    if(msg.messageType == MessageType.getDataForThisMonth || msg.messageType == MessageType.getDataForSelected){

        //TODO: Hardcoded security: Der Master-Admin hat die UserID 42. Dieser soll nicht von anderen Admins bearbeitet oder gelöscht werden.
        //Daher die simple Maßnahme, den Master-Admin gar nicht im Frontend anzuzeigen
        //
        //bufferData = msg.payload.filter(item => item.userid != 42);
        //
        //Wieder zurück gesetzt, da bei großen Mengen an Einträgen das Filtern die Performance stark beeinträchtigen könnte
        //Man kann einfach davon ausgehen, dass der MasterAdmin keine Einträge tätigt.

        bufferData = msg.payload;

        $('#dataTable').bootstrapTable({
            columns: [{
                field: 'userid',
                title: 'UserID',
                sortable: "true"
            },{
                field: 'machineName',
                title: 'Maschinenname',
                sortable: "true"
            }, {
                field: 'start',
                title: 'Start',
                sortable: "true",
                formatter: "convertMillisToDate"
            }, {
                field: 'setUpTime',
                title: 'Rüstzeit',
                sortable: "true",
                formatter: "convertMillisToHoursMinutesSeconds"
            }, {
                field: 'workDuration',
                title: 'Messdauer',
                sortable: "true",
                formatter: "convertMillisToHoursMinutesSeconds"
            },{
                field: 'power',
                title: 'Verbrauchte Wattstunden',
                sortable: "true",
                formatter: "kWHFormatterFourDecimalDigits"
            }]
        });
        
        $('#dataTable').bootstrapTable("load", bufferData);

    } else if(msg.messageType == MessageType.getUserIDs){

        //TODO: Hardcoded security: Der Master-Admin hat die UserID 42. Dieser soll nicht von anderen Admins bearbeitet oder gelöscht werden.
        //Daher die simple Maßnahme, den Master-Admin gar nicht im Frontend anzuzeigen
        fillUserDropdown(msg.payload.filter(item => item.userid != 42));

    } else if(msg.messageType == MessageType.getMachineNames){
        fillMachineDropdown(msg.payload);
    }
});

function getUserAndMachines(){

    var querry = "SELECT userid FROM user";

    uibuilder.send({
        'topic': querry,
        'messageType': MessageType.getUserIDs
    });

    querry = "SELECT machineName FROM machine";

    uibuilder.send({
        'topic': querry,
        'messageType': MessageType.getMachineNames
    });
}

function getAllDataForSelected() {

    var querry;

    var selectedUserID= document.getElementById("userDropdown").value;
    var machineDropdown = document.getElementById("machineDropdown");
    var selectedMachine = machineDropdown.options[machineDropdown.selectedIndex].text;

    var startDate = new Date(startDatePicker.value).getTime();
    //Date starts with 00:00 so entrys for the same day might not be found. Added 23 h and 59 min.
    var endData = new Date(endDatePicker.value).getTime() +86364000;

    //get all entrys
    if(selectedMachine == "Alle" && selectedUserID == 0){

        querry = "SELECT * FROM data INNER JOIN user ON data.userid = user.userid WHERE start >= " + startDate + " AND start <= " + endData + " ORDER BY start DESC";

    }else if(selectedUserID != 0 && selectedMachine == "Alle"){

        //Select all entrys from specific user on all machines
        querry = "SELECT * FROM data INNER JOIN user ON data.userid = user.userid WHERE user.userid = "+ selectedUserID +" AND start >= " + startDate + " AND start <= " + endData + " ORDER BY start DESC";

    }else if(selectedUserID == 0 && selectedMachine != "Alle"){

        //Select all entrys from specific machine for all users
        querry = "SELECT * FROM data INNER JOIN user ON data.userid = user.userid WHERE data.machineName = '"+ selectedMachine +"' AND start >= " + startDate + " AND start <= " + endData + " ORDER BY start DESC";

    }else{

        //Select all entrys from specific user for specific machine
        querry = "SELECT * FROM data INNER JOIN user ON data.userid = user.userid WHERE user.userid = "+ selectedUserID +" AND data.machineName = '"+ selectedMachine +"' AND start >= " + startDate + " AND start <= " + endData + " ORDER BY start DESC";
    }

    uibuilder.send({
        'topic': querry,
        'messageType': MessageType.getDataForSelected
    });
}

function getAllDataForThisMonth() {
    
    //Date starts with 00:00 so entrys for the same day might not be found. Added 23 h and 59 min du end date.
    var querry = "SELECT * FROM data INNER JOIN user ON data.userid = user.userid WHERE start >= " + new Date(startDatePicker.value).getTime() + " AND start <= " + new Date(endDatePicker.value).getTime()+ 82800000 + " ORDER BY start DESC";

    uibuilder.send({
        'topic': querry,
        'messageType': MessageType.getDataForThisMonth
    });
}

function getSelectedDateRangeAsString() {

    var startDate = new Date(startDatePicker.value);
    var endData = new Date(endDatePicker.value);

    return startDate.getDate()+"."+(startDate.getMonth()+1)+"."+startDate.getFullYear()+"-"+endData.getDate()+"."+(endData.getMonth()+1)+"."+endData.getFullYear();
}

function createOverviewDataObject(array){

    var overViewData = [{
        machineHours: "",
        wattHours: "",
        powerCosts: ""
    }];

    var sumMachineHours = 0;
    var sumWatt = 0;

    array.forEach(dataEntry => {
        sumMachineHours = sumMachineHours + dataEntry.workDuration;
        sumWatt = sumWatt + Number(dataEntry.power);
    });
    
    overViewData[0].machineHours = convertMillisToHoursMinutesSeconds(sumMachineHours);
    overViewData[0].wattHours = (sumWatt).toFixed(2);
    overViewData[0].powerCosts = calculatePrice(overViewData[0].wattHours, localStorage.getItem("powerCost"));

    return overViewData;
}

function exportXLSX(){

    //Doc
    //https://docs.sheetjs.com/docs/api/utilities/array

    var workBook = XLSX.utils.book_new();                               
    workBook.Props = {
        Title: "Zusammenfassung für ausgewählten Zeitraum",
        Author: localStorage.getItem("userID"),
        CreatedDate: new Date()
    };

    workBook.SheetNames.push("Auswahl_"+getSelectedDateRangeAsString());

    var workSheet;
    var workBookOut;
    
    workSheet = XLSX.utils.json_to_sheet(setExportObject());
    
    //Wichtig: Der Sheetsname hier muss identisch sein mit dem oben vergebenen! Ansonsten bleibt der Export leer!
    workBook.Sheets["Auswahl_"+getSelectedDateRangeAsString()] = workSheet;

    workBookOut = XLSX.write(workBook, {bookType:'xlsx',  type: 'binary'});
    
    saveAs(new Blob([s2ab(workBookOut)],{type:"application/octet-stream"}), 'Zusammenfassung_'+getSelectedDateRangeAsString()+'.xlsx');
}

function setExportObject() {

    var exportArray = [];

    bufferData.forEach(element => {

        exportArray.push({
            UserID: element.userid,
            Maschinenname: element.machineName,
            Start: convertMillisToDate(element.start),
            "Rüstzeit in Stunden": convertMillisToHoursMinutesSecondsForExport(element.setUpTime),
            "Messdauer in Stunden": convertMillisToHoursMinutesSecondsForExport(element.workDuration),
            "Verbrauch in kWh": parseFloat(kWHFormatterFourDecimalDigitsForExport(element.power)),
            "Stromkosten in Euro": parseFloat(calculatePriceForExport(element.power, localStorage.getItem("powerCost"))),
            Firma: element.company
        });
    });
    return exportArray;
}

//Helper function
function s2ab(s) {

    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
}

function fillUserDropdown(userArray){

    var select = document.getElementById("userDropdown");

    var opt = document.createElement("option");
    opt.value = 0;
    opt.innerHTML = "Alle";

    select.appendChild(opt);

    userArray.forEach(user => {
        var opt = document.createElement("option");
        opt.value = user.userid;
        opt.innerHTML = user.userid;

        select.appendChild(opt);
    });
};

function fillMachineDropdown(machineArray){

    var select = document.getElementById("machineDropdown");

    var opt = document.createElement("option");
    opt.innerHTML = "Alle";

    select.appendChild(opt);

    machineArray.forEach(function callback(machine, index){
        var opt = document.createElement("option");
        opt.value = index;
        opt.innerHTML = machine.machineName;

        select.appendChild(opt);
    });
};
