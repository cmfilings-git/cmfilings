// js/app.js
let state = { 
    clients: [], credentials: [], tasks: [], ledgers: [], transactions: [],
    activeTab: 'dashboard', viewMode: 'table', sortCol: null, sortAsc: true 
};

window.onload = () => { 
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) { splash.classList.add('opacity-0'); setTimeout(() => splash.style.display = 'none', 500); }
    }, 1000);

    fetchApiData(); // Fetches all data. showNavigation() is called on success inside API.
};

function showNavigation() {
    const header = document.getElementById('main-header');
    const bottomNav = document.getElementById('mobile-bottom-nav');
    if (header) { header.classList.remove('hidden'); header.classList.add('flex'); }
    if (bottomNav) { bottomNav.classList.remove('hidden'); bottomNav.classList.add('flex'); }
}

function populateDropdowns() {
    // Populate Client Datalist
    const datalist = document.getElementById('clientDatalist');
    if(datalist) datalist.innerHTML = state.clients.map(c => `<option value="${c.Client_Name} (${c.Client_ID})">`).join('');

    // Populate Ledger Dropdowns
    const ledgerDropdowns = document.querySelectorAll('.ledger-dropdown');
    const lOpts = `<option value="">Select Ledger...</option>` + state.ledgers.map(l => `<option value="${l.Ledger_Name}">${l.Ledger_Name}</option>`).join('');
    ledgerDropdowns.forEach(d => d.innerHTML = lOpts);
}

function renderData(search = '') {
    const term = search.toLowerCase();
    
    // ... [KEEP DASHBOARD, CLIENTS, CREDS, TASKS RENDER LOGIC] ...
    
    // === LEDGERS ===
    if (state.activeTab === 'ledgers') {
        const container = document.getElementById('ledgers-list');
        let filtered = state.ledgers.filter(l => (l.Ledger_Name||'').toLowerCase().includes(term));
        
        container.className = "";
        container.innerHTML = `
            <div class="bg-white dark:bg-grayDark rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
                <table class="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr class="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ledger ID</th>
                            <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ledger Name</th>
                            <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                            <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Op. Bal</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                        ${filtered.map(l => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <td class="px-6 py-4 text-sm font-mono text-gray-500">${l.Ledger_ID || '-'}</td>
                                <td class="px-6 py-4 font-bold text-brand-600">${l.Ledger_Name}</td>
                                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">${l.Ledger_Category}</td>
                                <td class="px-6 py-4 text-sm font-bold text-right ${l.Dr_Cr==='Cr' ? 'text-emerald-500' : 'text-rose-500'}">₹${l.Op_Bal} ${l.Dr_Cr}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
    }

    // === TRANSACTIONS (Merging Manual Txs + Tasks as Sales) ===
    if (state.activeTab === 'transactions') {
        const container = document.getElementById('transactions-list');
        
        // 1. Map existing Tasks to "Sales" Transactions for unified view
        const mappedTasks = state.tasks.map(t => ({
            Transaction_ID: t.Task_ID || '-',
            Date: t.Task_Date || '-',
            Voucher_Type: 'Sales (Auto)',
            Client_Name: t.Client_Name || '-',
            Ledger_Dr: t.Client_Name || 'Sundry Debtors',
            Amount_Dr: t.Total_Amount || 0,
            Ledger_Cr: 'Sales Accounts',
            Amount_Cr: t.Total_Amount || 0,
            Amount: t.Total_Amount || 0,
            Reference_No: t.Invoice_No || '-',
            Notes: `Task: ${t.Task_Name} | ${t.Period}`
        }));

        // 2. Combine with actual manually entered transactions
        let allTransactions = [...mappedTasks, ...state.transactions];

        let filtered = allTransactions.filter(tx => 
            (tx.Client_Name||'').toLowerCase().includes(term) || 
            (tx.Transaction_ID||'').toLowerCase().includes(term) ||
            (tx.Voucher_Type||'').toLowerCase().includes(term)
        );

        container.className = "";
        container.innerHTML = `
            <div class="bg-white dark:bg-grayDark rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
                <table class="w-full text-left border-collapse min-w-[1100px]">
                    <thead>
                        <tr class="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Voucher / Ref</th>
                            <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Particulars (Dr / Cr)</th>
                            <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Debit (₹)</th>
                            <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Credit (₹)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                        ${filtered.map(tx => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <td class="px-6 py-4 text-sm font-bold text-gray-600">${tx.Date}</td>
                                <td class="px-6 py-4">
                                    <span class="inline-flex py-1 px-2.5 rounded bg-brand-50 text-brand-700 text-[11px] font-bold border border-brand-100 uppercase tracking-wide mb-1">${tx.Voucher_Type}</span><br>
                                    <span class="text-xs text-gray-400 font-mono">${tx.Transaction_ID}</span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="font-bold text-gray-900 dark:text-white">By ${tx.Ledger_Dr}</div>
                                    <div class="text-sm text-gray-500 ml-4">To ${tx.Ledger_Cr}</div>
                                    <div class="text-xs text-gray-400 mt-1 italic">${tx.Notes}</div>
                                </td>
                                <td class="px-6 py-4 text-right font-bold text-rose-600">₹${tx.Amount_Dr || tx.Amount || 0}</td>
                                <td class="px-6 py-4 text-right font-bold text-emerald-600">₹${tx.Amount_Cr || tx.Amount || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
    }
}
