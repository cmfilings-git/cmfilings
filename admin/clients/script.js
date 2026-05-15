import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBqbdmDKe6x_nWzkm6OwOX19QyJgCb7arM",
  authDomain: "cmfilings-firebase.firebaseapp.com",
  projectId: "cmfilings-firebase",
  storageBucket: "cmfilings-firebase.firebasestorage.app",
  messagingSenderId: "55459718043",
  appId: "1:55459718043:web:054cbd500c00ebf3cd373e",
  measurementId: "G-28GZE86MES"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const GAS_URL = "https://script.google.com/macros/s/AKfycbzgTVbiYS7cskVQw-Dm24BuE5LqJMqqQniaiLpNwYPPnp2u8BvEKGjnI283Nv91_ecF/exec";

let clientsMap = new Map();
let currentEditId = null;
let clientToDelete = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadClients();
});

// Dark Mode Toggle
document.getElementById('themeToggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
});

// Search Clients Logic
window.searchClients = function() {
    const filter = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('.client-main-row');
    
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const id = row.dataset.id;
        const expandRow = document.getElementById(`expand-${id}`);
        
        if (text.includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
            if (expandRow) {
                expandRow.classList.add('hidden'); // Ensure expanded row closes if filtered out
                document.getElementById(`icon-${id}`).classList.remove('rotate-180');
            }
        }
    });
}

// Load Clients
async function loadClients() {
    const tbody = document.getElementById('clientTableBody');
    tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-500">Loading Client Data...</td></tr>`;
    
    try {
        const q = query(collection(db, "clients"), orderBy("ClientID", "desc"));
        const querySnapshot = await getDocs(q);
        
        clientsMap.clear();
        tbody.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            clientsMap.set(data.ClientID, data);
            
            // 1. Primary Minimal Row
            const tr = document.createElement('tr');
            tr.className = "client-main-row hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors";
            tr.dataset.id = data.ClientID;
            
            // Build the Call Button only if MobileNo exists
            const callBtn = data.MobileNo 
                ? `<a href="tel:${data.MobileNo}" class="p-1.5 bg-[#10B981]/10 text-[#10B981] rounded-lg hover:bg-[#10B981]/20 transition" title="Call Client"><i data-lucide="phone" class="w-4 h-4"></i></a>` 
                : '';

            tr.innerHTML = `
                <td class="p-4 flex items-center gap-2">
                    <button onclick="toggleExpand('${data.ClientID}')" class="text-gray-400 hover:text-navy dark:hover:text-white transition p-1.5" title="View Details">
                        <i data-lucide="chevron-down" id="icon-${data.ClientID}" class="w-4 h-4 transition-transform duration-200"></i>
                    </button>
                    <button onclick="editClient('${data.ClientID}')" class="text-gold hover:text-yellow-600 transition p-1.5" title="Edit Client">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                </td>
                <td class="p-4 font-mono font-bold text-navy dark:text-white">${data.ClientID}</td>
                <td class="p-4 font-medium">${data.ClientName || '-'}</td>
                <td class="p-4 font-mono text-xs">${data.GSTNo || '-'}</td>
                <td class="p-4 flex items-center gap-3">
                    <span class="font-medium">${data.MobileNo || '-'}</span>
                    ${callBtn}
                </td>
            `;

            // 2. Hidden Expanded Row
            const expandTr = document.createElement('tr');
            expandTr.id = `expand-${data.ClientID}`;
            expandTr.className = "hidden bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-gray-800";
            
            expandTr.innerHTML = `
                <td colspan="5" class="p-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                        <div><span class="text-xs text-gray-500 uppercase font-bold block mb-1">Legal Name</span><span class="font-medium">${data.LegalName || '-'}</span></div>
                        <div><span class="text-xs text-gray-500 uppercase font-bold block mb-1">Email</span><span class="font-medium">${data.Email || '-'}</span></div>
                        <div><span class="text-xs text-gray-500 uppercase font-bold block mb-1">Branch</span><span class="font-medium">${data.Branch || '-'}</span></div>
                        <div><span class="text-xs text-gray-500 uppercase font-bold block mb-1">Trade Name</span><span class="font-medium">${data.LegalTradeName || '-'}</span></div>
                        <div><span class="text-xs text-gray-500 uppercase font-bold block mb-1">Constitution</span><span class="font-medium">${data.ConstitutionOfBusiness || '-'}</span></div>
                        <div><span class="text-xs text-gray-500 uppercase font-bold block mb-1">PAN No</span><span class="font-mono">${data.PanNo || '-'}</span></div>
                        <div><span class="text-xs text-gray-500 uppercase font-bold block mb-1">Aadhaar No</span><span class="font-mono">${data.AdharNo || '-'}</span></div>
                        <div><span class="text-xs text-gray-500 uppercase font-bold block mb-1">Father's Name</span><span class="font-medium">${data.FathersName || '-'}</span></div>
                        <div><span class="text-xs text-gray-500 uppercase font-bold block mb-1">DOB / DOC</span><span class="font-medium">${data.DOB || '-'}</span></div>
                        <div class="sm:col-span-2"><span class="text-xs text-gray-500 uppercase font-bold block mb-1">Address</span><span class="font-medium">${data.Address || '-'}</span></div>
                        <div class="sm:col-span-2"><span class="text-xs text-gray-500 uppercase font-bold block mb-1">Notes</span><span class="font-medium">${data.Notes || '-'}</span></div>
                        <div><span class="text-xs text-gray-500 uppercase font-bold block mb-1">Reference</span><span class="font-medium">${data.Reference || '-'}</span></div>
                        <div><span class="text-xs text-gray-500 uppercase font-bold block mb-1">Folder Link</span>${data.FolderLink ? `<a href="${data.FolderLink}" target="_blank" class="text-accent underline font-medium hover:text-blue-700">Open Folder</a>` : '-'}</div>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
            tbody.appendChild(expandTr);
        });
        lucide.createIcons();
    } catch (error) {
        console.error("Error loading clients:", error);
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-cmRed font-bold">Error loading data. Check console.</td></tr>`;
    }
}

// Expand Row Logic
window.toggleExpand = function(id) {
    const expandRow = document.getElementById(`expand-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    
    if (expandRow.classList.contains('hidden')) {
        expandRow.classList.remove('hidden');
        icon.classList.add('rotate-180');
    } else {
        expandRow.classList.add('hidden');
        icon.classList.remove('rotate-180');
    }
}

// Generate next ID
async function generateNextClientID() {
    const q = query(collection(db, "clients"), orderBy("ClientID", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return "C40001";
    } else {
        const lastClient = querySnapshot.docs[0].data();
        const lastIdString = lastClient.ClientID; 
        const numPart = parseInt(lastIdString.substring(1)); 
        return "C" + (numPart + 1);
    }
}

// Modal Functions
window.openModal = async function() {
    document.getElementById('clientForm').reset();
    document.getElementById('modalTitle').innerText = "Add New Client";
    document.getElementById('ClientID').value = await generateNextClientID();
    currentEditId = null;
    document.getElementById('modalDeleteBtn').classList.add('hidden'); // Hide delete on New Client
    document.getElementById('clientModal').classList.replace('hidden', 'flex');
}

window.closeModal = function() {
    document.getElementById('clientModal').classList.replace('flex', 'hidden');
}

window.editClient = function(clientId) {
    const data = clientsMap.get(clientId);
    if(!data) return;
    
    currentEditId = clientId;
    document.getElementById('modalTitle').innerText = "Edit Client Details";
    document.getElementById('modalDeleteBtn').classList.remove('hidden'); // Show delete on Edit
    
    document.getElementById('ClientID').value = data.ClientID || '';
    document.getElementById('ClientName').value = data.ClientName || '';
    document.getElementById('LegalName').value = data.LegalName || '';
    document.getElementById('GSTNo').value = data.GSTNo || '';
    document.getElementById('MobileNo').value = data.MobileNo || '';
    document.getElementById('Email').value = data.Email || '';
    document.getElementById('Branch').value = data.Branch || '';
    document.getElementById('LegalTradeName').value = data.LegalTradeName || '';
    document.getElementById('ConstitutionOfBusiness').value = data.ConstitutionOfBusiness || '';
    document.getElementById('PanNo').value = data.PanNo || '';
    document.getElementById('AdharNo').value = data.AdharNo || '';
    document.getElementById('FathersName').value = data.FathersName || '';
    document.getElementById('DOB').value = data.DOB || '';
    document.getElementById('Address').value = data.Address || '';
    document.getElementById('Notes').value = data.Notes || '';
    document.getElementById('Reference').value = data.Reference || '';
    document.getElementById('FolderLink').value = data.FolderLink || '';
    
    document.getElementById('clientModal').classList.replace('hidden', 'flex');
}

// Save Function
window.saveClient = async function() {
    const form = document.getElementById('clientForm');
    if(!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = "Saving...";

    const clientID = document.getElementById('ClientID').value;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timeStampStr = `${day}/${month}/${now.getFullYear()}`;

    const clientData = {
        ClientID: clientID,
        ClientName: document.getElementById('ClientName').value.trim(),
        LegalName: document.getElementById('LegalName').value.trim(),
        GSTNo: document.getElementById('GSTNo').value.trim().toUpperCase(),
        MobileNo: document.getElementById('MobileNo').value.trim(),
        Email: document.getElementById('Email').value.trim(),
        Branch: document.getElementById('Branch').value.trim(),
        LegalTradeName: document.getElementById('LegalTradeName').value.trim(),
        ConstitutionOfBusiness: document.getElementById('ConstitutionOfBusiness').value.trim(),
        PanNo: document.getElementById('PanNo').value.trim().toUpperCase(),
        AdharNo: document.getElementById('AdharNo').value.trim(),
        FathersName: document.getElementById('FathersName').value.trim(),
        DOB: document.getElementById('DOB').value,
        Address: document.getElementById('Address').value.trim(),
        Notes: document.getElementById('Notes').value.trim(),
        Reference: document.getElementById('Reference').value.trim(),
        FolderLink: document.getElementById('FolderLink').value.trim(),
        TimeStamp: timeStampStr
    };

    try {
        const docRef = doc(db, "clients", clientID);
        if (currentEditId) {
            await updateDoc(docRef, clientData);
        } else {
            clientData.createdAt = serverTimestamp(); 
            await setDoc(docRef, clientData);
        }

        await fetch(GAS_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(clientData)
        });

        closeModal();
        loadClients();
    } catch (error) {
        console.error("Error saving client:", error);
        alert("Error saving client. Please check console for details.");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Save Client`;
        lucide.createIcons();
    }
}

// DELETE FUNCTIONS
window.triggerDeleteFromModal = function() {
    if(!currentEditId) return;
    const clientName = document.getElementById('ClientName').value || currentEditId;
    closeModal(); // Close the edit modal
    
    // Open confirmation modal
    clientToDelete = currentEditId;
    document.getElementById('deleteClientName').innerText = clientName;
    document.getElementById('deleteModal').classList.replace('hidden', 'flex');
}

window.closeDeleteModal = function() {
    clientToDelete = null;
    document.getElementById('deleteModal').classList.replace('flex', 'hidden');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if(!clientToDelete) return;
    
    const btn = document.getElementById('confirmDeleteBtn');
    btn.innerHTML = "Deleting...";
    btn.disabled = true;

    try {
        await deleteDoc(doc(db, "clients", clientToDelete));

        await fetch(GAS_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ ClientID: clientToDelete, action: "delete" })
        });

        closeDeleteModal();
        loadClients();
    } catch (e) {
        console.error("Delete failed: ", e);
        alert("Error deleting client.");
    } finally {
        btn.innerHTML = "Yes, Delete";
        btn.disabled = false;
    }
});

// SYNC SCRIPT
window.syncFromSheet = async function() {
    const btn = document.getElementById('syncBtn');
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Syncing...`;
    btn.disabled = true;

    try {
        const response = await fetch(GAS_URL);
        const sheetData = await response.json();

        if (sheetData.error) {
            alert("Error reading from Google Sheets: " + sheetData.error);
            return;
        }

        for (let i = 0; i < sheetData.length; i++) {
            const client = sheetData[i];
            if (!client.ClientID) continue;
            const docRef = doc(db, "clients", client.ClientID);
            client.createdAt = serverTimestamp(); 
            await setDoc(docRef, client);
        }

        alert(`Success! Imported ${sheetData.length} existing clients into the dashboard.`);
        loadClients(); 

    } catch (error) {
        console.error("Sync Error:", error);
        alert("Error syncing data. Check console.");
    } finally {
        btn.innerHTML = `<i data-lucide="refresh-cw" class="w-4 h-4"></i> Sync`;
        btn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}
