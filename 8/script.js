const GOOGLE_SHEET_ID = '1oHkY3Vz9ZXdmXvZTVZCMa_tT8pp9ZrSWuo7ETKytF6s';
const APPS_SCRIPT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyY-sD-hqUGMVBKBa10GTokS3Id0ynEqORTMI2HlitqA7-k6wSBciB6ddbaL8j3j1kf/exec';

let clientsDatabase = [];
let compliancesDatabase = [];
let credentialsDatabase = []; // Added for credentials
let currentSortCol = null;
let sortAscending = true;

// ASYNC FRAGMENT INJECTION
document.addEventListener("DOMContentLoaded", () => {
    Promise.all([
        fetch('nav.html').then(response => response.text()),
        fetch('form-client.html').then(response => response.text()),
        fetch('form-compliance.html').then(response => response.text()),
        fetch('form-credentials.html').then(response => response.text()) // Fetch New form
    ])
    .then(([navHtml, formClientHtml, formComplianceHtml, formCredentialsHtml]) => {
        document.getElementById('sidebar-placeholder').innerHTML = navHtml;
        document.getElementById('form-placeholder').innerHTML = formClientHtml;
        document.getElementById('form-compliance-placeholder').innerHTML = formComplianceHtml;
        document.getElementById('form-credentials-placeholder').innerHTML = formCredentialsHtml;
        
        initializeApplicationEngine();
    })
    .catch(error => {
        console.error("Critical Error: Unable to fetch fragments.", error);
    });
});

function initializeApplicationEngine() {
    initializeThemeEngine();
    initializeMobileNav();
    initializeMasterSearch();
    initializeAnalyticCharts();
    synchronizeSheetDatabase();
}

function initializeMobileNav() {
    const mobileBtn = document.getElementById('mobileNavToggle');
    const sidebar = document.getElementById('sidebar-placeholder');
    mobileBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    sidebar.addEventListener('click', (e) => {
        if(e.target.closest('.menu-item') && window.innerWidth <= 900) sidebar.classList.remove('open');
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

// TAB ROUTING
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
    } else if (tabName === 'compliances') {
        document.getElementById('navCompliances').classList.add('active');
        document.getElementById('pageTitle').innerText = "Compliances Management";
    } else if (tabName === 'credentials') {
        document.getElementById('navCredentials').classList.add('active');
        document.getElementById('pageTitle').innerText = "Credentials Vault";
    }
}

function initializeMasterSearch() {
    const searchInput = document.getElementById('dashboardMasterSearch');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filteredData = clientsDatabase.filter(client => {
            return (client.ClientName && client.ClientName.toLowerCase().includes(query)) ||
                   (client.ClientID && client.ClientID.toLowerCase().includes(query)) ||
                   (client.PanNo && client.PanNo.toLowerCase().includes(query));
        });
        renderTableRows(filteredData);
    });
}

// ==========================================
// SHEET SYNC & RENDERING (TRIPLE FETCH)
// ==========================================
function synchronizeSheetDatabase() {
    fetchClientsSheet();
    fetchCompliancesSheet();
    fetchCredentialsSheet();
}

function fetchClientsSheet() {
    const csvURL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Clients`;
    Papa.parse(csvURL, {
        download: true, header: true,
        complete: function(results) {
            clientsDatabase = results.data.filter(row => row.ClientID || row.ClientName);
            const countDisplay = document.getElementById('totalClientsCount');
            if(countDisplay) countDisplay.innerText = clientsDatabase.length;

            document.getElementById('tableStatus').style.display = 'none';
            document.getElementById('clientsTable').style.display = 'table';
            renderTableRows(clientsDatabase);
            populateClientDropdown(); 
        }
    });
}

function fetchCompliancesSheet() {
    const csvURL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Compliance`;
    Papa.parse(csvURL, {
        download: true, header: true,
        complete: function(results) {
            compliancesDatabase = results.data.filter(row => row.TaskID || row.ClientName);
            document.getElementById('complianceTableStatus').style.display = 'none';
            document.getElementById('compliancesTable').style.display = 'table';
            renderComplianceRows(compliancesDatabase);
        }
    });
}

function fetchCredentialsSheet() {
    const csvURL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Credentials`;
    Papa.parse(csvURL, {
        download: true, header: true,
        complete: function(results) {
            credentialsDatabase = results.data.filter(row => row.ClientName || row.PortalName);
            document.getElementById('credentialsTableStatus').style.display = 'none';
            document.getElementById('credentialsTable').style.display = 'table';
            renderCredentialsRows(credentialsDatabase);
        }
    });
}

function renderTableRows(dataToRender) {
    const tbody = document.getElementById('clientsTableBody');
    tbody.innerHTML = ""; 
    dataToRender.forEach((row) => {
        const realIndex = clientsDatabase.findIndex(c => c.ClientID === row.ClientID);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="client-name-cell">${row.ClientName || '-'}</td>
            <td><strong>${row.ClientID || '-'}</strong></td>
            <td>${row.MobileNo || '-'}</td>
            <td>${row.FolderLink ? `<a href="${row.FolderLink}" target="_blank" style="color: var(--accent);"><i class="fa-regular fa-folder-open"></i></a>` : '-'}</td>
            <td style="text-align: center;">
                <button class="btn-row-action" onclick="openEditModeModal(${realIndex})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderComplianceRows(dataToRender) {
    const tbody = document.getElementById('compliancesTableBody');
    tbody.innerHTML = ""; 
    dataToRender.forEach((row) => {
        let badgeColor = row.TaskStatus === 'Filed' || row.TaskStatus === 'Completed' ? 'color:#10b981; background:rgba(16,185,129,0.1)' : 
                         row.TaskStatus === 'In Progress' ? 'color:var(--accent); background:rgba(37,99,235,0.1)' : 'color:var(--text-muted); background:rgba(0,0,0,0.05)';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${row.TaskID || '-'}</strong></td>
            <td class="client-name-cell">${row.ClientName || '-'}</td>
            <td>${row.Task || '-'}</td>
            <td>${row.DueDate || '-'}</td>
            <td><span style="padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; ${badgeColor}">${row.TaskStatus || 'Pending'}</span></td>
            <td style="text-align: center;">
                <button class="btn-row-action" onclick="alert('View/Edit Compliance coming soon!')"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCredentialsRows(dataToRender) {
    const tbody = document.getElementById('credentialsTableBody');
    tbody.innerHTML = ""; 
    dataToRender.forEach((row) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="client-name-cell">${row.ClientName || '-'}</td>
            <td><strong>${row.PortalName || '-'}</strong></td>
            <td>${row.UserName || '-'}</td>
            <td>${row.RunningService || '-'}</td>
            <td>${row.ReturnFrequency || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// SHARED DROPDOWN LOGIC 
// ==========================================
function populateClientDropdown() {
    const compSelect = document.getElementById('c-clientname');
    const credSelect = document.getElementById('cred-clientname');
    
    let optionsHTML = '<option value="">Select Client...</option>';
    clientsDatabase.forEach(client => {
        if (client.ClientName) {
            optionsHTML += `<option value="${client.ClientName}" data-clientid="${client.ClientID}">${client.ClientName}</option>`;
        }
    });

    if(compSelect) compSelect.innerHTML = optionsHTML;
    if(credSelect) credSelect.innerHTML = optionsHTML;
}

// Compliance auto-fill
function autoFillClientID() {
    const select = document.getElementById('c-clientname');
    const idInput = document.getElementById('c-clientid');
    const selectedOption = select.options[select.selectedIndex];
    idInput.value = selectedOption && selectedOption.dataset.clientid ? selectedOption.dataset.clientid : '';
}

// Credentials auto-fill
function autoFillCredClientID() {
    const select = document.getElementById('cred-clientname');
    const idInput = document.getElementById('cred-clientid');
    const selectedOption = select.options[select.selectedIndex];
    idInput.value = selectedOption && selectedOption.dataset.clientid ? selectedOption.dataset.clientid : '';
}


// ==========================================
// COMPLIANCE TASK LOGIC
// ==========================================
function generateTaskID() {
    const yearStr = new Date().getFullYear().toString().slice(-2);
    const prefix = `T4${yearStr}`; 
    let maxSeq = 0;
    compliancesDatabase.forEach(task => {
        if(task.TaskID && task.TaskID.startsWith(prefix)) {
            let seq = parseInt(task.TaskID.replace(prefix, ''));
            if(!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
    });
    let nextSeq = (maxSeq + 1).toString().padStart(4, '0');
    return `${prefix}${nextSeq}`;
}

function openAddComplianceModal() {
    document.getElementById('addComplianceForm').reset();
    document.getElementById('c-formActionType').value = "CREATE";
    document.getElementById('c-taskid').value = generateTaskID(); 
    document.getElementById('complianceFormModalWrapper').style.display = 'flex';
}

function closeComplianceModal() { document.getElementById('complianceFormModalWrapper').style.display = 'none'; }

function commitComplianceTransaction() {
    const payload = {
        action: document.getElementById('c-formActionType').value,
        sheetTarget: "Compliance", 
        primaryKeyColumn: "TaskID", 
        data: {
            TaskID: document.getElementById('c-taskid').value,
            ClientID: document.getElementById('c-clientid').value,
            ClientName: document.getElementById('c-clientname').value,
            PortalName: document.getElementById('c-portalname').value,
            Task: document.getElementById('c-task').value,
            DateOfTask: document.getElementById('c-dateoftask').value,
            DueDate: document.getElementById('c-duedate').value,
            Priority: document.getElementById('c-priority').value,
            Amount: document.getElementById('c-amount').value,
            PaymentStatus: document.getElementById('c-paymentstatus').value,
            TaskStatus: document.getElementById('c-taskstatus').value,
            'Akn No': document.getElementById('c-aknno').value,
            DateofFiled: document.getElementById('c-dateoffiled').value,
            SupportingDocumentsLink: document.getElementById('c-documentslink').value,
            TaskLink: document.getElementById('c-tasklink').value,
            Notes: document.getElementById('c-notes').value
        }
    };

    if(!payload.data.ClientName || !payload.data.Task) return alert("Client Name and Task are required.");

    document.getElementById('complianceTableStatus').style.display = 'block';
    closeComplianceModal();

    fetch(APPS_SCRIPT_WEBAPP_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    }).then(() => setTimeout(() => { fetchCompliancesSheet(); alert("Task processed."); }, 2500));
}

// ==========================================
// CREDENTIALS LOGIC 
// ==========================================
function openAddCredentialsModal() {
    document.getElementById('addCredentialsForm').reset();
    document.getElementById('cred-formActionType').value = "CREATE";
    document.getElementById('credentialsFormModalWrapper').style.display = 'flex';
}

function closeCredentialsModal() { document.getElementById('credentialsFormModalWrapper').style.display = 'none'; }

function commitCredentialsTransaction() {
    const payload = {
        action: document.getElementById('cred-formActionType').value,
        sheetTarget: "Credentials", // Sends directly to the Credentials Tab
        primaryKeyColumn: "ClientID", 
        data: {
            ClientID: document.getElementById('cred-clientid').value,
            ClientName: document.getElementById('cred-clientname').value,
            PortalName: document.getElementById('cred-portalname').value,
            UserName: document.getElementById('cred-username').value,
            Password: document.getElementById('cred-password').value,
            RunningService: document.getElementById('cred-runningservice').value,
            ReturnFrequency: document.getElementById('cred-returnfrequency').value,
            Notes: document.getElementById('cred-notes').value
        }
    };

    if(!payload.data.ClientName || !payload.data.PortalName) return alert("Client Name and Portal Name are required.");

    document.getElementById('credentialsTableStatus').style.display = 'block';
    closeCredentialsModal();

    fetch(APPS_SCRIPT_WEBAPP_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    }).then(() => setTimeout(() => { fetchCredentialsSheet(); alert("Credentials saved securely."); }, 2500));
}

// ==========================================
// CLIENTS MODAL & API LOGIC
// ==========================================
function openCreateModeModal() {
    document.getElementById('addClientForm').reset();
    document.getElementById('formActionType').value = "CREATE";
    document.getElementById('f-clientid').value = "CMID-" + Math.floor(10000 + Math.random() * 90000);
    document.getElementById('modalFormTitle').innerText = "Add New Client Profile";
    document.getElementById('formModalWrapper').style.display = 'flex';
}

function openEditModeModal(index) {
    const record = clientsDatabase[index];
    document.getElementById('formActionType').value = "UPDATE";
    document.getElementById('modalFormTitle').innerText = `Update Profile: ${record.ClientName}`;
    document.getElementById('f-clientid').value = record.ClientID;
    document.getElementById('f-clientname').value = record.ClientName || '';
    document.getElementById('formModalWrapper').style.display = 'flex';
}

function closeFormModal() { document.getElementById('formModalWrapper').style.display = 'none'; }

function commitFormTransaction() {
    const payload = {
        action: document.getElementById('formActionType').value,
        sheetTarget: "Clients", 
        primaryKeyColumn: "ClientID",
        data: {
            ClientID: document.getElementById('f-clientid').value,
            ClientName: document.getElementById('f-clientname').value,
            LegalName: document.getElementById('f-legalname').value,
            MobileNo: document.getElementById('f-mobileno').value,
            Email: document.getElementById('f-email').value,
        }
    };
    
    closeFormModal();
    fetch(APPS_SCRIPT_WEBAPP_URL, {
        method: "POST", mode: "no-cors",
        body: JSON.stringify(payload)
    }).then(() => { setTimeout(() => fetchClientsSheet(), 2500); });
}

function initializeAnalyticCharts() {
    const ctx = document.getElementById('plChart').getContext('2d');
    new Chart(ctx, { type: 'line', data: { labels: ['Jan'], datasets: [{label: 'Income', data: [1200]}] } });
}
