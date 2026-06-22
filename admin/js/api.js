// js/api.js
const API_URL = "https://script.google.com/macros/s/AKfycbycaWZk3IFv3WmBJCx9Q3UslPbZBzCgRSLsUF1KnB0EDQlDrEnJ0-hitv_KFRhH8pFm/exec"; 

async function fetchApiData() {
    const icon = document.getElementById('sync-icon');
    if(icon) icon.classList.add('syncing');
    try {
        // Assume API has been updated to return getLedgers and getTransactions as well
        const [cliRes, credRes, taskRes, ledRes, txRes] = await Promise.all([
            fetch(`${API_URL}?action=getClients`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}?action=getCredentials`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}?action=getTasks`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}?action=getLedgers`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}?action=getTransactions`).then(r => r.json()).catch(() => [])
        ]);
        
        state.clients = Array.isArray(cliRes) ? cliRes : [];
        state.credentials = Array.isArray(credRes) ? credRes : [];
        state.tasks = Array.isArray(taskRes) ? taskRes : [];
        state.ledgers = Array.isArray(ledRes) ? ledRes : [];
        state.transactions = Array.isArray(txRes) ? txRes : [];
        
        populateDropdowns();
        renderData();
        showToast("Data Synced Successfully");

        // Reveal UI after successful initial fetch
        showNavigation();
    } catch (err) {
        console.error(err);
        showToast("Sync Failed. Check Console.");
    }
    if(icon) icon.classList.remove('syncing');
}

async function saveRecord(sheetName) {
    let data = {}, idValue = null;
    
    // ... [KEEP PREVIOUS SAVE LOGIC FOR CLIENTS, CREDENTIALS, TASKS] ...

    if (sheetName === 'Transactions') {
        data = {
            Date: document.getElementById('tx_Date').value,
            Voucher_Type: document.getElementById('tx_Voucher_Type').value,
            Client_Name: document.getElementById('tx_Client_Name').value,
            Ledger_Dr: document.getElementById('tx_Ledger_Dr').value,
            Amount_Dr: document.getElementById('tx_Amount_Dr').value,
            Ledger_Cr: document.getElementById('tx_Ledger_Cr').value,
            Amount_Cr: document.getElementById('tx_Amount_Cr').value,
            Amount: document.getElementById('tx_Amount').value,
            Reference_No: document.getElementById('tx_Reference_No').value,
            Notes: document.getElementById('tx_Notes').value
        };
    } else if (sheetName === 'Ledgers') {
        idValue = document.getElementById('l_Ledger_ID').value;
        data = {
            Ledger_Name: document.getElementById('l_Ledger_Name').value,
            Ledger_Category: document.getElementById('l_Ledger_Category').value,
            Op_Bal: document.getElementById('l_Op_Bal').value,
            Dr_Cr: document.getElementById('l_Dr_Cr').value
        };
    }

    const action = idValue ? 'edit' : 'add';
    const payload = { action, sheetName, data, idValue };

    showToast("Saving...");
    closeModal(`modal-${sheetName.toLowerCase().replace(/s$/, '')}`); // e.g. modal-transaction

    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) }).then(r=>r.json());
        if(res.error) throw new Error(res.error);
        showToast("Saved Successfully!");
        fetchApiData();
    } catch (err) {
        showToast("Error Saving Data");
    }
}
