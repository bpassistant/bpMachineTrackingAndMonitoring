
function renderSidebar(page) {

    var overviewTab = '';
    var userTab = '';
    var machineTab = '';
    var monitoringTab = '';
    var configTab = '';

    switch(page){
        case 'overview':
            overviewTab = 'active';
            break;
        case 'user':
            userTab = 'active';
            break;
        case 'machine':
            machineTab = 'active';
            break;
        case 'monitoring':
            monitoringTab = 'active';
            break;
        case 'config':
            configTab = 'active';
        break;
        default:
            overviewTab = 'active';
    }
    return `
    <!-- Sidebar - Brand -->
    <a class="sidebar-brand d-flex align-items-center justify-content-center" href="übersicht.html">
        <div class="sidebar-brand-icon rotate-n-15">
            <i class="fas fa-laugh-wink"></i>
        </div>
        <div class="sidebar-brand-text mx-3">B+P</div>
    </a>

    <!-- Divider -->
    <hr class="sidebar-divider my-0">

    <!-- Nav Item - Übersicht -->
    <li class="nav-item ` + overviewTab + `">
        <a class="nav-link" href="../uebersicht/uebersicht.html">
            <i class="fas fa-home"></i>
            <span>Übersicht</span>
        </a>
    </li>

    <!-- Nav Item - Nutzer -->
    <li class="nav-item ` + userTab + `">
        <a class="nav-link" href="../nutzer/nutzer.html">
            <i class="fas fa-user"></i>
            <span>Nutzer</span>
        </a>
    </li>

    <!-- Nav Item - Maschinen -->
    <li class="nav-item ` + machineTab + `">
        <a class="nav-link" href="../maschinen/maschinen.html">
            <i class="fas fa-cog"></i>
            <span>Maschinen</span>
        </a>
    </li>

    <!-- Nav Item - Monitoring -->
    <li class="nav-item ` + monitoringTab + `">
        <a class="nav-link" href="../monitoring/monitoring.html">
            <i class="fas fa-tachometer-alt"></i>
            <span>Monitoring</span>
        </a>
    </li>

    <!-- Nav Item - Konfiguration -->
    <li class="nav-item ` + configTab + `">
        <a class="nav-link" href="../config/configPage.html">
            <i class="fas fa-wrench"></i>
            <span>Konfiguration</span>
        </a>
    </li>
    
    
    <!-- Sidebar Toggler (Sidebar) -->
    <!--
    <div class="text-center d-none d-md-inline">
        <button class="rounded-circle border-0" id="sidebarToggle"></button>
    </div>
    -->`;
}