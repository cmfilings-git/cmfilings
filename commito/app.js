// Ensure functions are universally accessible regardless of injection method
window.toggleDesktopSidebar = function() {
    const sidebarNode = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    
    if (sidebarNode) {
        sidebarNode.classList.toggle('sidebar-collapsed');
        
        // Dynamically swap the icon arrow direction
        if (toggleBtn) {
            if (sidebarNode.classList.contains('sidebar-collapsed')) {
                toggleBtn.innerHTML = '<i data-lucide="chevron-right" class="w-4 h-4"></i>';
            } else {
                toggleBtn.innerHTML = '<i data-lucide="chevron-left" class="w-4 h-4"></i>';
            }
            if (window.lucide) lucide.createIcons(); // Render new SVG
        }
    }
};

window.toggleMobileSidebar = function() {  
    const sidebarNode = document.getElementById('sidebar');
    const overlayNode = document.getElementById('sidebarOverlay');
    
    if (!sidebarNode || !overlayNode) return;

    if (sidebarNode.classList.contains('hidden')) {  
        sidebarNode.classList.remove('-translate-x-full', 'hidden');
        overlayNode.classList.remove('hidden');  
    } else {  
        sidebarNode.classList.add('-translate-x-full');  
        setTimeout(() => { sidebarNode.classList.add('hidden'); }, 300);
        overlayNode.classList.add('hidden');  
    }  
};

window.toggleSubmenu = function(submenuId, triggerBtnNode) {  
    const targetSubmenuNode = document.getElementById(submenuId);  
    if (targetSubmenuNode) {
        targetSubmenuNode.classList.toggle('open');  
        const chevron = triggerBtnNode.querySelector('.chevron-icon');
        if (chevron) chevron.classList.toggle('rotate-180');
    }  
};

window.syncData = function() {  
    const syncBtn = document.getElementById('sync-icon');  
    if (syncBtn) {
        syncBtn.classList.add('syncing');  
        setTimeout(() => syncBtn.classList.remove('syncing'), 1000);  
    }
};

// Main DOM Loader
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Safe Fetch for Split Components (Requires a Local Web Server)
    try {
        const loadHTMLComponent = async (url, containerId) => {
            const response = await fetch(url);
            if(!response.ok) throw new Error("File fetch failed");
            const textHTML = await response.text();
            document.getElementById(containerId).innerHTML = textHTML;
        };

        await Promise.all([
            loadHTMLComponent('sidebar.html', 'sidebar-container'),
            loadHTMLComponent('header.html', 'header-container'),
            loadHTMLComponent('bottom-nav.html', 'bottom-nav-container')
        ]);
    } catch(err) {
        console.warn("Component fetch skipped. Use a local web server (e.g. VS Code Live Server) to load split HTML files.");
    }

    // 2. Initialize Lucide Icons immediately after HTML injection
    try {
        if (window.lucide) lucide.createIcons();
    } catch(e) {
        console.error("Lucide icons could not be initialized.");
    }

    // 3. Render Task Donut Chart
    try {
        const donutCanvasTarget = document.getElementById('taskDonut');
        if (donutCanvasTarget) {
            new Chart(donutCanvasTarget.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Pending', 'On Hold'],
                    datasets: [{
                        data: [45, 18, 9],
                        backgroundColor: ['#00b955', '#f59e0b', '#0f172a'],
                        borderWidth: 3,
                        borderColor: '#ffffff',
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: { legend: { display: false } }
                }
            });
        }
    } catch(e) { console.error("Donut chart failed", e); }

    // 4. Render Financial Summary Bar Chart
    try {
        const summaryBarCanvasTarget = document.getElementById('salesPurchaseChart');
        if (summaryBarCanvasTarget) {
            const ctxBarInstance = summaryBarCanvasTarget.getContext('2d');
            
            const salesGradient = ctxBarInstance.createLinearGradient(0, 0, 0, 300);
            salesGradient.addColorStop(0, '#00b955');
            salesGradient.addColorStop(1, '#008f39');

            const purchaseGradient = ctxBarInstance.createLinearGradient(0, 0, 0, 300);
            purchaseGradient.addColorStop(0, '#0f172a');
            purchaseGradient.addColorStop(1, '#1e293b');

            new Chart(ctxBarInstance, {
                type: 'bar',
                data: {
                    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
                    datasets: [
                        { label: 'Sales Volume', data: [150000, 180000, 140000, 220000, 190000, 260000, 310000, 280000, 340000, 380000, 420000, 480000], backgroundColor: salesGradient, borderRadius: 6, barPercentage: 0.5 },
                        { label: 'Purchase Volume', data: [110000, 140000, 100000, 180000, 150000, 210000, 250000, 230000, 280000, 310000, 340000, 390000], backgroundColor: purchaseGradient, borderRadius: 6, barPercentage: 0.5 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } },
                        x: { grid: { display: false }, ticks: { color: '#475569' } }
                    },
                    plugins: {
                        legend: { position: 'top', align: 'end', labels: { color: '#0f172a', usePointStyle: true, pointStyle: 'circle' } }
                    }
                }
            });
        }
    } catch(e) { console.error("Bar chart failed", e); }
});