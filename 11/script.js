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

// --- ROBUST NAVIGATION LOGIC ---
window.navigateOrSwitch = function(tabName) {
    if (tabName === 'dashboard') {
        if (document.getElementById('view-dashboard')) switchLocalTab('dashboard');
        else window.location.href = 'index.html';
    } else {
        if (document.getElementById(`view-${tabName}`)) switchLocalTab(tabName);
        else window.location.href = `crm.html#${tabName}`;
    }
};

window.switchLocalTab = function(tabName) {
    document.querySelectorAll('.view-container, .menu-item').forEach(el => el.classList.remove('active'));
    
    const targetView = document.getElementById(`view-${tabName}`);
    if(targetView) targetView.classList.add('active');
    
    // Dynamic mapping to exact HTML IDs
    const navIdMap = { 'dashboard': 'nav-dashboard', 'clients': 'nav-clients', 'compliances': 'nav-compliances', 'credentials': 'nav-credentials' };
    const navItem = document.getElementById(navIdMap[tabName]);
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
    const donutCtx = document.getElementById('complianceDonutChart');
    if(donutCtx && typeof Chart !== 'undefined') {
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

    const lineCtx = document.getElementById('plChart');
    if(lineCtx && typeof Chart !== 'undefined') {
        if(plChartInstance) plChartInstance.destroy();
        plChartInstance = new Chart(lineCtx.getContext('2d'), { 
            type: 'line', 
            data: { 
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], 
                datasets: [{ 
                    label: 'Income', 
                    data:, 
                    borderColor: '#10b981', 
                    backgroundColor: 'rgba(16,185,129,0.08)', 
                    fill: true, 
                    tension: 0.3 
                }] 
            }, 
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

        const tables = ['clientsTable', 'compliancesTable', 'credentialsTable'];
        tables.forEach(t => { 
            const tableEl = document.getElementById(t);
            const statusEl = document.getElementById(t+'Status');
            if(tableEl && statusEl) {
                tableEl.style.display = 'table';
                statusEl.style.display = 'none';
            }
        });

        runLocalTableRenderFilters();
    } catch (error) { 
        console.error("Sync error:", error); 
    }
}

// --- TABLE RENDERING & FILTERING ---
window.runLocalTableRenderFilters = function() {
    const searchLower = globalSearchKeyword.toLowerCase();

    // 1. Clients Table
    const clientBody = document.getElementById('clientsTableBody');
    if(clientBody) {
        const constFilterEl = document.getElementById('clientConstitutionFilter');
        const selectedConst = constFilterEl ? constFilterEl.value : "";
        let htmlBuffer = "";

        let visibleRows = clientsDatabase.filter(row => {
            const matchesSearch = !searchLower || (row.ClientName||"").toLowerCase().includes(searchLower) || (row.ClientID||"").toLowerCase().includes(searchLower) || (row.GSTNo||"").toLowerCase().includes(searchLower);
            const matchesFilter = !selectedConst || row.Constitution === selectedConst;
            return matchesSearch && matchesFilter;
        });

        visibleRows.forEach((row) => {
            const exactIndex = clientsDatabase.findIndex(c => c.id === row.id);
            htmlBuffer += `<tr><td>${row.ClientID||'-'}</td><td class="client-name-cell">${row.ClientName||'-'}</td><td>${row.MobileNo||'-'}</td><td>${row.Constitution||'-'}</td><td><button class="btn-expand" onclick="openViewModal(${exactIndex})">Open Profile</button></td></tr>`;
        });
        clientBody.innerHTML = htmlBuffer;
    }

    // 2. Compliances Table
    const compBody = document.getElementById('compliancesTableBody');
    if(compBody) {
        const statFilterEl = document.getElementById('complianceStatusFilter');
        const selectedStatus = statFilterEl ? statFilterEl.value : "";
        let htmlBuffer = "";

        let visibleRows = compliancesDatabase.filter(row => {
            const matchesSearch = !searchLower || (row.ClientName||"").toLowerCase().includes(searchLower) || (row.ClientID||"").toLowerCase().includes(searchLower);
            const status = (row.TaskStatus || "Pending").toLowerCase() === "completed" ? "Completed" : "Pending";
            return matchesSearch && (!selectedStatus || status === selectedStatus);
        });

        visibleRows.forEach((row) => {
            const isDone = (row.TaskStatus||"").toLowerCase() === "completed";
            const badge = isDone ? "#10b981" : "#ef4444";
            htmlBuffer += `<tr><td><strong>${row.TaskID||'-'}</strong></td><td>${row.ClientName||'-'}</td><td>${row.PortalName||'-'}</td><td>${row.Task||'-'}</td><td>${row.DueDate||'-'}</td><td><span style="color:${badge}; font-weight:600;">${isDone?'Completed':'Pending'}</span></td></tr>`;
        });
        compBody.innerHTML = htmlBuffer;
    }

    // 3. Credentials Table
    const credBody = document.getElementById('credentialsTableBody');
    if(credBody) {
        let htmlBuffer = "";
        let visibleRows = credentialsDatabase.filter(row => !searchLower || (row.ClientName||"").toLowerCase().includes(searchLower) || (row.ClientID||"").toLowerCase().includes(searchLower));
        visibleRows.forEach((row) => {
            htmlBuffer += `<tr><td>${row.CredentialID||'-'}</td><td class="client-name-cell">${row.ClientName||'-'}</td><td>${row.PortalName||'-'}</td><td><code>${row.UserName||'-'}</code></td><td><input type="password" value="••••••••" readonly style="background:none; border:none; outline:none;"></td></tr>`;
        });
        credBody.innerHTML = htmlBuffer;
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
    const idField = document.getElementById('add-clientid');
    if (idField) idField.value = "C" + (maxNumber + 1); 
    
    const modal = document.getElementById('addClientModal');
    if (modal) {
        modal.style.display = 'flex'; 
        document.body.style.overflow = 'hidden';
    }
};

window.closeAddClientModal = () => { 
    const modal = document.getElementById('addClientModal');
    if (modal) modal.style.display = 'none'; 
    document.body.style.overflow = ''; 
    const form = document.getElementById('addClientForm');
    if (form) form.reset(); 
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
    
    const adharEl = document.getElementById('vd-adharno');
    if(adharEl) adharEl.value = client.AdharNo || ''; 
    
    const dobEl = document.getElementById('vd-dob');
    if(dobEl) dobEl.value = client['DOB/DOC'] || client.DOB_DOC || ''; 
    
    const timeEl = document.getElementById('vd-timestamp');
    if(timeEl) timeEl.value = client.TimeStamp || '';

    document.querySelectorAll('#editClientForm .edit-input').forEach(input => {
        if(input.id !== 'vd-clientid' && input.id !== 'vd-timestamp') {
            input.readOnly = true;
            input.classList.remove('editable');
        }
    });

    const btnEdit = document.getElementById('btn-editProfile');
    const btnSave = document.getElementById('btn-saveProfile');
    if(btnEdit) btnEdit.style.display = 'flex';
    if(btnSave) btnSave.style.display = 'none';

    // Populate Sub-tables safely
    const compBody = document.getElementById('linkedCompliancesBody');
    if(compBody) {
        let htmlBuffer = "";
        const clientComps = compliancesDatabase.filter(c => c.ClientID === client.ClientID);
        if(clientComps.length) {
            clientComps.forEach(c => {
                const color = (c.TaskStatus||"").toLowerCase() === 'completed' ? '#10b981' : '#ef4444';
                htmlBuffer += `<tr><td>${c.TaskID||'-'}</td><td>${c.PortalName||'-'}</td><td>${c.Task||'-'}</td><td style="color:${color}; font-weight:bold;">${c.TaskStatus||'Pending'}</td></tr>`;
            });
        } else { htmlBuffer = `<tr><td colspan="4" class="status-msg">No compliances linked.</td></tr>`; }
        compBody.innerHTML = htmlBuffer;
    }

    const credBody = document.getElementById('linkedCredentialsBody');
    if(credBody) {
        let htmlBuffer = "";
        const clientCreds = credentialsDatabase.filter(c => c.ClientID === client.ClientID);
        if(clientCreds.length) {
            clientCreds.forEach(c => {
                htmlBuffer += `<tr><td>${c.PortalName||'-'}</td><td><code>${c.UserName||'-'}</code></td><td><input type="password" value="••••••••" readonly style="background:none; border:none; outline:none;"></td></tr>`;
            });
        } else { htmlBuffer = `<tr><td colspan="3" class="status-msg">No credentials stored.</td></tr>`; }
        credBody.innerHTML = htmlBuffer;
    }

    switchProfileTab('tab-profile');
    const viewModal = document.getElementById('viewClientModal');
    if(viewModal) {
        viewModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
    }
};

window.toggleEditMode = () => {
    isEditMode = true;
    document.querySelectorAll('#editClientForm .edit-input').forEach(input => {
        if(input.id !== 'vd-clientid' && input.id !== 'vd-timestamp') {
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
        ClientName: document.getElementById('vd-clientname').value, 
        MobileNo: document.getElementById('vd-mobileno').value,
        Email: document.getElementById('vd-email').value, 
        FolderLink: document.getElementById('vd-folderlink').value,
        Constitution: document.getElementById('vd-constitution').value, 
        Branch: document.getElementById('vd-branch').value,
        GSTNo: document.getElementById('vd-gstno').value, 
        PanNo: document.getElementById('vd-panno').value,
        AdharNo: document.getElementById('vd-adharno').value,
        FathersName: document.getElementById('vd-fathersname').value, 
        "DOB/DOC": document.getElementById('vd-dob').value,
        Address: document.getElementById('vd-address').value, 
        Reference: document.getElementById('vd-reference').value,
        Notes: document.getElementById('vd-notes').value, 
        TimeStamp: timeStampStr
    };

    try {
        await updateDoc(doc(db, "Clients", currentEditDocId), updatedData);
        alert("Client updated successfully!");
        closeViewModal();
        runGlobalSystemFetchIngress(); 
    } catch (error) { 
        alert("Error: " + error.message); 
    } finally { 
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Save Changes'; 
        btn.disabled = false; 
    }
};

window.closeViewModal = () => { 
    const modal = document.getElementById('viewClientModal');
    if(modal) modal.style.display = 'none'; 
    document.body.style.overflow = ''; 
};

// Add Client to Firebase
window.submitClient = async () => {
    const btn = document.getElementById('btn-submitClient');
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
    btn.disabled = true;

    const now = new Date();
    const timeStampStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getFullYear()} [${now.getHours()}:${now.getMinutes()}]`;

    const clientData = {
        ClientID: document.getElementById('add-clientid').value, 
        ClientName: document.getElementById('add-clientname').value,
        MobileNo: document.getElementById('add-mobileno').value, 
        FolderLink: document.getElementById('add-folderlink').value,
        Email: document.getElementById('add-email').value, 
        Branch: document.getElementById('add-branch').value,
        Constitution: document.getElementById('add-constitution').value, 
        GSTNo: document.getElementById('add-gstno').value,
        PanNo: document.getElementById('add-panno').value, 
        AdharNo: document.getElementById('add-adharno').value,
        FathersName: document.getElementById('add-fathersname').value, 
        "DOB/DOC": document.getElementById('add-dob').value,
        Address: document.getElementById('add-address').value, 
        Reference: document.getElementById('add-reference').value,
        Notes: document.getElementById('add-notes').value, 
        TimeStamp: timeStampStr
    };

    try {
        await addDoc(collection(db, "Clients"), clientData);
        
        if (googleAppsScriptURL !== "YOUR_SCRIPT_URL_HERE") {
            await fetch(googleAppsScriptURL, { 
                method: 'POST', 
                mode: 'no-cors', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({
                    action: "CREATE",
                    sheetTarget: "CLIENTS",
                    primaryKeyColumn: "ClientID",
                    data: clientData
                }) 
            });
        }
        
        alert(`Success! Client Saved.`);
        closeAddClientModal();
        runGlobalSystemFetchIngress();
    } catch (error) { 
        alert("Error: " + error.message); 
    } finally { 
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Save Client'; 
        btn.disabled = false; 
    }
};

// --- GLOBAL LISTENERS ---
window.addEventListener('DOMContentLoaded', () => {
    runGlobalSystemFetchIngress();
    
    if(window.location.hash) {
        const tab = window.location.hash.substring(1);
        if (document.getElementById(`view-${tab}`)) {
            switchLocalTab(tab);
        }
    }

    const themeBtn = document.getElementById('themeToggleBtn');
    if(themeBtn) themeBtn.addEventListener('click', () => {
        document.body.toggleAttribute('data-theme', 'dark');
        themeBtn.querySelector('i').className = document.body.hasAttribute('data-theme') ? "fa-solid fa-sun" : "fa-solid fa-moon";
    });

    const searchInput = document.getElementById('globalSearchInput');
    const searchBtn = document.getElementById('executeSearchBtn');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => { 
            globalSearchKeyword = e.target.value; 
            runLocalTableRenderFilters(); 
        });
    }
    if(searchBtn) {
        searchBtn.addEventListener('click', () => { 
            if(searchInput) globalSearchKeyword = searchInput.value; 
            runLocalTableRenderFilters(); 
        });
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
