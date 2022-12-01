
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

// run this function when the document is loaded
window.onload = function() {
    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start()

    uibuilder.send({
        'topic': "SELECT *  FROM machine"
    })

    // Listen for incoming messages from Node-RED
    uibuilder.onChange('msg', function(msg){
        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg)

        $('#table').bootstrapTable({
            columns: [{
                field: 'machineName',
                title: 'Maschine',
                sortable: "true"
            },{
                field: 'permission',
                title: 'Berechtigungsstufe',
                sortable: "true"
            }, {
                field: 'fixedCostsPerUsage',
                title: 'Fixkosten/Nutzung',
                sortable: "true",
                formatter: function(value){
                    return value + " €";
                }
            },{
                field: 'phaseNumber',
                title: 'Anzahl Stromphasen',
                sortable: "true",
            },{
                field: 'area',
                title: 'Bereich',
                sortable: "true"
            },{
                field: 'operate',
                title: 'Bearbeiten',
                align: 'left',
                valign: 'middle',
                clickToSelect: false,
                formatter : function(value,row,index) {
                    var editButton = '<a href="maschinen_bearbeiten.html?machine='+row.machineName+'" type="button" class="mr-4 btn btn-primary" role="button" ><i class="fas fa-wrench" aria-hidden="true"></i></a>';
                    var deleteButton = '<button onclick="deleteMachine('+index+','+ "'" + row.machineName + "'" +')" type="button" class="btn btn-primary"><i class="fas fa-trash" aria-hidden="true"></i></button>'
                    return editButton + deleteButton;
                }
            }],
            data: msg.payload
          })
    })
}

function deleteMachine(index, machineName){
    uibuilder.send({
        'topic': 'DELETE FROM machine where machineName="' + machineName +'"'
    });

   
    $('#table').bootstrapTable('remove', {
        field: '$index',
        values: [index]
    });
}
