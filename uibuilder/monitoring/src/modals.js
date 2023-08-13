
function renderLogoutModal(){

    return `<div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLabel">Bereit zu gehen?</h5>
                        <button class="close" type="button" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">×</span>
                        </button>
                    </div>
                    <div class="modal-body">Wählen Sie "Abmelden", wenn Sie bereit sind, Ihre aktuelle Sitzung zu beenden.</div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" type="button" data-dismiss="modal">Abbrechen</button>
                        <a class="btn btn-primary" href="../login/login.html">Abmelden</a>
                    </div>
                </div>
            </div>`
}

function renderEntryModalForNormalUser(){

    return `<div class="modal-dialog modal-dialog-centered modal-sm" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLongTitle">Eintrag</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">

                        <table id="entryTable" 
                            data-search="false"                   
                            data-height="75%">
                        </table>
                        <br>
                        <p class="mb-3" style="font-weight: bold;">Notiz:</p>

                        <!--TODO style auslagern-->
                        <textarea 
                            id="message" 
                            rows="4" 
                            placeholder="Hier eine Notiz anlegen..." 
                            style="display: block;
                            width: 100%;
                            overflow: hidden;
                            resize: both;
                            min-height: 40px;
                            line-height: 20px;">
                        </textarea>
                        <br>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Schließen</button>
                        <button type="button" class="btn btn-primary" onclick="saveMessage()" data-dismiss="modal" aria-label="Close">Nachricht speichern</button>
                    </div>
                </div>
            </div>`
}


