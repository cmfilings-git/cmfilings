document.addEventListener("DOMContentLoaded", () => {
    
    // Elements
    const hamburgerBtn = document.querySelector('.btn-primary-menu');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    // 1. Hamburger Menu Toggle (Sidebar Expand/Collapse)
    hamburgerBtn.addEventListener('click', () => {
        // Toggle desktop collapse view
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded-view');
        
        // Mobile visibility toggle
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('mobile-open');
        }
    });

    // 2. Submenu Dropdown Logic
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            const parentItem = toggle.closest('.has-dropdown');
            
            // If the user clicks a dropdown while the sidebar is completely collapsed,
            // automatically expand the sidebar so they can see the submenu items.
            if (sidebar.classList.contains('collapsed')) {
                sidebar.classList.remove('collapsed');
                mainContent.classList.remove('expanded-view');
            }

            // Close other open submenus (Accordion style)
            // Remove the next 3 lines if you want multiple submenus open at once
            document.querySelectorAll('.has-dropdown.open').forEach(openItem => {
                if(openItem !== parentItem) openItem.classList.remove('open');
            });

            // Toggle the clicked submenu
            parentItem.classList.toggle('open');
        });
    });
});
