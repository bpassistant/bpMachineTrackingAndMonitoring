
/** Minimalist code for uibuilder and Node-RED */
'use strict'

var lastUserIDInRow;

// run this function when the document is loaded
window.onload = function() {
    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start()
    uibuilder.send({
        'topic': "SELECT *  FROM user",
        'type' : 'getUser'
    })

    uibuilder.send({
        'topic' : 'SELECT lastUserIDInRow FROM config',
        'type': 'getLastUserID'
    });

    // Listen for incoming messages from Node-RED
    uibuilder.onChange('msg', function(msg){
        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg)

        if(msg.type == "getUser"){

            //TODO: Hardcoded security: Der Master-Admin hat die UserID 42. Dieser soll nicht von anderen Admins bearbeitet oder gelöscht werden.
            //Daher die simple Maßnahme, den Master-Admin gar nicht im Frontend anzuzeigen
            var dataArray = msg.payload.filter(item => item.userid != 42);

            $('#table').bootstrapTable({
                columns: [{
                  field: 'userid',
                  title: 'UserID',
                  sortable: "true"
                }, {
                    field: 'admin',
                    title: 'Admin',
                    sortable: "true",
                    formatter: "adminFormat"
                }, {
                    field: 'permission',
                    title: 'Berechtigungsstufe',
                    sortable: "true"
                }, {
                    field: 'company',
                    title: 'Firma',
                    sortable: "true"
                }, {
                    field: 'operate',
                    title: 'Bearbeiten',
                    align: 'left',
                    valign: 'middle',
                    clickToSelect: false,
                    formatter : function(value,row,index) {
                        var editButton = '<a href="nutzer_bearbeiten.html?userid='+row.userid+'" type="button" class="mr-4 btn btn-primary" role="button" ><i class="fas fa-wrench" aria-hidden="true"></i></a>';
                        var deleteButton = '<button onclick="warnBeforeDeletion('+index+','+row.userid+')" type="button" class="btn btn-primary"><i class="fas fa-trash" aria-hidden="true"></i></button>'
                        return editButton + deleteButton;
                    }
                }],
                data: dataArray
              })

        } else if(msg.type == "getLastUserID"){
            lastUserIDInRow = msg.payload[0].lastUserIDInRow;
        }
        
    })
}

function warnBeforeDeletion(index, userid){

    var info = document.getElementById('deletionWarnModal');
    var message = "<b>Achtung!</b><br><br>Soll der Nutzer mit der UserID: "+userid+" endgültig gelöscht werden?";

    info.innerHTML = renderDeletionWarnModal("Nutzer Löschen", message, "deleteUser("+index+","+userid+")"); //be carfull with marks "``"
    $('#deletionWarnModal').modal('show');
}

function deleteUser(index, userid){
    
    uibuilder.send({
        'topic': 'DELETE FROM user WHERE userid=' + userid +'' 
    });

    $('#table').bootstrapTable('remove', {
        field: '$index',
        values: [index]
    });

    if(userid <= lastUserIDInRow){
        uibuilder.send({
            'topic': 'UPDATE config set lastUserIDInRow='+ (userid - 1)
        });
    }
}

function adminFormat(value, row, index) {
    if (value==1){return "Admin";
}else {
    return "";
}}