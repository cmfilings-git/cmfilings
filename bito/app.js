document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch & Inject HTML Components (If running on a server)
    try {
        const loadHTML = async (url, id) => {
            const response = await fetch(url);
            const text = await response.text();
            document.getElementById(id).innerHTML = text;
        };

        await loadHTML('sidebar.html', 'sidebar-container');
        await loadHTML('header.html', 'header-container');
        await loadHTML('bottom-nav.html', 'bottom-nav-container');
    } catch(e) {
        console.log("HTML Partials not loaded. Ensure you are running on a local server, or manually paste the HTML contents.");
    }

    // 2. Initialize Icons and UI after components load
    lucide.createIcons();

    // 3. Splash Screen Exit
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 500);
        }
    }, 1200);
});

// Sidebar Variables
let isMobileSidebarOpen = false;

function toggleDesktopSidebar() {
    const sidebar = document.getElementById('sidebar');
    if(sidebar) {
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('lg:flex');
    }
}

function toggleMobileSidebar() {  
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if(!sidebar || !overlay) return;

    isMobileSidebarOpen = !isMobileSidebarOpen;  
    if (isMobileSidebarOpen) {  
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.remove('hidden');
        overlay.classList.remove('hidden');  
    } else {  
        sidebar.classList.add('-translate-x-full');  
        setTimeout(() => { if(!isMobileSidebarOpen) sidebar.classList.add('hidden'); }, 300);
        overlay.classList.add('hidden');  
    }  
}  

// Submenu Accordion Logic
function toggleSubmenu(id, btnElement) {  
    const container = document.getElementById(id);  
    if (container) {  
        container.classList.toggle('open');  
        const arrowIcon = btnElement.querySelector('.chevron-icon');
        if (arrowIcon) {
            arrowIcon.classList.toggle('rotate-180');
        }
    }  
}  

// Sync Animation
function syncData() {  
    const syncIcon = document.getElementById('sync-icon');  
    if(syncIcon) {
        syncIcon.classList.add('syncing');  
        setTimeout(() => syncIcon.classList.remove('syncing'), 1000);  
    }
}
