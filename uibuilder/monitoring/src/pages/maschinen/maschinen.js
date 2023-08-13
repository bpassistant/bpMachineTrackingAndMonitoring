
/** Minimalist code for uibuilder and Node-RED */
'use strict'

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
                    var deleteButton = '<button onclick="warnBeforeDeletion('+index+','+ "'" + row.machineName + "'" +')" type="button" class="btn btn-primary"><i class="fas fa-trash" aria-hidden="true"></i></button>'
                    return editButton + deleteButton;
                }
            }],
            data: msg.payload
          })
    })
}

function warnBeforeDeletion(index, machineName){

    var info = document.getElementById('deletionWarnModal');
    var message = "<b>Achtung!</b><br><br>Soll die Maschine mit dem Namen "+machineName+" endgültig gelöscht werden?";

    info.innerHTML = renderDeletionWarnModal("Maschine Löschen", message, "deleteMachine("+index+","+machineName+")"); //be carfull with marks "``"
    $('#deletionWarnModal').modal('show');
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
