
/** Minimalist code for uibuilder and Node-RED */
'use strict'
 
// run this function when the document is loaded
window.onload = function() {

    // Start up uibuilder - see the docs for the optional parameters
    uibuilder.start()

    uibuilder.send({
        'topic': "SELECT (SELECT powerCost FROM config) AS powerCost"
    })

    // Listen for incoming messages from Node-RED
    uibuilder.onChange('msg', function(msg){
        console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg)

        const eMsg_3 = document.getElementById('powerCosts');

        eMsg_3.innerHTML = window.syntaxHighlight(msg.payload[0]["powerCost"]);
        localStorage.setItem("powerCost", msg.payload[0]["powerCost"]);
        document.getElementById('inputPowerCosts').value = msg.payload[0]["powerCost"];
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