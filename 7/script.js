import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
const GAS_URL = "https://script.google.com/macros/s/AKfycbzgTVbiYS7cskVQw-Dm24BuE5LqJMqqQniaiLpNwYPPnp2u8BvEKGjnI283Nv91_ecF/exec";

let clientsData = [];
let currentEditId = null;
let sortCol = 'ClientID';
let sortAsc = false; 

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadClients();
});

document.getElementById('themeToggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
});

// Load & Render Logic
async function loadClients() {
    const tbody = document.getElementById('clientTableBody');
    tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-slate-600 font-bold text-lg">Loading Database...</td></tr>`;
    
    try {
        const q = query(collection(db, "clients"));
        const querySnapshot = await getDocs(q);
        
        clientsData = [];
        querySnapshot.forEach((doc) => {
            clientsData.push(doc.data());
        });
        
        renderTable();
    } catch (error) {
        console.error("Error loading:", error);
        tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-red-600 font-bold text-lg">Error loading data.</td></tr>`;
    }
}

window.sortTable = function(col) {
    if (sortCol === col) {
        sortAsc = !sortAsc;
    } else {
        sortCol = col;
        sortAsc = true;
    }
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('clientTableBody');
    const filter = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = clientsData.filter(c => 
        (c.ClientName || '').toLowerCase().includes(filter) || 
        (c.ClientID || '').toLowerCase().includes(filter) ||
        (c.MobileNo || '').toLowerCase().includes(filter)
    );

    filtered.sort((a, b) => {
        let valA = (a[sortCol] || '').toString().toLowerCase();
        let valB = (b[sortCol] || '').toString().toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    tbody.innerHTML = '';
    
    filtered.forEach((data) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-ea-light dark:hover:bg-slate-800/50 transition-colors cursor-pointer group border-b border-slate-200 dark:border-slate-700";
        tr.onclick = () => openViewModal(data.ClientID);
        
        // Increased font sizes and darker text colors for visibility
        tr.innerHTML = `
            <td class="p-4 font-mono font-bold text-ea-green text-base group-hover:underline">${data.ClientID}</td>
            <td class="p-4 font-extrabold text-slate-900 dark:text-white text-base">${data.ClientName || '-'}</td>
            <td class="p-4 font-semibold text-slate-800 dark:text-slate-300 text-base">${data.LegalName || '-'}</td>
            <td class="p-4 font-bold text-slate-900 dark:text-white text-base">${data.MobileNo || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

window.searchClients = () => renderTable();

// VIEW MODAL LOGIC
window.openViewModal = function(id) {
    const data = clientsData.find(c => c.ClientID === id);
    if(!data) return;

    document.getElementById('viewClientID').innerText = data.ClientID;
    document.getElementById('viewClientName').innerText = data.ClientName || 'Unknown Client';
    
    document.getElementById('btnViewEdit').onclick = () => {
        closeViewModal();
        openEditModal(id);
    };
    
    const mobileClean = (data.MobileNo || '').replace(/\D/g, '');
    document.getElementById('btnViewCall').href = mobileClean ? `tel:${mobileClean}` : '#';
    document.getElementById('btnViewWa').href = mobileClean ? `https://wa.me/${mobileClean}` : '#';

    // Increased label sizes & value weights for readability
    const detailsHtml = `
        <div><span class="text-xs font-bold text-slate-500 uppercase block mb-1">Legal Name</span><span class="font-extrabold text-slate-900 dark:text-white">${data.LegalName || '-'}</span></div>
        <div><span class="text-xs font-bold text-slate-500 uppercase block mb-1">Email</span><span class="font-extrabold text-slate-900 dark:text-white">${data.Email || '-'}</span></div>
        <div><span class="text-xs font-bold text-slate-500 uppercase block mb-1">GST No</span><span class="font-mono font-extrabold text-slate-900 dark:text-white">${data.GSTNo || '-'}</span></div>
        <div><span class="text-xs font-bold text-slate-500 uppercase block mb-1">PAN No</span><span class="font-mono font-extrabold text-slate-900 dark:text-white">${data.PanNo || '-'}</span></div>
        <div><span class="text-xs font-bold text-slate-500 uppercase block mb-1">Constitution</span><span class="font-extrabold text-slate-900 dark:text-white">${data.ConstitutionOfBusiness || data.Constitution || '-'}</span></div>
        <div><span class="text-xs font-bold text-slate-500 uppercase block mb-1">Branch</span><span class="font-extrabold text-slate-900 dark:text-white">${data.Branch || '-'}</span></div>
        <div class="sm:col-span-2"><span class="text-xs font-bold text-slate-500 uppercase block mb-1">Folder Link</span>${data.FolderLink ? `<a href="${data.FolderLink}" target="_blank" class="text-ea-green font-bold underline hover:text-slate-900 dark:hover:text-white">Open Directory</a>` : '-'}</div>
    `;
    document.getElementById('viewDetailsGrid').innerHTML = detailsHtml;

    const credTbody = document.getElementById('credentialsTableBody');
    credTbody.innerHTML = '';
    
    if (data.CredPortal || data.CredUser) {
        credTbody.innerHTML = `
            <tr class="hover:bg-slate-200 dark:hover:bg-slate-800 transition">
                <td class="px-4 py-4 font-bold text-slate-900 dark:text-white">${data.CredPortal || '-'}</td>
                <td class="px-4 py-4 font-bold text-slate-800 dark:text-slate-200">${data.CredUser || '-'}</td>
                <td class="px-4 py-4">
                    <div class="flex items-center gap-3">
                        <span class="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-300 dark:bg-slate-900 px-3 py-1.5 rounded text-sm">${data.CredPass || '***'}</span>
                        <button onclick="copyText('${data.CredPass}')" class="text-slate-600 hover:text-ea-green transition p-1 bg-slate-100 dark:bg-slate-800 rounded shadow-sm border border-slate-300 dark:border-slate-600" title="Copy Password"><i data-lucide="copy" class="w-4 h-4"></i></button>
                    </div>
                </td>
            </tr>
        `;
    } else {
        credTbody.innerHTML = `<tr><td colspan="3" class="px-4 py-5 text-center text-slate-500 font-semibold text-sm italic">No credentials logged for this client.</td></tr>`;
    }

    document.getElementById('viewModal').classList.replace('hidden', 'flex');
    lucide.createIcons();
}

window.closeViewModal = () => document.getElementById('viewModal').classList.replace('flex', 'hidden');

window.copyText = function(text) {
    if(!text || text==='undefined') return;
    navigator.clipboard.writeText(text);
    alert("Password copied to clipboard!");
}

// EDIT MODAL LOGIC
async function generateNextClientID() {
    const q = query(collection(db, "clients"), orderBy("ClientID", "desc"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return "C40001";
    const lastId = snap.docs[0].data().ClientID; 
    return "C" + (parseInt(lastId.substring(1)) + 1);
}

window.openEditModal = async function(id = null) {
    document.getElementById('clientForm').reset();
    currentEditId = id;
    
    if (id) {
        const data = clientsData.find(c => c.ClientID === id);
        document.getElementById('editModalTitle').innerText = "Edit Client Details";
        document.getElementById('modalDeleteBtn').classList.remove('hidden');
        
        document.getElementById('ClientID').value = data.ClientID || '';
        document.getElementById('ClientName').value = data.ClientName || '';
        document.getElementById('LegalName').value = data.LegalName || '';
        document.getElementById('MobileNo').value = data.MobileNo || '';
        document.getElementById('Email').value = data.Email || '';
        document.getElementById('Branch').value = data.Branch || '';
        document.getElementById('Constitution').value = data.ConstitutionOfBusiness || data.Constitution || '';
        document.getElementById('GSTNo').value = data.GSTNo || '';
        document.getElementById('PanNo').value = data.PanNo || '';
        document.getElementById('FolderLink').value = data.FolderLink || '';
        
        document.getElementById('CredPortal').value = data.CredPortal || '';
        document.getElementById('CredUser').value = data.CredUser || '';
        document.getElementById('CredPass').value = data.CredPass || '';
    } else {
        document.getElementById('editModalTitle').innerText = "Add New Client";
        document.getElementById('ClientID').value = await generateNextClientID();
        document.getElementById('modalDeleteBtn').classList.add('hidden');
    }
    
    document.getElementById('editModal').classList.replace('hidden', 'flex');
}

window.closeEditModal = () => document.getElementById('editModal').classList.replace('flex', 'hidden');

window.saveClient = async function() {
    const form = document.getElementById('clientForm');
    if(!form.checkValidity()) { form.reportValidity(); return; }

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = "Saving...";

    const clientData = {
        ClientID: document.getElementById('ClientID').value,
        ClientName: document.getElementById('ClientName').value.trim(),
        LegalName: document.getElementById('LegalName').value.trim(),
        MobileNo: document.getElementById('MobileNo').value.trim(),
        Email: document.getElementById('Email').value.trim(),
        Branch: document.getElementById('Branch').value.trim(),
        Constitution: document.getElementById('Constitution').value.trim(),
        GSTNo: document.getElementById('GSTNo').value.trim().toUpperCase(),
        PanNo: document.getElementById('PanNo').value.trim().toUpperCase(),
        FolderLink: document.getElementById('FolderLink').value.trim(),
        CredPortal: document.getElementById('CredPortal').value.trim(),
        CredUser: document.getElementById('CredUser').value.trim(),
        CredPass: document.getElementById('CredPass').value.trim()
    };

    try {
        const docRef = doc(db, "clients", clientData.ClientID);
        if (currentEditId) {
            await updateDoc(docRef, clientData);
        } else {
            clientData.createdAt = serverTimestamp(); 
            await setDoc(docRef, clientData);
        }
        
        fetch(GAS_URL, {
            method: "POST", mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(clientData)
        }).catch(e => console.log("Gas sync fail silent"));

        closeEditModal();
        await loadClients();
    } catch (error) {
        console.error(error);
        alert("Error saving client.");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> Save Client`;
        lucide.createIcons();
    }
}

window.triggerDelete = async function() {
    if(!currentEditId || !confirm("Are you sure you want to delete this client?")) return;
    try {
        await deleteDoc(doc(db, "clients", currentEditId));
        closeEditModal();
        await loadClients();
    } catch(e) { alert("Error deleting"); }
}

window.syncFromSheet = async function() {
    const btn = document.getElementById('syncBtn');
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Syncing...`;
    try {
        const res = await fetch(GAS_URL);
        const sheetData = await res.json();
        for (let client of sheetData) {
            if (!client.ClientID) continue;
            await setDoc(doc(db, "clients", client.ClientID), client, {merge: true});
        }
        alert("Sync Complete");
        loadClients();
    } catch(e) { alert("Sync failed."); }
    btn.innerHTML = `<i data-lucide="refresh-cw" class="w-4 h-4"></i> Sync`;
    lucide.createIcons();
}
