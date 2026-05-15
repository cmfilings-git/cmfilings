import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, serverTimestamp, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 1. Firebase Configuration (Replace with your cmfilings-firebase config)
const firebaseConfig = {
  apiKey: "AIzaSyYourKeyHere...",
  authDomain: "cmfilings-firebase.firebaseapp.com",
  projectId: "cmfilings-firebase",
  storageBucket: "cmfilings-firebase.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Google Apps Script Web App URL
const GAS_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL"; // PASTE THE URL FROM STEP 1 HERE

let clientsMap = new Map();
let currentEditId = null;

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
                <td class="p-4">
                    <button onclick="editClient('${data.ClientID}')" class="edit-btn" title="Edit Client">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
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

// Generate next ID (e.g. C40209 -> C40210)
async function generateNextClientID() {
    const q = query(collection(db, "clients"), orderBy("ClientID", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return "C40001"; // Starting point if database is completely empty
    } else {
        const lastClient = querySnapshot.docs[0].data();
        const lastIdString = lastClient.ClientID; // "C40209"
        const numPart = parseInt(lastIdString.substring(1)); // 40209
        return "C" + (numPart + 1); // "C40210"
    }
}

// Global UI Functions
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
    
    // Populate form
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
    const timeStampStr = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;

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
        // 1. Save to Firebase Firestore (Primary)
        const docRef = doc(db, "clients", clientID);
        if (currentEditId) {
            await updateDoc(docRef, clientData);
        } else {
            // Adds server timestamp for security/auditing
            clientData.createdAt = serverTimestamp(); 
            await setDoc(docRef, clientData);
        }

        // 2. Sync to Google Sheets (Backup / Accounting) via Apps Script
        await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify(clientData)
        });

        // 3. Update UI
        closeModal();
        loadClients();
        alert("Client saved successfully!");

    } catch (error) {
        console.error("Error saving client:", error);
        alert("Error saving client. Please check your permissions.");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Save Client`;
        lucide.createIcons();
    }
}
