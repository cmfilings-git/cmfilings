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

// --- Chart.js Initialization for Main Dashboard ---
document.addEventListener("DOMContentLoaded", () => {
    const canvasElement = document.getElementById('cashFlowChart');
    
    // Only initialize if the chart exists on the current page
    if (canvasElement) {
        const ctx = canvasElement.getContext('2d');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], // Sample Indian Financial Year Data
                datasets: [
                    {
                        label: 'Inflow (₹)',
                        data: [15000, 22000, 18000, 28000, 25000, 32000],
                        borderColor: '#4b6e7a', // Muted Teal/Blue
                        backgroundColor: 'rgba(75, 110, 122, 0.1)',
                        borderWidth: 2,
                        tension: 0.4, // Smooth curved lines
                        fill: true,
                        pointBackgroundColor: '#4b6e7a'
                    },
                    {
                        label: 'Outflow (₹)',
                        data: [12000, 19000, 15000, 20000, 22000, 25000],
                        borderColor: '#c62828', // Muted Red
                        backgroundColor: 'rgba(198, 40, 40, 0.05)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#c62828'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + (value / 1000) + 'k';
                            }
                        },
                        grid: {
                            color: '#e2e5ea'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
});


// --- Dropdown Menu Logic for Sort/Filter/Export ---
function toggleDropdown(menuId) {
    // Close any currently open dropdowns
    const dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        if (dropdowns[i].id !== menuId && dropdowns[i].classList.contains('show')) {
            dropdowns[i].classList.remove('show');
        }
    }
    
    // Toggle the clicked one
    document.getElementById(menuId).classList.toggle("show");
}

// Close dropdowns if the user clicks anywhere outside of them
window.onclick = function(event) {
    if (!event.target.closest('.icon-btn')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].classList.contains('show')) {
                dropdowns[i].classList.remove('show');
            }
        }
    }
}

// --- Bulletproof Sidebar Toggle ---
document.addEventListener("DOMContentLoaded", () => {
    // Use event delegation to handle the toggle, just in case the header is loaded dynamically
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-primary-menu');
        if (btn) {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('main-content');
            
            if (sidebar && mainContent) {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded-view');
                
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('mobile-open');
                }
            }
        }
    });
});
