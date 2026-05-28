import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBqbdmDKe6x_nWzkm6OwOX19QyJgCb7arM",
    authDomain: "cmfilings-firebase.firebaseapp.com",
    projectId: "cmfilings-firebase",
    storageBucket: "cmfilings-firebase.firebasestorage.app",
    messagingSenderId: "55459718043",
    appId: "1:55459718043:web:054cbd500c00ebf3cd373e"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const googleAppsScriptURL = "YOUR_SCRIPT_URL_HERE"; 

// --- STATE ---
let clientsDatabase = [];
let compliancesDatabase = [];
let credentialsDatabase = [];
let donutChartInstance = null;
let plChartInstance = null;
let globalSearchKeyword = "";
let currentEditDocId = null; 
let isEditMode = false;

// --- NAVIGATION LOGIC ---
// Since we have index.html and crm.html, we need to handle routing safely
window.navigateOrSwitch = function(tabName) {
    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    
    if(tabName === 'dashboard') {
        if(!isIndex) window.location.href = 'index.html';
        else switchLocalTab('dashboard');
    } else {
        if(isIndex) window.location.href = `crm.html#${tabName}`;
        else switchLocalTab(tabName);
    }
};

window.switchLocalTab = function(tabName) {
    document.querySelectorAll('.view-container, .menu-item').forEach(el => el.classList.remove('active'));
    
    const targetView = document.getElementById(`view-${tabName}`);
    if(targetView) targetView.classList.add('active');
    
    const navItem = document.getElementById(`nav-${tabName}`);
    if(navItem) navItem.classList.add('active');

    const titleMap = { 'dashboard': 'Dashboard Overview', 'clients': 'Clients Directory', 'compliances': 'Compliance Monitor', 'credentials': 'Authentication Vault' };
    const titleEl = document.getElementById('pageTitle');
    if(titleEl) titleEl.innerText = titleMap[tabName] || 'Overview';

    const sidebar = document.getElementById('sidebarMenu');
    const overlay = document.getElementById('sidebarOverlay');
    if(sidebar) sidebar.classList.remove('open');
    if(overlay) overlay.classList.remove('open');
    
    runLocalTableRenderFilters();
};

window.switchProfileTab = function(tabId) {
    document.querySelectorAll('.modal-tab, .modal-content-section').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`btn-${tabId}`).classList.add('active');
    document.getElementById(tabId).classList.add('active');

    const btnEdit = document.getElementById('btn-editProfile');
    const btnSave = document.getElementById('btn-saveProfile');
    if(btnEdit && btnSave) {
        if(tabId === 'tab-profile') {
            btnEdit.style.display = isEditMode ? 'none' : 'flex';
            btnSave.style.display = isEditMode ? 'flex' : 'none';
        } else {
            btnEdit.style.display = 'none';
            btnSave.style.display = 'none';
        }
    }
};

// --- CHARTS ---
function renderCharts(pendingCount, completedCount) {
    // Donut Chart (Dashboard only)
    const donutCtx = document.getElementById('complianceDonutChart');
    if(donutCtx) {
        if(donutChartInstance) donutChartInstance.destroy();
        const finalPending = (pendingCount === 0 && completedCount === 0) ? 1 : pendingCount;
        donutChartInstance = new Chart(donutCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Completed'],
                datasets: [{ data: [finalPending, completedCount], backgroundColor: ['#ef4444', '#10b981'], borderWidth: 2 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }
        });
    }

    // Line Chart (Dashboard only)
    const lineCtx = document.getElementById('plChart');
    if(lineCtx) {
        if(plChartInstance) plChartInstance.destroy();
        plChartInstance = new Chart(lineCtx.getContext('2d'), { 
            type: 'line', 
            data: { labels: ['Jan', 'Feb', 'Mar'], datasets: [{ label: 'Income', data:, borderColor: '#10b981', tension: 0.3 }] }, 
            options: { responsive: true, maintainAspectRatio: false } 
        });
    }
}

// --- DATA FETCHING ---
async function runGlobalSystemFetchIngress() {
    try {
        const [clientsSnap, compliancesSnap, credentialsSnap] = await Promise.all([
            getDocs(collection(db, "Clients")), getDocs(collection(db, "Compliances")), getDocs(collection(db, "Credentials"))
        ]);

        clientsDatabase = []; 
        clientsSnap.forEach(doc => clientsDatabase.push({ id: doc.id, ...doc.data() }));
        clientsDatabase.sort((a,b) => (parseInt((b.ClientID||"").replace("C",""))||0) - (parseInt((a.ClientID||"").replace("C",""))||0));
        
        const countClients = document.getElementById('totalClientsCount');
        if(countClients) countClients.innerText = clientsDatabase.length;

        compliancesDatabase = []; 
        let pendingCount = 0, completedCount = 0;
        compliancesSnap.forEach(doc => {
            const data = doc.data();
            compliancesDatabase.push({ id: doc.id, ...data });
            (data.TaskStatus||"").toLowerCase() === "completed" ? completedCount++ : pendingCount++;
        });
        
        const countComps = document.getElementById('totalCompliancesCount');
        if(countComps) countComps.innerText = compliancesDatabase.length;

        credentialsDatabase = []; 
        credentialsSnap.forEach(doc => credentialsDatabase.push({ id: doc.id, ...doc.data() }));
        
        const countCreds = document.getElementById('totalCredentialsCount');
        if(countCreds) countCreds.innerText = credentialsDatabase.length;

        renderCharts(pendingCount, completedCount);

        // Hide loaders, show tables (if they exist on the page)
        const tables = ['clientsTable', 'compliancesTable', 'credentialsTable'];
        tables.forEach(t => { 
            if(document.getElementById(t)) {
                document.getElementById(t).style.display = 'table';
                document.getElementById(t+'Status').style.display = 'none';
            }
        });

        runLocalTableRenderFilters();
    } catch (error) { console.error("Sync error:", error); }
}

// --- TABLE RENDERING & FILTERING ---
window.runLocalTableRenderFilters = function() {
    const searchLower = globalSearchKeyword.toLowerCase();

    // 1. Clients Table
    const clientBody = document.getElementById('clientsTableBody');
    if(clientBody) {
        clientBody.innerHTML = "";
        const selectedConst = document.getElementById('clientConstitutionFilter')?.value || "";
        let visibleRows = clientsDatabase.filter(row => {
            const matchesSearch = !searchLower || (row.ClientName||"").toLowerCase().includes(searchLower) || (row.ClientID||"").toLowerCase().includes(searchLower) || (row.GSTNo||"").toLowerCase().includes(searchLower);
            const matchesFilter = !selectedConst || row.Constitution === selectedConst;
            return matchesSearch && matchesFilter;
        });
        visibleRows.forEach((row) => {
            const exactIndex = clientsDatabase.findIndex(c => c.id === row.id);
            clientBody.innerHTML += `<tr><td>${row.ClientID||'-'}</td><td class="client-name-cell">${row.ClientName||'-'}</td><td>${row.MobileNo||'-'}</td><td>${row.Constitution||'-'}</td><td><button class="btn-expand" onclick="openViewModal(${exactIndex})">Open Panel</button></td></tr>`;
        });
    }

    // 2. Compliances Table
    const compBody = document.getElementById('compliancesTableBody');
    if(compBody) {
        compBody.innerHTML = "";
        const selectedStatus = document.getElementById('complianceStatusFilter')?.value || "";
        let visibleRows = compliancesDatabase.filter(row => {
            const matchesSearch = !searchLower || (row.ClientName||"").toLowerCase().includes(searchLower) || (row.ClientID||"").toLowerCase().includes(searchLower);
            const status = (row.TaskStatus || "").toLowerCase() === "completed" ? "Completed" : "Pending";
            return matchesSearch && (!selectedStatus || status === selectedStatus);
        });
        visibleRows.forEach((row) => {
            const isDone = (row.TaskStatus||"").toLowerCase() === "completed";
            const badge = isDone ? "#10b981" : "#ef4444";
            compBody.innerHTML += `<tr><td><strong>${row.TaskID||'-'}</strong></td><td>${row.ClientName||'-'}</td><td>${row.PortalName||'-'}</td><td>${row.Task||'-'}</td><td>${row.DueDate||'-'}</td><td><span style="color:${badge}; font-weight:600;">${isDone?'Completed':'Pending'}</span></td></tr>`;
        });
    }

    // 3. Credentials Table
    const credBody = document.getElementById('credentialsTableBody');
    if(credBody) {
        credBody.innerHTML = "";
        let visibleRows = credentialsDatabase.filter(row => !searchLower || (row.ClientName||"").toLowerCase().includes(searchLower) || (row.ClientID||"").toLowerCase().includes(searchLower));
        visibleRows.forEach((row) => {
            credBody.innerHTML += `<tr><td>${row.CredentialID||'-'}</td><td class="client-name-cell">${row.ClientName||'-'}</td><td>${row.PortalName||'-'}</td><td><code>${row.UserName||'-'}</code></td><td><input type="password" value="${row.Password||''}" readonly style="background:none; border:none;"></td></tr>`;
        });
    }
};

// --- MODALS (ADD & VIEW/EDIT) ---
window.openAddClientModal = () => { 
    let maxNumber = 40337; 
    clientsDatabase.forEach(client => {
        if (client.ClientID && client.ClientID.startsWith("C")) {
            let num = parseInt(client.ClientID.replace("C", ""));
            if (!isNaN(num) && num > maxNumber) maxNumber = num;
        }
    });
    document.getElementById('add-clientid').value = "C" + (maxNumber + 1); 
    document.getElementById('addClientModal').style.display = 'flex'; 
};

window.closeAddClientModal = () => { 
    document.getElementById('addClientModal').style.display = 'none'; 
    document.getElementById('addClientForm').reset(); 
};

window.openViewModal = (index) => {
    const client = clientsDatabase[index];
    currentEditDocId = client.id; 
    isEditMode = false; 

    const fields = ['clientid', 'clientname', 'mobileno', 'email', 'folderlink', 'constitution', 'branch', 'gstno', 'panno', 'fathersname', 'reference', 'notes', 'address'];
    fields.forEach(f => {
        const el = document.getElementById(`vd-${f}`);
        if(el) el.value = client[f === 'clientid' ? 'ClientID' : f === 'mobileno' ? 'MobileNo' : f === 'folderlink' ? 'FolderLink' : f === 'clientname' ? 'ClientName' : f === 'gstno' ? 'GSTNo' : f === 'panno' ? 'PanNo' : f === 'fathersname' ? 'FathersName' : f.charAt(0).toUpperCase() + f.slice(1)] || '';
    });
    
    document.getElementById('vd-adharno').value = "[Aadhaar Redacted]"; 
    document.getElementById('vd-dob').value = client.DOB_DOC || client['DOB/DOC'] || '';
    document.getElementById('vd-timestamp').value = client.TimeStamp || '';

    document.querySelectorAll('#editClientForm .edit-input').forEach(input => {
        if(input.id !== 'vd-clientid' && input.id !== 'vd-timestamp') {
            input.readOnly = true;
            input.classList.remove('editable');
        }
    });

    document.getElementById('btn-editProfile').style.display = 'flex';
    document.getElementById('btn-saveProfile').style.display = 'none';

    // Populate Sub-tables
    const compBody = document.getElementById('linkedCompliancesBody');
    if(compBody) {
        compBody.innerHTML = "";
        const clientComps = compliancesDatabase.filter(c => c.ClientID === client.ClientID);
        if(clientComps.length) {
            clientComps.forEach(c => {
                const color = (c.TaskStatus||"").toLowerCase() === 'completed' ? '#10b981' : '#ef4444';
                compBody.innerHTML += `<tr><td>${c.TaskID||'-'}</td><td>${c.PortalName||'-'}</td><td>${c.Task||'-'}</td><td style="color:${color}; font-weight:bold;">${c.TaskStatus||'Pending'}</td></tr>`;
            });
        } else { compBody.innerHTML = `<tr><td colspan="4" class="status-msg">No compliances linked.</td></tr>`; }
    }

    const credBody = document.getElementById('linkedCredentialsBody');
    if(credBody) {
        credBody.innerHTML = "";
        const clientCreds = credentialsDatabase.filter(c => c.ClientID === client.ClientID);
        if(clientCreds.length) {
            clientCreds.forEach(c => {
                credBody.innerHTML += `<tr><td>${c.PortalName||'-'}</td><td><code>${c.UserName||'-'}</code></td><td><input type="password" value="${c.Password||''}" readonly style="background:none; border:none;"></td></tr>`;
            });
        } else { credBody.innerHTML = `<tr><td colspan="3" class="status-msg">No credentials stored.</td></tr>`; }
    }

    switchProfileTab('tab-profile');
    document.getElementById('viewClientModal').style.display = 'flex';
};

window.toggleEditMode = () => {
    isEditMode = true;
    document.querySelectorAll('#editClientForm .edit-input').forEach(input => {
        if(input.id !== 'vd-clientid' && input.id !== 'vd-timestamp' && input.id !== 'vd-adharno') {
            input.readOnly = false;
            input.classList.add('editable');
        }
    });
    document.getElementById('btn-editProfile').style.display = 'none';
    document.getElementById('btn-saveProfile').style.display = 'flex';
};

window.saveClientChanges = async () => {
    if(!currentEditDocId) return;
    const btn = document.getElementById('btn-saveProfile');
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
    btn.disabled = true;

    const now = new Date();
    const timeStampStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getFullYear()} [${now.getHours()}:${now.getMinutes()}] (Edited)`;

    const updatedData = {
        ClientName: document.getElementById('vd-clientname').value, MobileNo: document.getElementById('vd-mobileno').value,
        Email: document.getElementById('vd-email').value, FolderLink: document.getElementById('vd-folderlink').value,
        Constitution: document.getElementById('vd-constitution').value, Branch: document.getElementById('vd-branch').value,
        GSTNo: document.getElementById('vd-gstno').value, PanNo: document.getElementById('vd-panno').value,
        FathersName: document.getElementById('vd-fathersname').value, DOB_DOC: document.getElementById('vd-dob').value,
        Address: document.getElementById('vd-address').value, Reference: document.getElementById('vd-reference').value,
        Notes: document.getElementById('vd-notes').value, TimeStamp: timeStampStr
    };

    try {
        await updateDoc(doc(db, "Clients", currentEditDocId), updatedData);
        alert("Client updated!");
        document.getElementById('viewClientModal').style.display = 'none';
        runGlobalSystemFetchIngress(); 
    } catch (error) { alert("Error: " + error.message); } 
    finally { btn.innerHTML = '<i class="fa-solid fa-check"></i> Save Changes'; btn.disabled = false; }
};

window.closeViewModal = () => { document.getElementById('viewClientModal').style.display = 'none'; };

// Add Client to Firebase
window.submitClient = async () => {
    const btn = document.getElementById('btn-submitClient');
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
    btn.disabled = true;

    const now = new Date();
    const timeStampStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getFullYear()} [${now.getHours()}:${now.getMinutes()}]`;

    const clientData = {
        ClientID: document.getElementById('add-clientid').value, ClientName: document.getElementById('add-clientname').value,
        MobileNo: document.getElementById('add-mobileno').value, FolderLink: document.getElementById('add-folderlink').value,
        Email: document.getElementById('add-email').value, Branch: document.getElementById('add-branch').value,
        Constitution: document.getElementById('add-constitution').value, GSTNo: document.getElementById('add-gstno').value,
        PanNo: document.getElementById('add-panno').value, AdharNo: document.getElementById('add-adharno').value,
        FathersName: document.getElementById('add-fathersname').value, DOB_DOC: document.getElementById('add-dob').value,
        Address: document.getElementById('add-address').value, Reference: document.getElementById('add-reference').value,
        Notes: document.getElementById('add-notes').value, TimeStamp: timeStampStr
    };

    try {
        await addDoc(collection(db, "Clients"), clientData);
        if (googleAppsScriptURL !== "YOUR_SCRIPT_URL_HERE") {
            await fetch(googleAppsScriptURL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clientData) });
        }
        alert(`Success! Client Saved.`);
        closeAddClientModal();
        runGlobalSystemFetchIngress();
    } catch (error) { alert("Error: " + error.message); } 
    finally { btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Save Client'; btn.disabled = false; }
};

// --- GLOBAL LISTENERS ---
window.addEventListener('DOMContentLoaded', () => {
    runGlobalSystemFetchIngress();
    
    // Hash router
    if(window.location.hash) {
        const tab = window.location.hash.substring(1);
        switchLocalTab(tab);
    }

    // Setup Theme, Search, and Mobile Listeners if elements exist
    const themeBtn = document.getElementById('themeToggleBtn');
    if(themeBtn) themeBtn.addEventListener('click', () => {
        document.body.toggleAttribute('data-theme', 'dark');
        themeBtn.querySelector('i').className = document.body.hasAttribute('data-theme') ? "fa-solid fa-sun" : "fa-solid fa-moon";
    });

    const searchBtn = document.getElementById('executeSearchBtn');
    const searchInput = document.getElementById('globalSearchInput');
    if(searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => { globalSearchKeyword = searchInput.value; runLocalTableRenderFilters(); });
        searchInput.addEventListener('keyup', (e) => { if(e.key === 'Enter') { globalSearchKeyword = e.target.value; runLocalTableRenderFilters(); }});
    }

    const constFilter = document.getElementById('clientConstitutionFilter');
    if(constFilter) constFilter.addEventListener('change', runLocalTableRenderFilters);
    const statusFilter = document.getElementById('complianceStatusFilter');
    if(statusFilter) statusFilter.addEventListener('change', runLocalTableRenderFilters);

    const toggleSidebar = document.getElementById('toggleSidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menu = document.getElementById('sidebarMenu');
    if(toggleSidebar && menu && overlay) {
        toggleSidebar.addEventListener('click', () => { menu.classList.add('open'); overlay.classList.add('open'); });
        closeSidebar.addEventListener('click', () => { menu.classList.remove('open'); overlay.classList.remove('open'); });
        overlay.addEventListener('click', () => { menu.classList.remove('open'); overlay.classList.remove('open'); });
    }
});
