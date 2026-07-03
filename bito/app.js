import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app); 
window.db = db; 

// Auth Persistence Check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html'; 
    } else {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            setTimeout(() => {
                splash.style.opacity = '0';
                splash.style.pointerEvents = 'none';
                setTimeout(() => splash.remove(), 500);
            }, 800);
        }
    }
});

window.isMobileSidebarExpanded = false;

window.logoutUser = () => {
    signOut(auth).then(() => { window.location.href = 'login.html'; });
};

window.toggleDesktopSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtnIcon = document.querySelector('.toggle-icon');
    
    if (sidebar) {
        sidebar.classList.toggle('is-expanded');
        if (sidebar.classList.contains('is-expanded')) {
            toggleBtnIcon.setAttribute('data-lucide', 'panel-left-close');
        } else {
            toggleBtnIcon.setAttribute('data-lucide', 'panel-left-open');
            document.querySelectorAll('.submenu.open').forEach(sub => {
                sub.classList.remove('open');
                const chevron = sub.previousElementSibling.querySelector('.chevron-icon');
                if (chevron) chevron.classList.remove('rotate-180');
            });
        }
        if (window.lucide) lucide.createIcons();
    }
};

window.toggleMobileSidebar = () => {  
    const sidebarNode = document.getElementById('sidebar');
    const overlayNode = document.getElementById('sidebarOverlay');
    if (!sidebarNode || !overlayNode) return;

    window.isMobileSidebarExpanded = !window.isMobileSidebarExpanded;  
    if (window.isMobileSidebarExpanded) {  
        sidebarNode.classList.remove('-translate-x-full');
        overlayNode.classList.remove('hidden');
        setTimeout(() => overlayNode.classList.add('opacity-100'), 10);
    } else {  
        sidebarNode.classList.add('-translate-x-full');  
        overlayNode.classList.remove('opacity-100');
        setTimeout(() => overlayNode.classList.add('hidden'), 300);
    }  
};

window.toggleSubmenu = (submenuId, triggerBtnNode) => {  
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth >= 1024 && !sidebar.classList.contains('is-expanded')) {
        window.toggleDesktopSidebar();
    }
    const targetSubmenuNode = document.getElementById(submenuId);  
    if (targetSubmenuNode) {
        targetSubmenuNode.classList.toggle('open');  
        const chevron = triggerBtnNode.querySelector('.chevron-icon');
        if (chevron) chevron.classList.toggle('rotate-180');
    }  
};

window.syncData = () => {  
    const syncBtn = document.getElementById('sync-icon');  
    if (syncBtn) {
        syncBtn.classList.add('syncing');  
        setTimeout(() => syncBtn.classList.remove('syncing'), 1000);  
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Safe Fetch using outerHTML to prevent flex squeeze bugs
    try {
        const loadHTMLComponent = async (url, containerId) => {
            const response = await fetch(url);
            if(!response.ok) throw new Error("File fetch failed");
            const textHTML = await response.text();
            const container = document.getElementById(containerId);
            if (container) container.outerHTML = textHTML; // Completely replaces wrapper
        };

        await Promise.all([
            loadHTMLComponent('sidebar.html', 'sidebar-container'),
            loadHTMLComponent('header.html', 'header-container'),
            loadHTMLComponent('bottom-nav.html', 'bottom-nav-container')
        ]);
    } catch(err) {
        console.warn("Component fetch skipped. Use a local web server.");
    }

    // 2. Initialize Lucide Icons
    try {
        if (window.lucide) lucide.createIcons();
    } catch(e) { }

    // 3. Render Donut Chart
    try {
        const dCtx = document.getElementById('taskDonut');
        if (dCtx) {
            new Chart(dCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Pending', 'On Hold'],
                    datasets: [{ data: [45, 18, 9], backgroundColor: ['#00b955', '#f59e0b', '#0f172a'], borderWidth: 3, borderColor: '#ffffff' }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } }
            });
        }

        // 4. Render Financial Bar Chart
        const barCtx = document.getElementById('salesPurchaseChart');
        if (barCtx) {
            const ctxBar = barCtx.getContext('2d');
            const sg = ctxBar.createLinearGradient(0,0,0,300); sg.addColorStop(0,'#00b955'); sg.addColorStop(1,'#008f39');
            const pg = ctxBar.createLinearGradient(0,0,0,300); pg.addColorStop(0,'#0f172a'); pg.addColorStop(1,'#1e293b');
            
            new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
                    datasets: [
                        { label: 'Sales', data: [150000, 180000, 140000, 220000, 190000, 260000, 310000, 280000, 340000, 380000, 420000, 480000], backgroundColor: sg, borderRadius: 6, barPercentage: 0.5 },
                        { label: 'Purchase', data: [110000, 140000, 100000, 180000, 150000, 210000, 250000, 230000, 280000, 310000, 340000, 390000], backgroundColor: pg, borderRadius: 6, barPercentage: 0.5 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#475569' } } }, plugins: { legend: { position: 'top', align: 'end', labels: { color: '#0f172a', usePointStyle: true, pointStyle: 'circle' } } } }
            });
        }

        // 5. Render Project Line Chart
        const lineCtx = document.getElementById('projectLineChart');
        if (lineCtx) {
            new Chart(lineCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Proj A', 'Proj B', 'Proj C', 'Proj D', 'Proj E', 'Proj F'],
                    datasets: [{ label: 'Yield (%)', data: [-21, 1, 15, -8, 22, -5], borderColor: '#00b955', backgroundColor: 'rgba(0, 185, 85, 0.1)', borderWidth: 3, tension: 0.4, fill: true, pointBackgroundColor: '#ffffff', pointBorderColor: '#00b955', pointRadius: 5 }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', callback: function(val){ return val+'%';} } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }
            });
        }
    } catch(e) {}
    
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW failed:', err));
    }
});
