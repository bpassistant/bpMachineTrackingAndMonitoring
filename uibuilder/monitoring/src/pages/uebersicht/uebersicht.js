
/** Minimalist code for uibuilder and Node-RED */
'use strict'
 
// run this function when the document is loaded
window.onload = function() {

    const eMsg_2 = document.getElementById('userID');
    eMsg_2.innerHTML = localStorage.getItem("userID"); //stringFormat(window.syntaxHighlight
    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start();

    uibuilder.send({
        'topic': "SELECT * FROM logs WHERE time >" + (new Date().getTime() - 604800000) + " ORDER BY id DESC" //604800000 = 1 week in millis
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

            $('#logTable').bootstrapTable({
                columns: [{
                    field: 'id',
                    title: 'LogID',
                    sortable: "true",
                },{
                    field: 'time',
                    title: 'Zeitstempel des Logs',
                    sortable: "true",
                    formatter: "convertMillisToDate"
                }, {
                    field: 'message',
                    title: 'Log Nachricht',
                    sortable: "false",
                }],
                data: msg.payload

            })
        }
    })

}