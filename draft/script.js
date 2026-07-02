// Dynamic Calendar Baseline Timestamp Engine Rules
const initialDateTime = new Date(); 
const calculatedCustomString = `${initialDateTime.getDate()}/${initialDateTime.getMonth()+1}/${initialDateTime.getFullYear()} 02:05 PM`;
document.querySelectorAll('.time-stamp-target').forEach(el => el.innerText = calculatedCustomString);

let cashFlowChartInstance = null;  
let donutChartInstance = null;

// Load Asynchronous External Desktop Components
function loadDesktopSidebarModule() {
    const targetPlaceholder = document.getElementById('sidebar-placeholder');
    if (targetPlaceholder && window.innerWidth >= 1024) {
        fetch('slidebar.html')
            .then(res => res.text())
            .then(htmlMarkup => {
                targetPlaceholder.innerHTML = htmlMarkup;
                initDesktopSidebarScripts();
                lucide.createIcons();
            })
            .catch(err => console.error("Error embedding sidebar source code components:", err));
    }
}

function initDesktopSidebarScripts() {
    const desktopSidebarCollapseBtn = document.getElementById('desktopSidebarCollapseBtn');
    const collapseBtnIcon = document.getElementById('collapseBtnIcon');
    const sidebarElement = document.getElementById('sidebar');

    if(desktopSidebarCollapseBtn && sidebarElement) {
        desktopSidebarCollapseBtn.addEventListener('click', () => {
            sidebarElement.classList.toggle('collapsed');
            const isCollapsed = sidebarElement.classList.contains('collapsed');
            sidebarElement.style.width = isCollapsed ? '70px' : '260px';
            document.querySelectorAll('.sidebar-hide-target').forEach(el => el.style.display = isCollapsed ? 'none' : 'block');
            if(collapseBtnIcon) {
                collapseBtnIcon.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
    }
}

function toggleSubmenu(id, btnElement) {  
    const container = document.getElementById(id);  
    if (container) {  
        container.classList.toggle('open');  
        const arrowIcon = btnElement.querySelector('[data-lucide="chevron-down"]');
        if (arrowIcon) arrowIcon.classList.toggle('rotate-180');
    }  
}  

// Desktop Input Field Reset Utilities
function clearSearchInput() {
    const searchInput = document.getElementById('masterHeaderSearch');
    if(searchInput) {
        searchInput.value = '';
        document.querySelector('.clear-search-btn').classList.add('hidden');
    }
}

const masterSearchInput = document.getElementById('masterHeaderSearch');
if(masterSearchInput) {
    masterSearchInput.addEventListener('input', function(e) {
        const clearBtn = document.querySelector('.clear-search-btn');
        if(e.target.value.length > 0) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
    });
}

// Light & Dark Theme Swapper Engine Control Interface Setup
const themeToggleBtn = document.getElementById('themeToggleBtn');
if(themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        document.documentElement.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark-mode');
        themeToggleBtn.innerHTML = isDark ? '<i data-lucide="sun" class="w-4 h-4"></i>' : '<i data-lucide="moon" class="w-4 h-4"></i>';
        lucide.createIcons();
        
        if(cashFlowChartInstance) {
            const chartGridColor = isDark ? '#334155' : '#f1f5f9';
            cashFlowChartInstance.options.scales.y.grid.color = chartGridColor;
            cashFlowChartInstance.options.scales.x.grid.color = chartGridColor;
            cashFlowChartInstance.update();
        }
    });
}

// Classic Realtime Digital Date Time Display Engine Ticker
function tickClassicLiveTime() {
    const dateEl = document.getElementById('classicTickerDate');
    const timeEl = document.getElementById('classicTickerTime');
    if(dateEl && timeEl) {
        const liveNow = new Date();
        dateEl.textContent = liveNow.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        timeEl.textContent = liveNow.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}
setInterval(tickClassicLiveTime, 1000);
tickClassicLiveTime();

// Chart.js Vectors Initialisation
function initAppCharts() {  
    Chart.defaults.font.family = '"Poppins", sans-serif';  
    Chart.defaults.color = '#94a3b8';
    
    const ctx1 = document.getElementById('cashFlowChart');  
    if(ctx1) {
        cashFlowChartInstance = new Chart(ctx1, {  
            type: 'line',  
            data: {  
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],  
                datasets: [  
                    { label: 'Inflow', data: [46000, 54000, 51000, 64000, 59000, 71000], borderColor: '#16a34a', backgroundColor: '#16a34a', borderWidth: 2, tension: 0.35, pointRadius: 2 },  
                    { label: 'Outflow', data: [31000, 41000, 36000, 44000, 45000, 50000], borderColor: '#dc2626', backgroundColor: '#dc2626', borderWidth: 2, tension: 0.35, pointRadius: 2 }  
                ]  
                },  
            options: {  
                responsive: true,  
                maintainAspectRatio: false,  
                plugins: { legend: { display: false } },  
                scales: {  
                    y: { grid: { color: '#f1f5f9', drawBorder: false }, ticks: { font: { size: 10 } } },  
                    x: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } }  
                }  
            }  
        });  
    }

    const ctx2 = document.getElementById('taskDonutBarChart');
    if(ctx2) {
        donutChartInstance = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending'],
                datasets: [{
                    data: [45, 5],
                    backgroundColor: ['#16a34a', '#dc2626'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: { legend: { display: false } }
            }
        });
    }
}  

function syncData() {  
    const syncIcon = document.getElementById('sync-icon');  
    if(syncIcon) syncIcon.classList.add('syncing');  
    setTimeout(() => { if(syncIcon) syncIcon.classList.remove('syncing'); }, 1000);  
}  

window.addEventListener('DOMContentLoaded', () => {
    loadDesktopSidebarModule();
    initAppCharts();
    lucide.createIcons();
});
