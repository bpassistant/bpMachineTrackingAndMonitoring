
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
                        
                        return '<a href="übersichtNormalerNutzer.html" type="button" class="mr-4 btn btn-primary" role="button" ><i class="fas fa-info" aria-hidden="true"></a>';
                    }
                }],
                data: msg.payload
            })
            /*
                , {
                    field: 'steUpTime',
                    title: 'Einrichtungsdauer',
                    sortable: "true",
                    formatter: "convertMillisToHoursMinutesSeconds"
                }, {
                    field: 'power',
                    title: 'Strom in Watt',
                    sortable: "true",
                    formatter: "wattFormatter"
                }, {
                    field: 'kWh',
                    title: 'kWh',
                    sortable: "true",
                    formatter: "calculateKWHFromRow"
                }

            */
        }
    })

}

function changePowerCosts(){
    var inputPowerCosts = document.getElementById('inputPowerCosts').value;
   
    //TODO Console.log löschen und Wert an Datenbank Senden!
    console.log(inputPowerCosts);

    const eMsg_2 = document.getElementById('powerCosts')
    eMsg_2.innerHTML = inputPowerCosts;
}

/*
function checkAdmin(adminPath, normalPath){
    if(localStorage.getItem("admin") === 1){
        window.location.href="../übersicht/übersicht.html";
    } else {
        window.location.href="../übersicht/übersichtNormalerNutzer.html";
    }
}
*/