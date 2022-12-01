
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


function stringFormat(str) {
    return str.replace(/['"]+/g, '');
}

var bufferData;
var bufferEntry;
 
// run this function when the document is loaded
window.onload = function() {

    document.getElementById('fullName').innerHTML = stringFormat(window.syntaxHighlight(localStorage.getItem("name")));

    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start()

    var querryForDataTable = "SELECT * FROM data WHERE userid=" + localStorage.getItem("userID") + " ORDER BY start DESC limit 500";
    var querryForUserTable = "SELECT userid, permission, company FROM user WHERE userid=" + localStorage.getItem("userID");
    
    uibuilder.send({
        'topic': querryForDataTable,
        'type': "getDataForDataTable"
    });

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
                        
                        return '<a href="übersichtNormalerNutzer.html" type="button" class="mr-4 btn btn-primary" role="button" data-toggle="modal" data-target="#exampleModalCenter" onclick="getEntryDataFromBuffer('+index+')"><i class="fas fa-info" aria-hidden="true"></a>';
                    }
                }],
                data: msg.payload
            })
        }
    })
}

function getEntryDataFromBuffer(index){

    bufferEntry = bufferData[index];

    var entryArray = [];
    entryArray.push({fieldName: "Maschinenname", entry: bufferEntry.machineName});
    entryArray.push({fieldName: "Start", entry: convertMillisToDate(bufferEntry.start)});
    entryArray.push({fieldName: "Rüstzeit", entry: convertMillisToHoursMinutesSeconds(bufferEntry.setUpTime)});
    entryArray.push({fieldName: "Arbeitszeit", entry: convertMillisToHoursMinutesSeconds(bufferEntry.workDuration)});
    entryArray.push({fieldName: "Wattstunden", entry: kWHFormatter(bufferEntry.power)});
    entryArray.push({fieldName: "Kosten", entry: calculatePrice(bufferEntry.power, localStorage.getItem("powerCost"))});

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