// Application State
let state = { 
    clients: [], credentials: [], tasks: [], 
    activeTab: 'dashboard', viewMode: 'table', 
    sortCol: null, sortAsc: true 
};
let taskChartInstance = null;

window.onload = () => { 
    // Splash Screen timeout
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) { splash.classList.add('opacity-0'); setTimeout(() => splash.style.display = 'none', 500); }
    }, 1000);

    // Initial View Mode Icon
    document.getElementById('view-icon').className = state.viewMode === 'grid' ? 'fa-solid fa-table' : 'fa-solid fa-grip';

    // Real-time fee calculator listeners
    document.querySelectorAll('.fee-calc').forEach(el => {
        el.addEventListener('input', () => {
            const g = parseFloat(document.getElementById('t_Govt_Fee').value) || 0;
            const a = parseFloat(document.getElementById('t_Additional_Fee').value) || 0;
            const p = parseFloat(document.getElementById('t_Professional_Fee').value) || 0;
            const received = parseFloat(document.getElementById('t_Amount_Received').value) || 0;
            
            const total = g + a + p;
            document.getElementById('t_Total_Amount').value = total;
            document.getElementById('t_Balance_Due').value = total - received;
        });
    });

    fetchApiData(); 
    switchTab('dashboard'); 
};

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(e => console.log(e)));
}

// UI Functions
function switchTab(tabId) {
    document.querySelectorAll('.tab-section').forEach(el => el.classList.add('hidden', 'opacity-0'));
    
    const activeSection = document.getElementById('view-' + tabId);
    activeSection.classList.remove('hidden');
    setTimeout(() => activeSection.classList.remove('opacity-0'), 50);
    
    // Sidebar & Nav Activation
    document.querySelectorAll('.side-item').forEach(el => el.className = "side-item w-full flex items-center px-3 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-brand-600 rounded-xl font-medium transition-colors group");
    const desktopBtn = document.getElementById('side-' + tabId);
    if(desktopBtn) desktopBtn.className = "side-item w-full flex items-center px-3 py-2.5 bg-brand-50 text-brand-700 rounded-xl font-semibold transition-colors group";
    
    document.querySelectorAll('.nav-item').forEach(el => el.className = "nav-item flex flex-col items-center justify-center w-[16%] h-14 text-gray-400 hover:text-gray-600 transition-colors");
    const mobileBtn = document.getElementById('nav-' + tabId);
    if(mobileBtn) mobileBtn.className = "nav-item flex flex-col items-center justify-center w-[16%] h-14 text-brand-600 transition-colors";
    
    state.activeTab = tabId;
    document.getElementById('global-search').value = '';
    renderData();
}

function toggleViewMode() {
    state.viewMode = state.viewMode === 'grid' ? 'table' : 'grid';
    document.getElementById('view-icon').className = state.viewMode === 'grid' ? 'fa-solid fa-table' : 'fa-solid fa-grip';
    renderData();
}

function handleSearch() { renderData(document.getElementById('global-search').value); }

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.remove('opacity-0', 'translate-y-[-10px]');
    setTimeout(() => toast.classList.add('opacity-0', 'translate-y-[-10px]'), 2500);
}

// Modal Functions
function openModal(id) { 
    const el = document.getElementById(id);
    el.classList.remove('hidden'); 
    el.classList.add('flex');
    
    document.querySelectorAll(`#${id} input:not([type="hidden"]), #${id} select`).forEach(el => el.value = '');
    document.querySelectorAll(`#${id} input[type="hidden"]`).forEach(el => el.value = '');
    
    if(id==='modal-client') document.getElementById('client-modal-title').innerText = 'Add Client';
    if(id==='modal-cred') document.getElementById('cred-modal-title').innerText = 'Add Credential';
    if(id==='modal-task') {
        document.getElementById('task-modal-title').innerText = 'Add Task';
        document.getElementById('t_Task_Date').valueAsDate = new Date();
        ['t_Govt_Fee','t_Additional_Fee','t_Professional_Fee','t_Total_Amount','t_Amount_Received','t_Balance_Due'].forEach(i => document.getElementById(i).value='0');
        document.getElementById('t_Task_Status').value = 'Pending';
    }
    if(id==='modal-transaction') {
        document.getElementById('tx_Date').valueAsDate = new Date();
        document.getElementById('tx_Mode').value = 'UPI';
    }
}

function closeModal(id) { 
    const el = document.getElementById(id);
    el.classList.add('hidden');
    el.classList.remove('flex');
}

// Calculator Logic
let calcVal = '0';
function calcAction(char) {
    const display = document.getElementById('calc-display');
    if (char === 'C') { calcVal = '0'; }
    else if (char === '=') { 
        try { calcVal = eval(calcVal).toString(); } 
        catch(e) { calcVal = 'Error'; }
    }
    else {
        if (calcVal === '0' || calcVal === 'Error') calcVal = char;
        else calcVal += char;
    }
    display.value = calcVal;
}

// ... Add remaining rendering functions here (renderData, renderChart, populateClientDropdowns, openEditClient, openEditTask, generateAndUploadPI, etc. exactly as they were in the massive script)
