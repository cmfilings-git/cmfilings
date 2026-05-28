const GOOGLE_SHEET_ID = '1oHkY3Vz9ZXdmXvZTVZCMa_tT8pp9ZrSWuo7ETKytF6s';

const APPS_SCRIPT_WEBAPP_URL =
'https://script.google.com/macros/s/AKfycbydiDiUrrMtMRCqLgLLJ6QgbQzc3YTyidhi1YiMXWJAvxQkk7rKkIzQqKI2F7SUgijx/exec';

// ======================================================
// DATABASES
// ======================================================

let clientsDatabase = [];
let compliancesDatabase = [];
let credentialsDatabase = [];

let currentSortCol = null;
let sortAscending = true;

// ======================================================
// APP INIT
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

```
Promise.all([

    fetch('nav.html').then(r => r.text()),
    fetch('form-client.html').then(r => r.text()),
    fetch('form-compliance.html').then(r => r.text()),
    fetch('form-credentials.html').then(r => r.text())

])

.then(([navHtml, clientHtml, complianceHtml, credentialsHtml]) => {

    document.getElementById('sidebar-placeholder').innerHTML = navHtml;

    document.getElementById('form-placeholder').innerHTML = clientHtml;

    document.getElementById('form-compliance-placeholder').innerHTML = complianceHtml;

    document.getElementById('form-credentials-placeholder').innerHTML = credentialsHtml;

    initializeApplication();

})

.catch(error => {
    console.error(error);
    alert("Unable to load application files.");
});
```

});

function initializeApplication() {

```
initializeTheme();

initializeMobileNav();

initializeMasterSearch();

initializeCharts();

synchronizeSheetDatabase();
```

}

// ======================================================
// THEME
// ======================================================

function initializeTheme() {

```
const btn = document.getElementById('themeToggleBtn');

btn.addEventListener('click', () => {

    if(document.body.getAttribute('data-theme') === 'dark') {

        document.body.removeAttribute('data-theme');

        btn.innerHTML = '<i class="fa-solid fa-moon"></i>';

    } else {

        document.body.setAttribute('data-theme', 'dark');

        btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
});
```

}

// ======================================================
// MOBILE NAV
// ======================================================

function initializeMobileNav() {

```
const btn = document.getElementById('mobileNavToggle');

const sidebar = document.getElementById('sidebar-placeholder');

btn.addEventListener('click', () => {

    sidebar.classList.toggle('open');

});

sidebar.addEventListener('click', (e) => {

    if(e.target.closest('.menu-item') && window.innerWidth <= 900) {

        sidebar.classList.remove('open');
    }
});
```

}

// ======================================================
// TAB ROUTING
// ======================================================

function switchTab(tabName) {

```
document.querySelectorAll('.view-container')
.forEach(el => el.classList.remove('active'));

document.querySelectorAll('.menu-item')
.forEach(el => el.classList.remove('active'));

document.getElementById(`view-${tabName}`).classList.add('active');

if(tabName === 'dashboard') {

    document.getElementById('navDashboard').classList.add('active');

    document.getElementById('pageTitle').innerText = 'Dashboard Overview';
}

if(tabName === 'clients') {

    document.getElementById('navClients').classList.add('active');

    document.getElementById('pageTitle').innerText = 'Clients';
}

if(tabName === 'compliances') {

    document.getElementById('navCompliances').classList.add('active');

    document.getElementById('pageTitle').innerText = 'Compliances';
}

if(tabName === 'credentials') {

    document.getElementById('navCredentials').classList.add('active');

    document.getElementById('pageTitle').innerText = 'Credentials';
}
```

}

// ======================================================
// MASTER SEARCH
// ======================================================

function initializeMasterSearch() {

```
const input = document.getElementById('dashboardMasterSearch');

input.addEventListener('input', (e) => {

    const query = e.target.value.toLowerCase().trim();

    const filteredClients = clientsDatabase.filter(row =>
        Object.values(row).some(v =>
            String(v).toLowerCase().includes(query)
        )
    );

    renderClientRows(filteredClients);

    const filteredCompliance = compliancesDatabase.filter(row =>
        Object.values(row).some(v =>
            String(v).toLowerCase().includes(query)
        )
    );

    renderComplianceRows(filteredCompliance);

    const filteredCredentials = credentialsDatabase.filter(row =>
        Object.values(row).some(v =>
            String(v).toLowerCase().includes(query)
        )
    );

    renderCredentialsRows(filteredCredentials);
});
```

}

// ======================================================
// FETCH SHEETS
// ======================================================

function synchronizeSheetDatabase() {

```
fetchClientsSheet();

fetchCompliancesSheet();

fetchCredentialsSheet();
```

}

function fetchClientsSheet() {

```
const url =
`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=CLIENTS`;

Papa.parse(url, {

    download: true,
    header: true,

    complete: function(results) {

        clientsDatabase =
        results.data.filter(r => r.ClientID);

        document.getElementById('totalClientsCount').innerText =
        clientsDatabase.length;

        document.getElementById('tableStatus').style.display = 'none';

        document.getElementById('clientsTable').style.display = 'table';

        renderClientRows(clientsDatabase);

        populateClientDropdown();
    }
});
```

}

function fetchCompliancesSheet() {

```
const url =
`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=COMPLIANCES`;

Papa.parse(url, {

    download: true,
    header: true,

    complete: function(results) {

        compliancesDatabase =
        results.data.filter(r => r.TaskID);

        document.getElementById('complianceTableStatus').style.display = 'none';

        document.getElementById('compliancesTable').style.display = 'table';

        renderComplianceRows(compliancesDatabase);
    }
});
```

}

function fetchCredentialsSheet() {

```
const url =
`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=CREDENTIALS`;

Papa.parse(url, {

    download: true,
    header: true,

    complete: function(results) {

        credentialsDatabase =
        results.data.filter(r => r.CredentialID);

        document.getElementById('credentialsTableStatus').style.display = 'none';

        document.getElementById('credentialsTable').style.display = 'table';

        renderCredentialsRows(credentialsDatabase);
    }
});
```

}

// ======================================================
// RENDER TABLES
// ======================================================

function renderClientRows(data) {

```
const tbody = document.getElementById('clientsTableBody');

tbody.innerHTML = '';

data.forEach(row => {

    const index =
    clientsDatabase.findIndex(r => r.ClientID === row.ClientID);

    const tr = document.createElement('tr');

    tr.innerHTML = `

        <td class="client-name-cell">${row.ClientName || '-'}</td>

        <td>${row.ClientID || '-'}</td>

        <td>${row.MobileNo || '-'}</td>

        <td>
            ${row.FolderLink
            ? `<a href="${row.FolderLink}" target="_blank">
                <i class="fa-regular fa-folder-open"></i>
               </a>`
            : '-'}
        </td>

        <td>
            <button class="btn-row-action"
            onclick="openEditModeModal(${index})">
            Edit
            </button>
        </td>
    `;

    tbody.appendChild(tr);
});
```

}

function renderComplianceRows(data) {

```
const tbody = document.getElementById('compliancesTableBody');

tbody.innerHTML = '';

data.forEach(row => {

    const tr = document.createElement('tr');

    tr.innerHTML = `

        <td>${row.TaskID || '-'}</td>

        <td>${row.ClientName || '-'}</td>

        <td>${row.Task || '-'}</td>

        <td>${row.DueDate || '-'}</td>

        <td>${row.TaskStatus || '-'}</td>

        <td>
            <button class="btn-row-action">
            Edit
            </button>
        </td>
    `;

    tbody.appendChild(tr);
});
```

}

function renderCredentialsRows(data) {

```
const tbody = document.getElementById('credentialsTableBody');

tbody.innerHTML = '';

data.forEach(row => {

    const tr = document.createElement('tr');

    tr.innerHTML = `

        <td>${row.ClientName || '-'}</td>

        <td>${row.PortalName || '-'}</td>

        <td>${row.UserName || '-'}</td>

        <td>${row.RunningService || '-'}</td>

        <td>${row.ReturnFrequency || '-'}</td>
    `;

    tbody.appendChild(tr);
});
```

}

// ======================================================
// DROPDOWNS
// ======================================================

function populateClientDropdown() {

```
let options = '<option value="">Select Client...</option>';

clientsDatabase.forEach(client => {

    options += `
    <option
        value="${client.ClientName}"
        data-clientid="${client.ClientID}">
        ${client.ClientName}
    </option>`;
});

const comp = document.getElementById('c-clientname');

const cred = document.getElementById('cred-clientname');

if(comp) comp.innerHTML = options;

if(cred) cred.innerHTML = options;
```

}

function autoFillClientID() {

```
const select = document.getElementById('c-clientname');

const idInput = document.getElementById('c-clientid');

const option = select.options[select.selectedIndex];

idInput.value = option.dataset.clientid || '';
```

}

function autoFillCredClientID() {

```
const select = document.getElementById('cred-clientname');

const idInput = document.getElementById('cred-clientid');

const option = select.options[select.selectedIndex];

idInput.value = option.dataset.clientid || '';
```

}

// ======================================================
// ID GENERATORS
// ======================================================

function generateTaskID() {

```
const year =
new Date().getFullYear().toString().slice(-2);

const prefix = `T4${year}`;

let max = 0;

compliancesDatabase.forEach(task => {

    if(task.TaskID && task.TaskID.startsWith(prefix)) {

        const seq =
        parseInt(task.TaskID.replace(prefix, ''));

        if(seq > max) max = seq;
    }
});

return prefix + String(max + 1).padStart(4, '0');
```

}

function generateCredentialID() {

```
let max = 4000;

credentialsDatabase.forEach(record => {

    if(record.CredentialID &&
       record.CredentialID.startsWith('CRED')) {

        const seq =
        parseInt(record.CredentialID.replace('CRED', ''));

        if(seq > max) max = seq;
    }
});

return 'CRED' + (max + 1);
```

}

// ======================================================
// CLIENT SAVE
// ======================================================

function openCreateModeModal() {

```
document.getElementById('addClientForm').reset();

document.getElementById('formActionType').value = 'CREATE';

document.getElementById('f-clientid').value =
'CMID-' + Math.floor(10000 + Math.random() * 90000);

document.getElementById('formModalWrapper').style.display = 'flex';
```

}

function closeFormModal() {

```
document.getElementById('formModalWrapper').style.display = 'none';
```

}

function commitFormTransaction() {

```
const payload = {

    action: document.getElementById('formActionType').value,

    sheetTarget: 'CLIENTS',

    primaryKeyColumn: 'ClientID',

    data: {

        ClientID:
        document.getElementById('f-clientid').value,

        ClientName:
        document.getElementById('f-clientname').value,

        MobileNo:
        document.getElementById('f-mobileno').value,

        FolderLink:
        document.getElementById('f-folderlink').value,

        Email:
        document.getElementById('f-email').value,

        Branch:
        document.getElementById('f-branch').value,

        Constitution:
        document.getElementById('f-constitution').value,

        GSTNo:
        document.getElementById('f-gstno').value,

        PanNo:
        document.getElementById('f-panno').value,

        AdharNo:
        document.getElementById('f-adharno').value,

        FathersName:
        document.getElementById('f-fathersname').value,

        'DOB/DOC':
        document.getElementById('f-dob').value,

        Address:
        document.getElementById('f-address').value,

        Notes:
        document.getElementById('f-notes').value,

        Reference:
        document.getElementById('f-reference').value
    }
};

fetch(APPS_SCRIPT_WEBAPP_URL, {

    method: 'POST',

    headers: {
        'Content-Type': 'application/json'
    },

    body: JSON.stringify(payload)

})

.then(() => {

    closeFormModal();

    setTimeout(fetchClientsSheet, 2000);
});
```

}

// ======================================================
// COMPLIANCE SAVE
// ======================================================

function openAddComplianceModal() {

```
document.getElementById('addComplianceForm').reset();

document.getElementById('c-taskid').value =
generateTaskID();

document.getElementById('complianceFormModalWrapper').style.display =
'flex';
```

}

function closeComplianceModal() {

```
document.getElementById('complianceFormModalWrapper').style.display =
'none';
```

}

function commitComplianceTransaction() {

```
const payload = {

    action: 'CREATE',

    sheetTarget: 'COMPLIANCES',

    primaryKeyColumn: 'TaskID',

    data: {

        TaskID:
        document.getElementById('c-taskid').value,

        ClientID:
        document.getElementById('c-clientid').value,

        ClientName:
        document.getElementById('c-clientname').value,

        PortalName:
        document.getElementById('c-portalname').value,

        Task:
        document.getElementById('c-task').value,

        DateOfTask:
        document.getElementById('c-dateoftask').value,

        DueDate:
        document.getElementById('c-duedate').value,

        Priority:
        document.getElementById('c-priority').value,

        SupportingDocumentsLink:
        document.getElementById('c-documentslink').value,

        Amount:
        document.getElementById('c-amount').value,

        PaymentStatus:
        document.getElementById('c-paymentstatus').value,

        TaskStatus:
        document.getElementById('c-taskstatus').value,

        Notes:
        document.getElementById('c-notes').value,

        AknNo:
        document.getElementById('c-aknno').value,

        DateofFiled:
        document.getElementById('c-dateoffiled').value,

        TaskDocLink:
        document.getElementById('c-tasklink').value
    }
};

fetch(APPS_SCRIPT_WEBAPP_URL, {

    method: 'POST',

    headers: {
        'Content-Type': 'application/json'
    },

    body: JSON.stringify(payload)

})

.then(() => {

    closeComplianceModal();

    setTimeout(fetchCompliancesSheet, 2000);
});
```

}

// ======================================================
// CREDENTIAL SAVE
// ======================================================

function openAddCredentialsModal() {

```
document.getElementById('addCredentialsForm').reset();

document.getElementById('cred-id').value =
generateCredentialID();

document.getElementById('credentialsFormModalWrapper').style.display =
'flex';
```

}

function closeCredentialsModal() {

```
document.getElementById('credentialsFormModalWrapper').style.display =
'none';
```

}

function commitCredentialsTransaction() {

```
const payload = {

    action: 'CREATE',

    sheetTarget: 'CREDENTIALS',

    primaryKeyColumn: 'CredentialID',

    data: {

        CredentialID:
        document.getElementById('cred-id').value,

        ClientID:
        document.getElementById('cred-clientid').value,

        ClientName:
        document.getElementById('cred-clientname').value,

        PortalName:
        document.getElementById('cred-portalname').value,

        UserName:
        document.getElementById('cred-username').value,

        Password:
        document.getElementById('cred-password').value,

        RunningService:
        document.getElementById('cred-runningservice').value,

        ReturnFrequency:
        document.getElementById('cred-returnfrequency').value,

        Notes:
        document.getElementById('cred-notes').value
    }
};

fetch(APPS_SCRIPT_WEBAPP_URL, {

    method: 'POST',

    headers: {
        'Content-Type': 'application/json'
    },

    body: JSON.stringify(payload)

})

.then(() => {

    closeCredentialsModal();

    setTimeout(fetchCredentialsSheet, 2000);
});
```

}

// ======================================================
// SORTING
// ======================================================

function sortClientTable(column) {

```
if(currentSortCol === column) {

    sortAscending = !sortAscending;

} else {

    currentSortCol = column;

    sortAscending = true;
}

clientsDatabase.sort((a,b) => {

    let A = (a[column] || '').toLowerCase();

    let B = (b[column] || '').toLowerCase();

    if(A < B) return sortAscending ? -1 : 1;

    if(A > B) return sortAscending ? 1 : -1;

    return 0;
});

renderClientRows(clientsDatabase);
```

}

// ======================================================
// CHART
// ======================================================

function initializeCharts() {

```
const ctx =
document.getElementById('plChart').getContext('2d');

new Chart(ctx, {

    type: 'line',

    data: {

        labels: ['Jan','Feb','Mar','Apr'],

        datasets: [{
            label: 'Income',
            data: [1200, 5000, 3000, 7000]
        }]
    }
});
```

}
