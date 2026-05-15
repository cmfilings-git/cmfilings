import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
// Notice we imported deleteDoc here:
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 1. Firebase Configuration
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

// 2. Google Apps Script Web App URL (Ensure this is your NEW deployed URL)
const GAS_URL = "https://script.google.com/macros/s/AKfycbzgTVbiYS7cskVQw-Dm24BuE5LqJMqqQniaiLpNwYPPnp2u8BvEKGjnI283Nv91_ecF/exec";

let clientsMap = new Map();
let currentEditId = null;
let clientToDelete = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadClients();
});

// Dark Mode
document.getElementById('themeToggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
});

// Load Clients from Firestore
async function loadClients() {
    const tbody = document.getElementById('clientTableBody');
    tbody.innerHTML = `<tr><td colspan="19" class="p-8 text-center text-gray-500">Loading Client Data...</td></tr>`;
    
    try {
        const q = query(collection(db, "clients"), orderBy("ClientID", "desc"));
        const querySnapshot = await getDocs(q);
        
        clientsMap.clear();
        tbody.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            clientsMap.set(data.ClientID, data);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-4 flex items-center gap-2">
                    <button onclick="editClient('${data.ClientID}')" class="edit-btn" title="Edit Client">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button onclick="triggerDelete('${data.ClientID}', '${data.ClientName}')" class="text-gray-400 hover:text-cmRed transition p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Client">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
                <td class="p-4 font-mono font-bold text-navy dark:text-white">${data.ClientID}</td>
                <td class="p-4 font-medium">${data.ClientName || ''}</td>
                <td class="p-4">${data.LegalName || ''}</td>
                <td class="p-4 font-mono text-xs">${data.GSTNo || ''}</td>
                <td class="p-4">${data.MobileNo || ''}</td>
                <td class="p-4">${data.Email || ''}</td>
                <td class="p-4">${data.Branch || ''}</td>
                <td class="p-4">${data.LegalTradeName || ''}</td>
                <td class="p-4">${data.ConstitutionOfBusiness || ''}</td>
                <td class="p-4 font-mono text-xs">${data.PanNo || ''}</td>
                <td class="p-4 font-mono text-xs">${data.AdharNo || ''}</td>
                <td class="p-4">${data.FathersName || ''}</td>
                <td class="p-4">${data.DOB || ''}</td>
                <td class="p-4 truncate max-w-xs" title="${data.Address || ''}">${data.Address || ''}</td>
                <td class="p-4 truncate max-w-[150px]">${data.Notes || ''}</td>
                <td class="p-4">${data.Reference || ''}</td>
                <td class="p-4 text-accent"><a href="${data.FolderLink || '#'}" target="_blank">Link</a></td>
                <td class="p-4 text-xs text-gray-400">${data.TimeStamp || ''}</td>
            `;
            tbody.appendChild(tr);
        });
        lucide.createIcons();
    } catch (error) {
        console.error("Error loading clients:", error);
        tbody.innerHTML = `<tr><td colspan="19" class="p-8 text-center text-cmRed font-bold">Error loading data. Check console.</td></tr>`;
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
        // Save to Firebase
        const docRef = doc(db, "clients", clientID);
        if (currentEditId) {
            await updateDoc(docRef, clientData);
        } else {
            clientData.createdAt = serverTimestamp(); 
            await setDoc(docRef, clientData);
        }

        // Sync to Sheets
        await fetch(GAS_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
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

window.syncFromSheet = async function() {
    const btn = document.getElementById('syncBtn');
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Syncing...`;
    btn.disabled = true;

    try {
        // 1. Fetch all existing data from Google Sheets
        const response = await fetch(GAS_URL);
        const sheetData = await response.json();

        if (sheetData.error) {
            alert("Error reading from Google Sheets: " + sheetData.error);
            return;
        }

        // 2. Loop through every row and save it to Firebase
        for (let i = 0; i < sheetData.length; i++) {
            const client = sheetData[i];
            if (!client.ClientID) continue;

            const docRef = doc(db, "clients", client.ClientID);
            client.createdAt = serverTimestamp(); 
            await setDoc(docRef, client);
        }

        alert(`Success! Imported ${sheetData.length} existing clients into the dashboard.`);
        loadClients(); // Refresh the table

    } catch (error) {
        console.error("Sync Error:", error);
        alert("Error syncing data. Check console.");
    } finally {
        btn.innerHTML = `<i data-lucide="refresh-cw" class="w-4 h-4"></i> Sync Old Data`;
        btn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// DELETE FUNCTIONS
window.triggerDelete = function(clientId, clientName) {
    clientToDelete = clientId;
    document.getElementById('deleteClientName').innerText = clientName || clientId;
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
        // 1. Delete from Firebase
        await deleteDoc(doc(db, "clients", clientToDelete));

        // 2. Delete from Google Sheets
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
