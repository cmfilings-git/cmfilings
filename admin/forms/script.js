// Initialize Icons
lucide.createIcons();

// Replace this with your Google Apps Script Web App URL after deploying
const scriptURL = 'https://script.google.com/macros/s/AKfycby4KMC5G_bpKZFYVy9xYsznNczzjXMsV0EqZCmrtV9hLBfe9wFxQMEuKHL8S3IANg/exec'; 

let allRecords = [];
let currentSort = { column: null, direction: 'asc' };

// Tab Navigation Logic
function switchTab(tab) {
    document.getElementById('tabUpload').classList.toggle('hidden', tab !== 'upload');
    document.getElementById('tabView').classList.toggle('hidden', tab !== 'view');
    
    const activeClass = ['bg-navy','text-white','dark:bg-gold','dark:text-navy'];
    const inactiveClass = ['bg-gray-200','text-gray-600','dark:bg-slate-800','dark:text-gray-300'];
    
    if(tab === 'upload') {
        document.getElementById('tabBtnUpload').classList.add(...activeClass);
        document.getElementById('tabBtnUpload').classList.remove(...inactiveClass);
        document.getElementById('tabBtnView').classList.add(...inactiveClass);
        document.getElementById('tabBtnView').classList.remove(...activeClass);
    } else {
        document.getElementById('tabBtnView').classList.add(...activeClass);
        document.getElementById('tabBtnView').classList.remove(...inactiveClass);
        document.getElementById('tabBtnUpload').classList.add(...inactiveClass);
        document.getElementById('tabBtnUpload').classList.remove(...activeClass);
    }
}

// Fetch Data on Load
document.addEventListener('DOMContentLoaded', async () => {
    switchTab('view'); 
    const tbody = document.getElementById('recordsTable');
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center animate-pulse">Fetching initial data...</td></tr>';
    
    try {
        const response = await fetch(scriptURL + '?action=getInitData');
        const initData = await response.json();
        
        // Load Client Dropdown
        const sel = document.getElementById('clientName');
        sel.innerHTML = '<option value="" disabled selected>Select a Client...</option>';
        initData.clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name; 
            opt.dataset.id = c.id; 
            opt.textContent = c.name;
            sel.appendChild(opt);
        });

        // Load Table Records
        allRecords = initData.records;
        renderTable(allRecords);

    } catch (e) { 
        console.error("Data load error", e); 
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Failed to load data. Please refresh the page.</td></tr>';
    }
});

// Update Client ID when Client Name is selected
document.getElementById('clientName').addEventListener('change', function() {
    document.getElementById('clientId').value = this.options[this.selectedIndex].dataset.id || '';
});

// Handle Form Submission
document.getElementById('gstrAdminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const msg = document.getElementById('formMsg');
    btn.disabled = true; 
    btn.innerHTML = 'Processing...';
    
    try {
        let base64Data = "";
        let fileName = "";
        let fileType = "";
        
        const fileInput = document.getElementById('fileUpload');
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0]; // Fixed syntax from array collection
            fileName = file.name;
            fileType = file.type;
            base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result.split(',')[1]); // Removed  bug
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        }
        
        const rawMonth = document.getElementById('returnMonth').value;
        // Fixed template literal formatting bug 
        const formattedMonth = rawMonth ? `${rawMonth.split('-')[1]}-${rawMonth.split('-')[0]}` : ''; 

        const payload = {
            'CLIENT_NAME': document.getElementById('clientName').value,
            'CLIENT_ID': document.getElementById('clientId').value,
            'RETURN_MONTH': formattedMonth, 
            'DOC_TYPE': document.getElementById('docType').value,
            'SERVICE_STATUS': document.getElementById('serviceStatus').value,
            'PAYMENT_STATUS': document.getElementById('paymentStatus').value,
            'FEE_AMOUNT': document.getElementById('feeAmount').value,
            'ADDITIONAL_NOTES': document.getElementById('addNotes').value,
            filename: fileName, 
            mimeType: fileType, 
            fileData: base64Data
        };

        const response = await fetch(scriptURL, { 
            method: 'POST', 
            body: JSON.stringify(payload) 
        });
        const data = await response.json();

        if (data.result === 'success') {
            msg.className = "text-center text-sm text-green-600 bg-green-50 block p-4 mt-4 rounded-xl";
            msg.textContent = "Saved Successfully!";
            document.getElementById('gstrAdminForm').reset();
            document.getElementById('clientId').value = '';
            loadRecords(); 
        } else {
            throw new Error(data.error);
        }

    } catch (err) {
        msg.className = "text-center text-sm text-red-600 bg-red-50 block p-4 mt-4 rounded-xl";
        msg.textContent = "Save failed.";
        console.error(err);
    } finally {
        btn.disabled = false; 
        btn.innerHTML = '<i data-lucide="save" class="w-5 h-5"></i> Save & Upload Record';
        lucide.createIcons();
        setTimeout(() => msg.classList.add('hidden'), 4000);
    }
});

// Load Records Explicitly
async function loadRecords() {
    const tbody = document.getElementById('recordsTable');
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center animate-pulse">Fetching latest records...</td></tr>';
    try {
        const res = await fetch(scriptURL + '?action=getRecords');
        allRecords = await res.json();
        renderTable(allRecords);
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Failed to load records.</td></tr>';
    }
}

// Sorting Functionality
function sortData(columnKey) {
    if (currentSort.column === columnKey) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = columnKey;
        currentSort.direction = 'asc';
    }

    allRecords.sort((a, b) => {
        let valA = a[columnKey] ? a[columnKey].toString().toLowerCase() : '';
        let valB = b[columnKey] ? b[columnKey].toString().toLowerCase() : '';
        
        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    renderTable(allRecords);
}

// Search Filter Functionality
document.getElementById('masterSearch').addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const filtered = allRecords.filter(row => {
        return Object.values(row).some(val => 
            val !== null && val.toString().toLowerCase().includes(term)
        );
    });
    renderTable(filtered);
});

// DOM Rendering for Table
function renderTable(dataArray) {
    const tbody = document.getElementById('recordsTable');
    tbody.innerHTML = '';
    
    if(dataArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No records found.</td></tr>';
        return;
    }

    dataArray.forEach(r => {
        const cName = r['CLIENT_NAME'] || 'Unknown';
        const cId = r['CLIENT_ID'] || '';
        const cMonth = r['RETURN_MONTH'] || '-';
        const cWorkStatus = r['SERVICE_STATUS'] || 'Pending';
        const cPayStatus = r['PAYMENT_STATUS'] || 'Not Received';
        
        let payBadgeClass = cPayStatus.toLowerCase().includes('not') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

        const tr = document.createElement('tr');
        
        tr.innerHTML = `
          <td class="px-6 py-4"><div><p class="font-bold text-navy dark:text-white">${cName}</p><p class="text-xs text-gray-400">${cId}</p></div></td>
          <td class="px-6 py-4">${cMonth}</td>
          <td class="px-6 py-4 font-medium text-gold">${cWorkStatus}</td>
          <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-bold ${payBadgeClass}">${cPayStatus}</span></td>
          
          <td class="px-6 py-4 text-center">
             <div class="flex items-center justify-center gap-3">
                 <button onclick="openEditModal(${r.rowIndex})" class="bg-zohoBlue text-white p-2 rounded-lg hover:opacity-80 transition shadow-sm" title="Edit Record"><i data-lucide="edit" class="w-4 h-4"></i></button>
                 <button onclick="openDetailsModal(${r.rowIndex})" class="bg-zohoBlue text-white p-2 rounded-lg hover:opacity-80 transition shadow-sm" title="Expand Details"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
             </div>
          </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

// Modal Functions
function openDetailsModal(rowIndex) {
    const record = allRecords.find(r => r.rowIndex === rowIndex);
    if(!record) return;

    const container = document.getElementById('detailsContainer');
    container.innerHTML = ''; 

    const fieldsToShow = [
        { label: "Client ID", val: record['CLIENT_ID'] },
        { label: "Client Name", val: record['CLIENT_NAME'] },
        { label: "Return Month", val: record['RETURN_MONTH'] },
        { label: "Doc Type", val: record['DOC_TYPE'] },
        { label: "Doc Password", val: record['DOC_PASSWORK_IF_ANY'] },
        { label: "Service Status", val: record['SERVICE_STATUS'] },
        { label: "Payment Status", val: record['PAYMENT_STATUS'] },
        { label: "Fee Amount", val: record['FEE_AMOUNT'] },
        { label: "Additional Notes", val: record['ADDITIONAL_NOTES'] }
    ];

    fieldsToShow.forEach(field => {
        container.innerHTML += `
          <div class="mb-3">
            <span class="block text-xs font-bold font-poppins text-gray-400 uppercase tracking-wider">${field.label}</span>
            <span class="font-medium text-navy dark:text-white">${field.val || '-'}</span>
          </div>
        `;
    });

    const folderLink = record['FOLDER_LINK'] || record['DOC_LINK'];
    if(folderLink) {
        container.innerHTML += `
          <div class="col-span-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <a href="${folderLink}" target="_blank" class="inline-flex items-center gap-2 text-zohoBlue font-bold hover:underline"><i data-lucide="folder-open" class="w-4 h-4"></i> Open Document/Folder in Drive</a>
          </div>
        `;
    }

    document.getElementById('detailsModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeDetailsModal() { 
    document.getElementById('detailsModal').classList.add('hidden'); 
}

function openEditModal(rowIndex) {
    const record = allRecords.find(r => r.rowIndex === rowIndex);
    if(!record) return;

    document.getElementById('editRowIndex').value = rowIndex;
    document.getElementById('editWorkStatus').value = record['SERVICE_STATUS'] || '';
    document.getElementById('editPayStatus').value = record['PAYMENT_STATUS'] || 'Not Received';
    document.getElementById('editFee').value = record['FEE_AMOUNT'] || '';
    
    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() { 
    document.getElementById('editModal').classList.add('hidden'); 
}

// Edit Form Submission
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveEditBtn');
    btn.innerText = "Saving..."; 
    btn.disabled = true;

    const payload = {
        action: 'update',
        rowIndex: document.getElementById('editRowIndex').value,
        'SERVICE_STATUS': document.getElementById('editWorkStatus').value,
        'PAYMENT_STATUS': document.getElementById('editPayStatus').value,
        'FEE_AMOUNT': document.getElementById('editFee').value
    };

    try {
        await fetch(scriptURL, { 
            method: 'POST', 
            body: JSON.stringify(payload) 
        });
        closeEditModal();
        loadRecords();
    } catch (err) {
        alert("Failed to update.");
        console.error(err);
    } finally {
        btn.innerText = "Save Changes"; 
        btn.disabled = false;
    }
});
