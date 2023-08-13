
//Function from Template or Uibuilder -> It is used by every page. Dont delete it!
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

function convertMillisToDate(millis){
    if(millis != null) {
        var date = new Date(millis);
        return date.toLocaleString('de-DE', {day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric'});
    }
}

function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}
  
function convertMillisToMinutesSeconds(milliseconds) {

    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.round((milliseconds % 60000) / 1000);
  
    return seconds === 60
      ? `${minutes + 1}:00 min`
      : `${minutes}:${padTo2Digits(seconds)} min`;
}

function convertMillisToHoursMinutesSeconds(milliseconds) {

    //https://bobbyhadz.com/blog/javascript-convert-milliseconds-to-hours-minutes-seconds
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    minutes = minutes % 60;

    // If you don't want to roll hours over, e.g. 24 to 00
    // comment (or remove) the line below
    // commenting next line gets you `24:00:00` instead of `00:00:00`
    // or `36:15:31` instead of `12:15:31`, etc.
    //hours = hours % 24;
  
    return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}:${padTo2Digits(seconds)} h`;
}

//Dummer fix nur für das "h" aber ging schnell...
function convertMillisToHoursMinutesSecondsForExport(milliseconds) {

    //https://bobbyhadz.com/blog/javascript-convert-milliseconds-to-hours-minutes-seconds
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    minutes = minutes % 60;

    // If you don't want to roll hours over, e.g. 24 to 00
    // comment (or remove) the line below
    // commenting next line gets you `24:00:00` instead of `00:00:00`
    // or `36:15:31` instead of `12:15:31`, etc.
    //hours = hours % 24;
  
    return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;
}

function kWHFormatterFourDecimalDigits(value) {
    return (value * 1).toFixed(4) + " kWh";
}

function kWHFormatterFourDecimalDigitsForExport(value) {
    return parseFloat((value * 1).toFixed(2));
}

function kWHFormatterTwoDecimalDigits(value) {
    return (value * 1).toFixed(2) + " kWh";
}

function calculateKWHFromRow(value, row) {
    return (row.power * (row.duration / 1000) / 3600000).toFixed(4);
}

function calculateKWH(power, duration) {
    return parseFloat(((power * (duration / 1000) / 3600000).toFixed(4)).replace(',','.'));
}

function calculatePrice(kWH, price) {
    return (kWH * price).toFixed(2) + " €";
}

function calculatePriceForExport(kWH, price) {
    return (kWH * price).toFixed(2);
}

function checkIfDefaultUser(user) {
    if(user == 100) {
        return "Werkstatt Konto";
    }
    return user;
}

function adminPassCheck(admin, password){
    if (admin && inputEmptyCheck(password)){
        return false;
    }else{
        return true;
    }
}

function inputEmptyCheck(inputtxt) {
    if (inputtxt == null || inputtxt == "") {
        return true;}
    else{
        return false;
    }
}

function userIDCheck(userID){

    if(userID < 100){
        snackbarMessage("Die UserID muss mindestens dreistellig sein");
        return false;
    }else {
        return true;
    }
}

function inputLetterCheck(inputtxt) {
    if((/^[0-9]+$/.test(inputtxt))){
        return true;
    }
    else{
        return false;
    }
}

function renderInformationModal(header, message, targetLocation){
    
    return `<div class="modal-dialog modal-dialog-centered modal-sm" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLongTitle">`+header+`</h5>
                    </div>
                    <div class="modal-body">
                        <p>`+message+`</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-dismiss="modal" onclick="navigate(`+targetLocation+`)">Schließen</button>
                    </div>
                </div>
            </div>`
}

function renderDeletionWarnModal(header, message, callFunction){
    
    return `<div class="modal-dialog modal-dialog-centered modal-sm" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLongTitle">`+header+`</h5>
                    </div>
                    <div class="modal-body">
                        <p>`+message+`</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal" >Abbrechen</button>
                        <button type="button" class="btn btn-primary" data-dismiss="modal" onclick="`+callFunction+`">Löschen</button>
                    </div>
                </div>
            </div>`
}

function navigate(target){

    window.location.href = target;
}

function snackbarMessage(str){
    var x = document.getElementById("snackbar");
    x.innerHTML= str;
    x.className = "show";
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
}

//Password Hashing
function convertPasswordToHash(pwd){

    //set variable hash as 0
    var hash = 30;
    // if the length of the string is 0, return 0
    if (pwd.length == 0) return hash;

    for (i = 0; i<pwd.length; i++){

        ch = pwd.charCodeAt(i);
        hash = ((hash << 5) - hash) + ch;
        hash = hash & hash;
    }
    return hash;
}
