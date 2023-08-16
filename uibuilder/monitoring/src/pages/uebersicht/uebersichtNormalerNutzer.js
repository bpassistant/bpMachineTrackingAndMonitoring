
/** Minimalist code for uibuilder and Node-RED */
'use strict'

var bufferData;
var bufferEntry;

var startDatePicker;
var endDatePicker;
 
// run this function when the document is loaded
window.onload = function() {

    setDatePicker();

    document.getElementById('userID').innerHTML = localStorage.getItem("userID");

    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start();

    getAllDataForSelected();

    var querryForUserTable = "SELECT userid, permission, company FROM user WHERE userid=" + localStorage.getItem("userID");

    uibuilder.send({
        'topic': querryForUserTable,
        'type': "getDataForUserTable"
    })
    
    // Listen for incoming messages from Node-RED
    uibuilder.onChange('msg', function(msg){
        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg);

        if(msg.type == "getDataForUserTable") {
            $('#userTable').bootstrapTable({
                columns: [{
                    field: 'userid',
                    title: 'UserID',
                },{
                    field: 'company',
                    title: 'Firma',
                },{
                    field: 'permission',
                    title: 'Berechtigungsstufe',
                }],
                data: msg.payload
            })
        }

        if(msg.type == "getDataForDataTable") {

            bufferData = msg.payload;

            $('#dataTable').bootstrapTable({
                columns: [{
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
                    title: 'Dauer',
                    sortable: "true",
                    formatter: "convertMillisToHoursMinutesSeconds"
                }, {
                    field: 'details',
                    title: 'Details',
                    align: 'left',
                    valign: 'middle',
                    clickToSelect: false,
                    formatter : function(value,row,index) {
                        
                        return '<a href="uebersichtNormalerNutzer.html" type="button" class="mr-4 btn btn-primary" role="button" data-toggle="modal" data-target="#entryModal" onclick="getEntryDataFromBuffer('+index+')"><i class="fas fa-info" aria-hidden="true"></a>';
                    }
                }]
            });

            $('#dataTable').bootstrapTable("load", bufferData);
        }
    })
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

function getAllDataForSelected() {

    var querry = "SELECT * FROM data WHERE userid=" + localStorage.getItem("userID") + " AND start >= " + new Date(startDatePicker.value).getTime() + " AND start <= " + (new Date(endDatePicker.value).getTime()+ 82800000) + " ORDER BY start DESC";

    uibuilder.send({
        'topic': querry,
        'type': "getDataForDataTable"
    });
}

function getEntryDataFromBuffer(index){

    document.getElementById("entryModal").innerHTML = renderEntryModalForNormalUser();

    bufferEntry = bufferData[index];

    var entryArray = [];
    entryArray.push({fieldName: "Maschinenname", entry: bufferEntry.machineName});
    entryArray.push({fieldName: "Start", entry: convertMillisToDate(bufferEntry.start)});
    entryArray.push({fieldName: "Rüstzeit", entry: convertMillisToHoursMinutesSeconds(bufferEntry.setUpTime)});
    entryArray.push({fieldName: "Messdauer", entry: convertMillisToHoursMinutesSeconds(bufferEntry.workDuration)});
    entryArray.push({fieldName: "Wattstunden", entry: kWHFormatterFourDecimalDigits(bufferEntry.power)});
    entryArray.push({fieldName: "Geschätzte Stromkosten", entry: calculatePrice(bufferEntry.power, localStorage.getItem("powerCost"))});

    $('#entryTable').bootstrapTable({
        columns: [{
            field: 'fieldName',
            title: 'Beschreibung'
        },{
            field: 'entry',
            title: 'Eintrag'
        }],
        data: entryArray
    })

    document.getElementById("message").innerHTML = bufferEntry.message;
}

function saveMessage(){

    var message = document.getElementById("message").value;
    var machineName = bufferEntry.machineName;
    var start = bufferEntry.start;
    
    uibuilder.send({
        'topic': 'UPDATE data SET message="'+message+'" WHERE machineName="'+machineName+'" AND start='+start+''
    });
}

function getSelectedDateRangeAsString() {

    var startDate = new Date(startDatePicker.value);
    var endData = new Date(endDatePicker.value);

    return startDate.getDate()+"."+(startDate.getMonth()+1)+"."+startDate.getFullYear()+"-"+endData.getDate()+"."+(endData.getMonth()+1)+"."+endData.getFullYear();
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
            Maschinenname: element.machineName,
            Start: convertMillisToDate(element.start),
            "Rüstzeit in Stunden": convertMillisToHoursMinutesSecondsForExport(element.setUpTime),
            "Messdauer in Stunden": convertMillisToHoursMinutesSecondsForExport(element.workDuration),
            "Verbrauch in kWh": parseFloat(kWHFormatterFourDecimalDigitsForExport(element.power)),
            "Stromkosten in Euro": parseFloat(calculatePriceForExport(element.power, localStorage.getItem("powerCost"))),
            Notiz: element.message
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