// ==========================================
// CORE GLOBAL DATA ROUTING CONFIGURATIONS
// ==========================================
const GOOGLE_SHEET_ID = '1oHkY3Vz9ZXdmXvZTVZCMa_tT8pp9ZrSWuo7ETKytF6s';
const SHEET_TAB_NAME = 'Clients';
const APPS_SCRIPT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxC5qy7BZrvi9x9M-vyUGNIym8mSBxz5f_-rk_EcvSOVd5flGBup1ynkSi2v7YYofh_/exec';

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
        document.getElementById('form-placeholder').innerHTML = formHtml; //
        
        initializeApplicationEngine();
    })
    .catch(error => console.error("Critical Runtime Framework Error loading isolated assets:", error));
});

function initializeApplicationEngine() {
    initializeThemeEngine();
    initializeMobileNav();
    initializeMasterSearch();
    synchronizeSheetDatabase();
}

// Mobile Nav Toggle Logic
function initializeMobileNav() {
    const mobileBtn = document.getElementById('mobileNavToggle');
    const sidebar = document.getElementById('sidebar-placeholder');
    
    mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar when a menu item is clicked on mobile
    sidebar.addEventListener('click', (e) => {
        if(e.target.closest('.menu-item') && window.innerWidth <= 900) {
            sidebar.classList.remove('open');
        }
    });
}

// Theme Engine Logic
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

// ==========================================
// SEARCH & SORT LOGIC
// ==========================================
function initializeMasterSearch() {
    const searchInput = document.getElementById('dashboardMasterSearch');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        // Filter the main database based on multiple relevant fields
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
    // Toggle sort direction if clicking the same column, otherwise default to ascending
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

    // Re-apply current search filter if any
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
// CRUD STORAGE SYNC HANDLING INTERFACES
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

            // Store globally for Search/Sort access
            clientsDatabase = data.filter(row => row.ClientID || row.ClientName);
            
            if(clientsDatabase.length === 0) {
                status.innerHTML = "<i class='fa-solid fa-triangle-exclamation'></i> Operational directory records empty.";
                return;
            }

            status.style.display = 'none';
            table.style.display = 'table';
            
            // Initial render
            renderTableRows(clientsDatabase);
        },
        error: function() {
            document.getElementById('tableStatus').innerHTML = "<i class='fa-solid fa-circle-xmark'></i> Parsing connection failed.";
        }
    });
}

function renderTableRows(dataToRender) {
    const tbody = document.getElementById('clientsTableBody');
    tbody.innerHTML = ""; 

    dataToRender.forEach((row) => {
        // Find actual index in main array for Edit/Delete/View operations to reference correct record
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
