// ==========================================
// CORE GLOBAL DATA ROUTING CONFIGURATIONS
// ==========================================
const GOOGLE_SHEET_ID = '1oHkY3Vz9ZXdmXvZTVZCMa_tT8pp9ZrSWuo7ETKytF6s';
const SHEET_TAB_NAME = 'Clients';
const APPS_SCRIPT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbycUkw0oKMcUvriYlmnUFW3db1zXkYZbnVUaCz1xd_SMe1sEjCORZD9UmNtclw1mzKj/exec';

let clientsDatabase = [];
let currentSortCol = null;
let sortAscending = true;

// ==========================================
// ASYNC EXTERNAL FRAGMENT INJECTION LAYER
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    Promise.all([
        fetch('nav.html').then(response => response.text()),
        fetch('form-client.html').then(response => response.text())
    ])
    .then(([navHtml, formHtml]) => {
        document.getElementById('sidebar-placeholder').innerHTML = navHtml;
        document.getElementById('form-placeholder').innerHTML = formHtml;
        
        // Initialize the app only AFTER the HTML fragments are loaded
        initializeApplicationEngine();
    })
    .catch(error => {
        console.error("Critical Error: Unable to fetch nav.html or form-client.html. Are you using a local server?", error);
        document.getElementById('tableStatus').innerHTML = "<i class='fa-solid fa-circle-xmark'></i> Error: Must use Local Server (like Live Server in VS Code) to load split files.";
    });
});

function initializeApplicationEngine() {
    initializeThemeEngine();
    initializeMobileNav();
    initializeMasterSearch();
    initializeAnalyticCharts();
    synchronizeSheetDatabase();
}

// ==========================================
// MOBILE NAVIGATION & UI LOGIC
// ==========================================
function initializeMobileNav() {
    const mobileBtn = document.getElementById('mobileNavToggle');
    const sidebar = document.getElementById('sidebar-placeholder');
    
    mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    sidebar.addEventListener('click', (e) => {
        if(e.target.closest('.menu-item') && window.innerWidth <= 900) {
            sidebar.classList.remove('open');
        }
    });
}

function initializeThemeEngine() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const body = document.body;
    
    themeBtn.addEventListener('click', () => {
        if (body.getAttribute('data-theme') === 'dark') {
            body.removeAttribute('data-theme');
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        } else {
            body.setAttribute('data-theme', 'dark');
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.view-container').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`view-${tabName}`).classList.add('active');
    
    if(tabName === 'dashboard') {
        document.getElementById('navDashboard').classList.add('active');
        document.getElementById('pageTitle').innerText = "Dashboard Overview";
    } else if (tabName === 'clients') {
        document.getElementById('navClients').classList.add('active');
        document.getElementById('pageTitle').innerText = "Clients Directory";
    }
}

function initializeAnalyticCharts() {
    const ctx = document.getElementById('plChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                { label: 'Income', data: [12000, 19000, 15000, 22000, 28000, 32000], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 2, fill: true, tension: 0.4 },
                { label: 'Expenses', data: [8000, 12000, 10000, 14000, 16000, 15000], borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 2, fill: true, tension: 0.4 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
}

// ==========================================
// SEARCH & SORT LOGIC
// ==========================================
function initializeMasterSearch() {
    const searchInput = document.getElementById('dashboardMasterSearch');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        // Instantly filter main database based on multiple relevant fields
        const filteredData = clientsDatabase.filter(client => {
            return (client.ClientName && client.ClientName.toLowerCase().includes(query)) ||
                   (client.ClientID && client.ClientID.toLowerCase().includes(query)) ||
                   (client.PanNo && client.PanNo.toLowerCase().includes(query)) ||
                   (client.GSTNo && client.GSTNo.toLowerCase().includes(query)) ||
                   (client.MobileNo && client.MobileNo.toLowerCase().includes(query));
        });
        
        renderTableRows(filteredData);
    });
}

function sortClientTable(columnKey) {
    if (currentSortCol === columnKey) {
        sortAscending = !sortAscending;
    } else {
        currentSortCol = columnKey;
        sortAscending = true;
    }

    const sortedData = [...clientsDatabase].sort((a, b) => {
        const valA = (a[columnKey] || '').toString().toLowerCase();
        const valB = (b[columnKey] || '').toString().toLowerCase();

        if (valA < valB) return sortAscending ? -1 : 1;
        if (valA > valB) return sortAscending ? 1 : -1;
        return 0;
    });

    // Re-apply search filter if currently typing
    const searchInput = document.getElementById('dashboardMasterSearch');
    const query = searchInput.value.toLowerCase();
    
    const finalData = query ? sortedData.filter(client => 
        (client.ClientName && client.ClientName.toLowerCase().includes(query)) ||
        (client.ClientID && client.ClientID.toLowerCase().includes(query)) ||
        (client.PanNo && client.PanNo.toLowerCase().includes(query))
    ) : sortedData;

    renderTableRows(finalData);
}

// ==========================================
// SHEET SYNC & RENDERING
// ==========================================
function synchronizeSheetDatabase() {
    const csvURL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_TAB_NAME}`;

    Papa.parse(csvURL, {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;
            const status = document.getElementById('tableStatus');
            const table = document.getElementById('clientsTable');
            const countDisplay = document.getElementById('totalClientsCount');

            // Filter empties and save to global array for searching
            clientsDatabase = data.filter(row => row.ClientID || row.ClientName);
            
            if(countDisplay) countDisplay.innerText = clientsDatabase.length;

            if(clientsDatabase.length === 0) {
                status.innerHTML = "<i class='fa-solid fa-triangle-exclamation'></i> Operational directory records empty.";
                return;
            }

            status.style.display = 'none';
            table.style.display = 'table';
            
            renderTableRows(clientsDatabase);
        },
        error: function(err) {
            document.getElementById('tableStatus').innerHTML = "<i class='fa-solid fa-circle-xmark'></i> Parsing connection failed.";
        }
    });
}

function renderTableRows(dataToRender) {
    const tbody = document.getElementById('clientsTableBody');
    tbody.innerHTML = ""; 

    dataToRender.forEach((row) => {
        // Find actual index in main array for operations
        const realIndex = clientsDatabase.findIndex(c => c.ClientID === row.ClientID);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="client-name-cell">${row.ClientName || '-'}</td>
            <td><strong>${row.ClientID || '-'}</strong></td>
            <td>${row.MobileNo || '-'}</td>
            <td>
                ${row.FolderLink ? `<a href="${row.FolderLink}" target="_blank" style="color: var(--accent); font-size:16px;"><i class="fa-regular fa-folder-open"></i></a>` : '-'}
            </td>
            <td style="text-align: center;">
                <button class="btn-row-action" style="background:rgba(37,99,235,0.1); color:var(--accent);" onclick="openViewModal(${realIndex})"><i class="fa-solid fa-expand"></i> View</button>
                <button class="btn-row-action" style="background:rgba(16,185,129,0.1); color:#10b981;" onclick="openEditModeModal(${realIndex})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                <button class="btn-row-action" style="background:rgba(239,68,68,0.1); color:var(--danger);" onclick="executeRowDeletion(${realIndex})"><i class="fa-solid fa-trash-can"></i> Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// MODALS & CRUD
// ==========================================
function openViewModal(index) {
    const record = clientsDatabase[index];
    document.getElementById('vd-clientname').innerText = record.ClientName || '-';
    document.getElementById('vd-clientid').innerText = record.ClientID || '-';
    document.getElementById('vd-legalname').innerText = record.LegalName || '-';
    document.getElementById('vd-mobileno').innerText = record.MobileNo || '-';
    document.getElementById('vd-email').innerText = record.Email || '-';
    document.getElementById('vd-constitution').innerText = record.Constitution || '-';
    document.getElementById('vd-branch').innerText = record.Branch || '-';
    document.getElementById('vd-gstno').innerText = record.GSTNo || '-';
    document.getElementById('vd-panno').innerText = record.PanNo || '-';
    document.getElementById('vd-adharno').innerText = record.AdharNo || '-';
    document.getElementById('vd-fathersname').innerText = record.FathersName || '-';
    document.getElementById('vd-dob').innerText = record.DOB || record.DOC || '-';
    document.getElementById('vd-address').innerText = record.Address || '-';
    document.getElementById('vd-reference').innerText = record.Reference || '-';
    document.getElementById('vd-notes').innerText = record.Notes || '-';
    document.getElementById('vd-timestamp').innerText = record.TimeStamp || '-';

    document.getElementById('viewClientModal').style.display = 'flex';
}

function closeViewModal() { document.getElementById('viewClientModal').style.display = 'none'; }

function openCreateModeModal() {
    document.getElementById('addClientForm').reset();
    document.getElementById('formActionType').value = "CREATE";
    document.getElementById('f-clientid').value = "AUTO-GENERATE";
    document.getElementById('modalFormTitle').innerText = "Add New Client Profile";
    document.getElementById('formModalWrapper').style.display = 'flex';
}

function openEditModeModal(index) {
    const record = clientsDatabase[index];
    document.getElementById('formActionType').value = "UPDATE";
    document.getElementById('modalFormTitle').innerText = `Update Profile Ledger: ${record.ClientName}`;
    
    document.getElementById('f-clientid').value = record.ClientID;
    document.getElementById('f-clientname').value = record.ClientName || '';
    document.getElementById('f-legalname').value = record.LegalName || '';
    document.getElementById('f-mobileno').value = record.MobileNo || '';
    document.getElementById('f-email').value = record.Email || '';
    document.getElementById('f-branch').value = record.Branch || '';
    document.getElementById('f-constitution').value = record.Constitution || 'Individual';
    document.getElementById('f-gstno').value = record.GSTNo || '';
    document.getElementById('f-panno').value = record.PanNo || '';
    document.getElementById('f-adharno').value = record.AdharNo || '';
    document.getElementById('f-fathersname').value = record.FathersName || '';
    document.getElementById('f-dob').value = record.DOB || record.DOC || '';
    document.getElementById('f-address').value = record.Address || '';
    document.getElementById('f-reference').value = record.Reference || '';
    document.getElementById('f-folderlink').value = record.FolderLink || '';
    document.getElementById('f-notes').value = record.Notes || '';

    document.getElementById('formModalWrapper').style.display = 'flex';
}

function closeFormModal() { document.getElementById('formModalWrapper').style.display = 'none'; }

function commitFormTransaction() {
    if(APPS_SCRIPT_WEBAPP_URL.includes("YOUR_DEPLOYED_APPS_SCRIPT")) {
        alert("Action Intercepted: Please deploy the Google Apps Script backend engine code and configure your unique Web App URL within script.js.");
        return;
    }

    const action = document.getElementById('formActionType').value;
    const payload = {
        action: action,
        ClientID: document.getElementById('f-clientid').value,
        ClientName: document.getElementById('f-clientname').value,
        LegalName: document.getElementById('f-legalname').value,
        MobileNo: document.getElementById('f-mobileno').value,
        Email: document.getElementById('f-email').value,
        Branch: document.getElementById('f-branch').value,
        Constitution: document.getElementById('f-constitution').value,
        GSTNo: document.getElementById('f-gstno').value,
        PanNo: document.getElementById('f-panno').value,
        AdharNo: document.getElementById('f-adharno').value,
        FathersName: document.getElementById('f-fathersname').value,
        DOB_DOC: document.getElementById('f-dob').value,
        Address: document.getElementById('f-address').value,
        Notes: document.getElementById('f-notes').value,
        Reference: document.getElementById('f-reference').value,
        FolderLink: document.getElementById('f-folderlink').value
    };

    if(!payload.ClientName || !payload.MobileNo) {
        alert("Processing Input Incomplete: Client Name and Mobile fields are required structural attributes.");
        return;
    }

    document.getElementById('tableStatus').style.display = 'block';
    document.getElementById('tableStatus').innerText = "Transmitting records...";
    closeFormModal();

    fetch(APPS_SCRIPT_WEBAPP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(() => {
        setTimeout(() => { 
            synchronizeSheetDatabase(); 
            alert("Transaction processing confirmed.");
        }, 2500);
    })
    .catch(err => alert("Transmission Error: " + err));
}

function executeRowDeletion(index) {
    const record = clientsDatabase[index];
    if(!confirm(`Security Clearance Threshold: Confirm elimination of client "${record.ClientName}" matching registry key ${record.ClientID}?`)) return;

    if(APPS_SCRIPT_WEBAPP_URL.includes("YOUR_DEPLOYED_APPS_SCRIPT")) {
        alert("Configuration Error: Set your Web App API deployment URL.");
        return;
    }

    document.getElementById('tableStatus').style.display = 'block';
    document.getElementById('tableStatus').innerText = "Wiping selected row...";

    fetch(APPS_SCRIPT_WEBAPP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", ClientID: record.ClientID })
    })
    .then(() => {
        setTimeout(() => { 
            synchronizeSheetDatabase(); 
            alert("Wipe macro operations verified.");
        }, 2500);
    })
    .catch(err => alert("Wipe API Error: " + err));
}
