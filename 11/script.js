import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ENGINE APP SETUP
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

// Memory State Pools
let clientsDatabase = [];
let compliancesDatabase = [];
let credentialsDatabase = [];

// Screen Filtered Data State (Used for Exports)
let activeClients = [];
let activeCompliances = [];
let activeCredentials = [];

let donutChartInstance = null;
let globalSearchKeyword = "";

// Sorting State Config
let sortConfigs = {
    clients: { key: 'ClientID', dir: 'desc' },
    compliances: { key: 'TaskID', dir: 'desc' },
    credentials: { key: 'CredentialID', dir: 'desc' }
};

// Edit Operation Tracking State
window.currentEditMode = {
    collection: null,
    firebaseId: null
};

// --- NAVIGATION TABS ---
window.switchTab = function(tabName) {
    document.querySelectorAll('.view-container, .menu-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${tabName}`).classList.add('active');
    
    const sidebarTargetMap = { 'dashboard': 'navDashboard', 'clients': 'navClients', 'compliances': 'navCompliances', 'credentials': 'navCredentials' };
    if(sidebarTargetMap[tabName]) document.getElementById(sidebarTargetMap[tabName]).classList.add('active');

    const headerMap = { 'dashboard': 'Dashboard Overview', 'clients': 'Clients Master Registry', 'compliances': 'Compliance Monitor', 'credentials': 'Authentication Vault' };
    document.getElementById('pageTitle').innerText = headerMap[tabName] || "CMFilings";

    document.getElementById('sidebarMenu').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
    runLocalTableRenderFilters();
};

// --- CHART ENGINE ---
function renderComplianceDonutChart(pendingCount, completedCount) {
    const el = document.getElementById('complianceDonutChart');
    if(!el) return;
    if(donutChartInstance) donutChartInstance.destroy();

    const finalPending = (pendingCount === 0 && completedCount === 0) ? 1 : pendingCount;
    donutChartInstance = new Chart(el.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Completed'],
            datasets: [{ data: [finalPending, completedCount], backgroundColor: ['#ef4444', '#10b981'], borderWidth: 2 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom' } } }
    });
}

// --- DATA SORTING LOGIC ---
window.handleSort = function(tableName, colKey) {
    const currentDir = sortConfigs[tableName].dir;
    const isSameCol = sortConfigs[tableName].key === colKey;
    
    if (isSameCol) {
        sortConfigs[tableName].dir = currentDir === 'asc' ? 'desc' : 'asc';
    } else {
        sortConfigs[tableName].key = colKey;
        sortConfigs[tableName].dir = 'asc';
    }

    document.querySelectorAll(`th[id^="th-${tableName}"]`).forEach(th => {
        th.classList.remove('active-sort');
        th.querySelector('i').className = "fa-solid fa-sort";
    });
    const activeTh = document.getElementById(`th-${tableName}-${colKey}`);
    if (activeTh) {
        activeTh.classList.add('active-sort');
        activeTh.querySelector('i').className = sortConfigs[tableName].dir === 'asc' ? "fa-solid fa-sort-up" : "fa-solid fa-sort-down";
    }

    runLocalTableRenderFilters();
};

function sortDataArray(dataArray, config) {
    return dataArray.sort((a, b) => {
        let valA = a[config.key] || "";
        let valB = b[config.key] || "";
        
        const numA = parseInt(String(valA).replace(/[^0-9]/g, ''));
        const numB = parseInt(String(valB).replace(/[^0-9]/g, ''));
        
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
             valA = numA; valB = numB;
        } else {
             if(typeof valA === 'string') valA = valA.toLowerCase();
             if(typeof valB === 'string') valB = valB.toLowerCase();
        }

        if (valA < valB) return config.dir === 'asc' ? -1 : 1;
        if (valA > valB) return config.dir === 'asc' ? 1 : -1;
        return 0;
    });
}

// --- UI HELPERS (Password Toggle & Copy) ---
window.togglePassword = function(id) {
    const input = document.getElementById(id);
    const icon = input.nextElementSibling.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

window.copyToClipboard = function(text) {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy: ', err);
    });
};

// --- RENDER FILTER ENGINE ---
window.runLocalTableRenderFilters = function() {
    const searchLower = globalSearchKeyword.toLowerCase();

    // 1. Clients Rendering
    const clientBody = document.getElementById('clientsTableBody');
    if (clientBody) {
        clientBody.innerHTML = "";
        const selectedConst = document.getElementById('clientConstitutionFilter').value;
        
        let filteredClients = clientsDatabase.filter(row => {
            const matchSearch = !searchLower || (row.ClientName||"").toLowerCase().includes(searchLower) || (row.ClientID||"").toLowerCase().includes(searchLower) || (row.GSTNo||"").toLowerCase().includes(searchLower);
            const matchFilter = !selectedConst || row.Constitution === selectedConst;
            return matchSearch && matchFilter;
        });
        
        activeClients = sortDataArray(filteredClients, sortConfigs.clients);
        
        activeClients.forEach(row => {
            clientBody.innerHTML += `
                <tr>
                    <td>${row.ClientID || '-'}</td>
                    <td class="client-name-cell">${row.ClientName || '-'}</td>
                    <td>${row.MobileNo || '-'}</td>
                    <td>${row.Constitution || '-'}</td>
                    <td>
                        <div class="action-group">
                            <button class="btn-action btn-edit" onclick="editData('Clients', '${row.id}')"><i class="fa-solid fa-pen"></i></button>
                        </div>
                    </td>
                </tr>`;
        });
    }

    // 2. Compliances Rendering
    const complianceBody = document.getElementById('compliancesTableBody');
    if (complianceBody) {
        complianceBody.innerHTML = "";
        const selectedStatus = document.getElementById('complianceStatusFilter').value;

        let filteredCompliances = compliancesDatabase.filter(row => {
            const normStatus = (row.TaskStatus||"").toLowerCase() === "completed" ? "Completed" : "Pending";
            const matchSearch = !searchLower || (row.ClientName||"").toLowerCase().includes(searchLower) || (row.ClientID||"").toLowerCase().includes(searchLower) || (row.PortalName||"").toLowerCase().includes(searchLower);
            const matchFilter = !selectedStatus || normStatus === selectedStatus;
            return matchSearch && matchFilter;
        });

        activeCompliances = sortDataArray(filteredCompliances, sortConfigs.compliances);
        
        activeCompliances.forEach(row => {
            const normStatus = (row.TaskStatus||"").toLowerCase() === "completed" ? "Completed" : "Pending";
            const color = normStatus === "Completed" ? "#10b981" : "#ef4444";
            complianceBody.innerHTML += `
                <tr>
                    <td><strong>${row.TaskID || '-'}</strong></td>
                    <td>${row.ClientName || '-'} <br><small style="color:var(--text-muted); font-size:10px;">${row.ClientID || ''}</small></td>
                    <td>${row.PortalName || '-'}</td>
                    <td>${row.Task || '-'}</td>
                    <td>${row.DueDate || '-'}</td>
                    <td><span style="color:${color}; font-weight:600;"><i class="fa-solid fa-circle" style="font-size:8px;"></i> ${normStatus}</span></td>
                    <td><button class="btn-action btn-edit" onclick="editData('Compliances', '${row.id}')"><i class="fa-solid fa-pen"></i></button></td>
                </tr>`;
        });
    }

    // 3. Credentials Rendering
    const credentialBody = document.getElementById('credentialsTableBody');
    if (credentialBody) {
        credentialBody.innerHTML = "";
        const selectedPortal = document.getElementById('credentialsPortalFilter').value;

        let filteredCredentials = credentialsDatabase.filter(row => {
            const matchSearch = !searchLower || (row.ClientName||"").toLowerCase().includes(searchLower) || (row.ClientID||"").toLowerCase().includes(searchLower) || (row.UserName||"").toLowerCase().includes(searchLower);
            const matchFilter = !selectedPortal || (row.PortalName||"").includes(selectedPortal);
            return matchSearch && matchFilter;
        });

        activeCredentials = sortDataArray(filteredCredentials, sortConfigs.credentials);
        
        activeCredentials.forEach(row => {
            credentialBody.innerHTML += `
                <tr>
                    <td>${row.CredentialID || '-'}</td>
                    <td class="client-name-cell">${row.ClientName || '-'} <br><small style="color:var(--text-muted); font-size:10px;">${row.ClientID || ''}</small></td>
                    <td>${row.PortalName || '-'}</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <code>${row.UserName || '-'}</code>
                            <button class="btn-icon" onclick="copyToClipboard('${row.UserName}')" title="Copy"><i class="fa-regular fa-copy"></i></button>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <input type="password" id="pwd-${row.id}" value="${row.Password || ''}" readonly style="background:none; border:none; color:var(--text-main); font-family:monospace; width:90px; outline:none;">
                            <button class="btn-icon" onclick="togglePassword('pwd-${row.id}')" title="View"><i class="fa-solid fa-eye"></i></button>
                            <button class="btn-icon" onclick="copyToClipboard('${row.Password}')" title="Copy"><i class="fa-regular fa-copy"></i></button>
                        </div>
                    </td>
                    <td><button class="btn-action btn-edit" onclick="editData('Credentials', '${row.id}')"><i class="fa-solid fa-pen"></i></button></td>
                </tr>`;
        });
    }
};

// --- DROPDOWN SEARCH POPULATION & BINDING ---
function syncClientDatalist() {
    const datalist = document.getElementById('client-datalist');
    if (!datalist) return;
    
    let optionsHtml = '';
    const sortedClients = [...clientsDatabase].sort((a,b) => (a.ClientName||"").localeCompare(b.ClientName||""));
    
    sortedClients.forEach(c => {
        // Option sets value to: [C1001] Client Name
        optionsHtml += `<option value="[${c.ClientID}] ${c.ClientName}"></option>`;
    });
    datalist.innerHTML = optionsHtml;
}

// Map the search input to auto-reflect the ID
function bindClientSearch(inputId, targetId) {
    const input = document.getElementById(inputId);
    const target = document.getElementById(targetId);
    if (!input || !target) return;
    
    input.addEventListener('input', (e) => {
        const val = e.target.value;
        const match = val.match(/^\[(C\d+)\]/);
        if (match) target.value = match[1];
        else target.value = "";
    });
}
bindClientSearch('comp-client-search', 'comp-clientid');
bindClientSearch('cred-client-search', 'cred-clientid');


// --- DATA FETCH SYNC ---
window.runGlobalSystemFetchIngress = async function() {
    try {
        const [clientsSnap, compliancesSnap, credentialsSnap] = await Promise.all([
            getDocs(collection(db, "Clients")), getDocs(collection(db, "Compliances")), getDocs(collection(db, "Credentials"))
        ]);

        clientsDatabase = []; clientsSnap.forEach(d => clientsDatabase.push({ id: d.id, ...d.data() }));
        compliancesDatabase = []; compliancesSnap.forEach(d => compliancesDatabase.push({ id: d.id, ...d.data() }));
        credentialsDatabase = []; credentialsSnap.forEach(d => credentialsDatabase.push({ id: d.id, ...d.data() }));
        
        syncClientDatalist();

        document.getElementById('totalClientsCount').innerText = clientsDatabase.length;
        document.getElementById('totalCompliancesCount').innerText = compliancesDatabase.length;
        document.getElementById('totalCredentialsCount').innerText = credentialsDatabase.length;

        let pending = 0, completed = 0;
        compliancesDatabase.forEach(c => (c.TaskStatus||"").toLowerCase() === "completed" ? completed++ : pending++);
        renderComplianceDonutChart(pending, completed);

        document.querySelectorAll('.status-msg').forEach(el => el.style.display = 'none');
        document.querySelectorAll('table').forEach(el => el.style.display = 'table');
        
        runLocalTableRenderFilters();
    } catch (err) {
        console.error("Fetch Sync error:", err);
    }
};

// --- MODAL & CRUD LOGIC ---
window.closeModals = function() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
    document.querySelectorAll('form').forEach(f => f.reset());
    window.currentEditMode = { collection: null, firebaseId: null };
};

function generateID(prefix, dbArray, keyField) {
    let max = 0;
    dbArray.forEach(row => {
        const val = row[keyField];
        if(val && val.startsWith(prefix)) {
            let num = parseInt(val.replace(prefix, ""));
            if(!isNaN(num) && num > max) max = num;
        }
    });
    return prefix + (max > 0 ? (max + 1) : 1001);
}

window.openClientFormModal = function() {
    window.currentEditMode = { collection: "Clients", firebaseId: null };
    document.getElementById('clientModalTitle').innerText = "Add New Client System Record";
    document.getElementById('add-clientid').value = generateID("C", clientsDatabase, "ClientID");
    document.getElementById('add-adharno').value = "";
    document.getElementById('add-adharno').readOnly = false;
    document.getElementById('clientFormModal').style.display = 'flex';
};

window.openComplianceFormModal = function() {
    window.currentEditMode = { collection: "Compliances", firebaseId: null };
    document.getElementById('complianceModalTitle').innerText = "Add New Compliance Task";
    document.getElementById('comp-taskid').value = generateID("T-", compliancesDatabase, "TaskID");
    document.getElementById('complianceFormModal').style.display = 'flex';
};

window.openCredentialFormModal = function() {
    window.currentEditMode = { collection: "Credentials", firebaseId: null };
    document.getElementById('credentialModalTitle').innerText = "Add New Security Credential";
    document.getElementById('cred-id').value = generateID("CR-", credentialsDatabase, "CredentialID");
    document.getElementById('credentialFormModal').style.display = 'flex';
};

window.editData = function(collectionName, id) {
    window.currentEditMode = { collection: collectionName, firebaseId: id };
    
    if(collectionName === 'Clients') {
        const data = clientsDatabase.find(c => c.id === id);
        document.getElementById('clientModalTitle').innerText = "Edit Client Master Record";
        document.getElementById('add-clientid').value = data.ClientID || "";
        document.getElementById('add-clientname').value = data.ClientName || "";
        document.getElementById('add-mobileno').value = data.MobileNo || "";
        document.getElementById('add-email').value = data.Email || "";
        document.getElementById('add-folderlink').value = data.FolderLink || "";
        document.getElementById('add-branch').value = data.Branch || "";
        document.getElementById('add-constitution').value = data.Constitution || "";
        document.getElementById('add-gstno').value = data.GSTNo || "";
        document.getElementById('add-panno').value = data.PanNo || "";
        
        document.getElementById('add-adharno').value = data.AdharNo ? "[Aadhaar Redacted]" : "";
        
        document.getElementById('add-fathersname').value = data.FathersName || "";
        document.getElementById('add-dob').value = data.DOB_DOC || data['DOB/DOC'] || "";
        document.getElementById('add-reference').value = data.Reference || "";
        document.getElementById('add-notes').value = data.Notes || "";
        document.getElementById('add-address').value = data.Address || "";
        document.getElementById('clientFormModal').style.display = 'flex';
    }
    else if(collectionName === 'Compliances') {
        const data = compliancesDatabase.find(c => c.id === id);
        document.getElementById('complianceModalTitle').innerText = "Edit Compliance Task";
        document.getElementById('comp-taskid').value = data.TaskID || "";
        
        document.getElementById('comp-client-search').value = data.ClientID ? `[${data.ClientID}] ${data.ClientName}` : data.ClientName || "";
        document.getElementById('comp-clientid').value = data.ClientID || "";

        document.getElementById('comp-portalname').value = data.PortalName || "";
        document.getElementById('comp-task').value = data.Task || "";
        document.getElementById('comp-duedate').value = data.DueDate || "";
        document.getElementById('comp-status').value = data.TaskStatus || "Pending";
        document.getElementById('complianceFormModal').style.display = 'flex';
    }
    else if(collectionName === 'Credentials') {
        const data = credentialsDatabase.find(c => c.id === id);
        document.getElementById('credentialModalTitle').innerText = "Edit Security Credential";
        document.getElementById('cred-id').value = data.CredentialID || "";

        document.getElementById('cred-client-search').value = data.ClientID ? `[${data.ClientID}] ${data.ClientName}` : data.ClientName || "";
        document.getElementById('cred-clientid').value = data.ClientID || "";

        document.getElementById('cred-portalname').value = data.PortalName || "";
        document.getElementById('cred-username').value = data.UserName || "";
        document.getElementById('cred-password').value = data.Password || "";
        document.getElementById('credentialFormModal').style.display = 'flex';
    }
};

async function commitToFirebase(collectionName, payload, btnId) {
    const btn = document.getElementById(btnId);
    const ogText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
    btn.disabled = true;

    try {
        if(window.currentEditMode.firebaseId) {
            await updateDoc(doc(db, collectionName, window.currentEditMode.firebaseId), payload);
        } else {
            await addDoc(collection(db, collectionName), payload);
        }
        closeModals();
        await runGlobalSystemFetchIngress();
    } catch (err) {
        alert("Sync error: " + err.message);
    } finally {
        btn.innerHTML = ogText;
        btn.disabled = false;
    }
}

window.saveClientRecord = function() {
    const now = new Date();
    const timeStampStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getFullYear()} [${now.getHours()}:${now.getMinutes()}]`;
    
    let adharnoInput = document.getElementById('add-adharno').value;
    if(adharnoInput === "[Aadhaar Redacted]") { adharnoInput = undefined; }

    const payload = {
        ClientID: document.getElementById('add-clientid').value,
        ClientName: document.getElementById('add-clientname').value,
        MobileNo: document.getElementById('add-mobileno').value,
        FolderLink: document.getElementById('add-folderlink').value,
        Email: document.getElementById('add-email').value,
        Branch: document.getElementById('add-branch').value,
        Constitution: document.getElementById('add-constitution').value,
        GSTNo: document.getElementById('add-gstno').value,
        PanNo: document.getElementById('add-panno').value,
        FathersName: document.getElementById('add-fathersname').value,
        DOB_DOC: document.getElementById('add-dob').value,
        Address: document.getElementById('add-address').value,
        Notes: document.getElementById('add-notes').value,
        Reference: document.getElementById('add-reference').value,
        '#TimeStamp': timeStampStr
    };
    if(adharnoInput !== undefined) payload.AdharNo = adharnoInput;

    commitToFirebase("Clients", payload, 'btn-submitClient');
};

window.saveComplianceRecord = function() {
    const cId = document.getElementById('comp-clientid').value;
    const searchVal = document.getElementById('comp-client-search').value;
    if (!cId) { alert("Please search and select a valid client."); return; }
    
    // Extract the raw name by removing the [CXXX] prefix
    const cName = searchVal.replace(/^\[.*?\]\s*/, '').trim();

    const payload = {
        TaskID: document.getElementById('comp-taskid').value,
        ClientID: cId,
        ClientName: cName,
        PortalName: document.getElementById('comp-portalname').value,
        Task: document.getElementById('comp-task').value,
        DueDate: document.getElementById('comp-duedate').value,
        TaskStatus: document.getElementById('comp-status').value
    };
    commitToFirebase("Compliances", payload, 'btn-submitCompliance');
};

window.saveCredentialRecord = function() {
    const cId = document.getElementById('cred-clientid').value;
    const searchVal = document.getElementById('cred-client-search').value;
    if (!cId) { alert("Please search and select a valid client."); return; }
    
    const cName = searchVal.replace(/^\[.*?\]\s*/, '').trim();

    const payload = {
        CredentialID: document.getElementById('cred-id').value,
        ClientID: cId,
        ClientName: cName,
        PortalName: document.getElementById('cred-portalname').value,
        UserName: document.getElementById('cred-username').value,
        Password: document.getElementById('cred-password').value
    };
    commitToFirebase("Credentials", payload, 'btn-submitCredential');
};

// --- EXPORT ENGINE (STRICTLY EXPORTS FILTERED UI DATA) ---
window.exportData = function(moduleType, formatType) {
    let data = [];
    let headers = [];
    let mapKeys = [];

    if(moduleType === 'clients') {
        data = activeClients; 
        headers = ['ID', 'Client Name', 'Mobile', 'Email', 'Constitution', 'GST', 'PAN'];
        mapKeys = ['ClientID', 'ClientName', 'MobileNo', 'Email', 'Constitution', 'GSTNo', 'PanNo'];
    } else if(moduleType === 'compliances') {
        data = activeCompliances; 
        headers = ['Task ID', 'Client Name', 'Portal Name', 'Task', 'Due Date', 'Status'];
        mapKeys = ['TaskID', 'ClientName', 'PortalName', 'Task', 'DueDate', 'TaskStatus'];
    } else if(moduleType === 'credentials') {
        data = activeCredentials; 
        headers = ['Cred ID', 'Client Name', 'Portal', 'Username'];
        mapKeys = ['CredentialID', 'ClientName', 'PortalName', 'UserName'];
    }

    if(formatType === 'json') {
        const exportClone = data.map(obj => {
            const cleanObj = { ...obj };
            if(cleanObj.AdharNo) cleanObj.AdharNo = "[Aadhaar Redacted]";
            delete cleanObj.id; // Remove DB identifier
            return cleanObj;
        });
        const blob = new Blob([JSON.stringify(exportClone, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `CMFilings_Filtered_${moduleType}_export.json`;
        a.click();
    } 
    else if(formatType === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        
        const tableData = data.map(row => {
            return mapKeys.map(key => row[key] || '-');
        });

        doc.text(`CMFilings System Export: Filtered ${moduleType.toUpperCase()}`, 14, 15);
        doc.autoTable({
            head: [headers],
            body: tableData,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [37, 99, 235] }
        });
        doc.save(`CMFilings_Filtered_${moduleType}_export.pdf`);
    }
};

// LIVE UI Event Listeners 
document.getElementById('executeSearchBtn').addEventListener('click', () => { globalSearchKeyword = document.getElementById('globalSearchInput').value; runLocalTableRenderFilters(); });
document.getElementById('globalSearchInput').addEventListener('input', (e) => { globalSearchKeyword = e.target.value; runLocalTableRenderFilters(); });
document.getElementById('clientConstitutionFilter').addEventListener('change', runLocalTableRenderFilters);
document.getElementById('complianceStatusFilter').addEventListener('change', runLocalTableRenderFilters);
document.getElementById('credentialsPortalFilter').addEventListener('change', runLocalTableRenderFilters);

// Sidebar Toggles
document.getElementById('toggleSidebar').addEventListener('click', () => {
    document.getElementById('sidebarMenu').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('open');
});
document.getElementById('closeSidebar').addEventListener('click', () => {
    document.getElementById('sidebarMenu').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
});
document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebarMenu').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
});

// Theme Toggle
document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const modeIcon = document.getElementById('themeToggleBtn').querySelector('i');
    if(document.body.hasAttribute('data-theme')) {
        document.body.removeAttribute('data-theme');
        modeIcon.className = "fa-solid fa-moon";
    } else {
        document.body.setAttribute('data-theme', 'dark');
        modeIcon.className = "fa-solid fa-sun";
    }
});

// Init Chart Dummy Line
new Chart(document.getElementById('plChart').getContext('2d'), {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            { label: 'Income Registry', data: [14000, 21000, 18000, 26000, 31000, 45200], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.06)', borderWidth: 2, fill: true, tension: 0.35 },
            { label: 'Operational Costs', data: [9000, 11500, 11000, 15000, 14200, 16100], borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.06)', borderWidth: 2, fill: true, tension: 0.35 }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

// Startup Fetch
window.addEventListener('DOMContentLoaded', runGlobalSystemFetchIngress);
