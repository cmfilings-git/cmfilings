const API_URL = "https://script.google.com/macros/s/AKfycbycaWZk3IFv3WmBJCx9Q3UslPbZBzCgRSLsUF1KnB0EDQlDrEnJ0-hitv_KFRhH8pFm/exec"; 

async function fetchApiData() {
    const icon = document.getElementById('sync-icon');
    if(icon) icon.classList.add('syncing');
    try {
        const [cliRes, credRes, taskRes] = await Promise.all([
            fetch(`${API_URL}?action=getClients`).then(r => r.json()),
            fetch(`${API_URL}?action=getCredentials`).then(r => r.json()),
            fetch(`${API_URL}?action=getTasks`).then(r => r.json())
        ]);
        
        state.clients = Array.isArray(cliRes) ? cliRes : [];
        state.credentials = Array.isArray(credRes) ? credRes : [];
        state.tasks = Array.isArray(taskRes) ? taskRes : [];
        
        populateClientDropdowns();
        renderData();
        showToast("Data Synced");
    } catch (err) {
        console.error(err);
        showToast("Sync Failed!");
    }
    if(icon) icon.classList.remove('syncing');
}

async function saveRecord(sheetName) {
    let data = {}, idValue = null;
    
    if(sheetName === 'Clients') {
        idValue = document.getElementById('c_Client_ID').value;
        data = { 
            Client_Name: document.getElementById('c_Client_Name').value, 
            Mobile: document.getElementById('c_Mobile').value, 
            Email: document.getElementById('c_Email').value,
            Adhar_No: document.getElementById('c_Adhar_No').value,
            Pan_No: document.getElementById('c_Pan_No').value,
            Constitution_Type: document.getElementById('c_Constitution_Type').value,
            Status: document.getElementById('c_Status').value,
            Branch: document.getElementById('c_Branch').value,
            Doc_Folder_Link_URL: document.getElementById('c_Doc_Folder_Link_URL').value,
            Notes: document.getElementById('c_Notes').value
        };
    } else if (sheetName === 'Credentials') {
        idValue = document.getElementById('cr_Cred_ID').value;
        data = { 
            Client_ID: document.getElementById('cr_Client_ID').value, 
            Client_Name: document.getElementById('cr_Client_Name').value,
            Portal_Name: document.getElementById('cr_Portal_Name').value, 
            Portal_Doc_No: document.getElementById('cr_Portal_Doc_No').value,
            User_Name: document.getElementById('cr_User_Name').value, 
            Password: document.getElementById('cr_Password').value 
        };
    } else if (sheetName === 'Tasks') {
        idValue = document.getElementById('t_Task_ID').value;
        data = { 
            Task_Date: document.getElementById('t_Task_Date').value,
            Client_ID: document.getElementById('t_Client_ID').value, 
            Client_Name: document.getElementById('t_Client_Name').value, 
            Task_Name: document.getElementById('t_Task_Name').value, 
            Period: document.getElementById('t_Period').value, 
            Task_Status: document.getElementById('t_Task_Status').value,
            Portal_No: document.getElementById('t_Portal_No').value,
            User_Name: document.getElementById('t_User_Name').value,
            Password: document.getElementById('t_Password').value,
            Govt_Fee: document.getElementById('t_Govt_Fee').value,
            Additional_Fee: document.getElementById('t_Additional_Fee').value,
            Professional_Fee: document.getElementById('t_Professional_Fee').value,
            Total_Amount: document.getElementById('t_Total_Amount').value,
            Amount_Received: document.getElementById('t_Amount_Received').value,
            Balance_Due: document.getElementById('t_Balance_Due').value,
            Invoice_No: document.getElementById('t_Invoice_No').value,
            Akn_No: document.getElementById('t_Akn_No').value,
            Akn_Date: document.getElementById('t_Akn_Date').value,
            Akn_Link: document.getElementById('t_Akn_Link').value
        };
    } else if (sheetName === 'Transactions') {
        data = {
            Date: document.getElementById('tx_Date').value,
            Client_ID: document.getElementById('tx_Client_ID') ? document.getElementById('tx_Client_ID').value : '', 
            Task_ID: document.getElementById('tx_Task_ID').value,
            Amount: document.getElementById('tx_Amount').value,
            Mode: document.getElementById('tx_Mode').value,
            Ref_No: document.getElementById('tx_Ref').value
        };
    }

    const action = idValue ? 'edit' : 'add';
    const payload = { action, sheetName, data, idValue };

    showToast("Saving...");
    closeModal(`modal-${sheetName === 'Clients' ? 'client' : sheetName === 'Credentials' ? 'cred' : sheetName === 'Tasks' ? 'task' : 'transaction'}`);

    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) }).then(r=>r.json());
        if(res.error) throw new Error(res.error);
        showToast("Saved Successfully!");
        fetchApiData();
    } catch (err) {
        console.error(err);
        showToast("Error Saving Data");
    }
}

async function deleteRecord(sheetName, idValue) {
    if(!confirm(`Delete record?`)) return;
    showToast("Deleting...");
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'delete', sheetName, idValue }) }).then(r=>r.json());
        if(res.error) throw new Error(res.error);
        showToast("Deleted!");
        fetchApiData();
    } catch (err) {
        showToast("Error Deleting");
    }
}
