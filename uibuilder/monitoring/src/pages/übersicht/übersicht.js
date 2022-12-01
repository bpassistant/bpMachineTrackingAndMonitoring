
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

    const eMsg_2 = document.getElementById('fullName')
    eMsg_2.innerHTML = stringFormat(window.syntaxHighlight(localStorage.getItem("name")))
    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start()

    uibuilder.send({
        'topic': "SELECT ( SELECT COUNT(*) FROM user) AS numberOfUsers,( SELECT firstName || ' ' || lastName FROM user where userid = "+ localStorage.getItem("username") +") AS fullName,( SELECT powerCost FROM config) AS powerCost, (SELECT COUNT(*) FROM machine) AS numberOfMachines"
    })

    uibuilder.send({
        'type': "getNumberOfActiveUsersAndMachines"
    })

    // Listen for incoming messages from Node-RED
    uibuilder.onChange('msg', function(msg){
        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg)

        if(msg.type == "getNumberOfActiveUsersAndMachines"){

            $('#dataTable').bootstrapTable({
                columns: [{
                    field: 'userID',
                    title: 'UserID',
                    sortable: "true",
                    formatter: "checkIfDefaultUser"
                },{
                    field: 'machineName',
                    title: 'Maschinenname',
                    sortable: "true"
                }, {
                    field: 'setupStartTime',
                    title: 'Login Zeitpunkt',
                    sortable: "true",
                    formatter: "convertMillisToDate"
                }, {
                    field: 'startMessuringTime',
                    title: 'Start der Strommessung',
                    sortable: "true",
                    formatter: "convertMillisToDate"
                }],
                data: msg.payload
            })

        } else {
            // dump the msg as text to the "msg" html element
            const eMsg_0 = document.getElementById('numberOfUsers');
            eMsg_0.innerHTML = window.syntaxHighlight(msg.payload[0]["numberOfUsers"]);

            // dump the msg as text to the "msg" html element
            const eMsg_1 = document.getElementById('numberOfMachines');
            eMsg_1.innerHTML = window.syntaxHighlight(msg.payload[0]["numberOfMachines"]);

            // dump the msg as text to the "msg" html element
            const eMsg_3 = document.getElementById('powerCosts');
            //TODO replace with value from database
            eMsg_3.innerHTML = window.syntaxHighlight(msg.payload[0]["powerCost"]);
            localStorage.setItem("powerCost", msg.payload[0]["powerCost"]);
            document.getElementById('inputPowerCosts').value = msg.payload[0]["powerCost"];
        }

    })

}

function changePowerCosts(){
    var inputPowerCosts = document.getElementById('inputPowerCosts').value;
   
    uibuilder.send({
        'topic': "UPDATE config SET powerCost = "+inputPowerCosts,
        'type': "changedPowerCosts"
    })

    const eMsg_2 = document.getElementById('powerCosts')
    eMsg_2.innerHTML = inputPowerCosts;
    localStorage.setItem("powerCost", inputPowerCosts);
}