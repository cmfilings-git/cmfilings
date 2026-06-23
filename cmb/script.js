// Change the capital "D" to a lowercase "d"
document.addEventListener("DOMContentLoaded", () => {
    
    // ... the rest of your code remains exactly the same!

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. SIDEBAR & HAMBURGER MENU LOGIC
    // ==========================================
    const hamburgerBtn = document.querySelector('.btn-primary-menu');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    // Toggle Sidebar Expand/Collapse
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents click from misfiring
            
            // Toggle desktop collapse view
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded-view');
            
            // Mobile visibility toggle
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('mobile-open');
            }
        });
    }

    // Submenu Dropdown Logic (Accordion)
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault(); 
            const parentItem = toggle.closest('.has-dropdown');
            
            // Auto-expand sidebar if a submenu is clicked while collapsed
            if (sidebar.classList.contains('collapsed')) {
                sidebar.classList.remove('collapsed');
                mainContent.classList.remove('expanded-view');
            }

            // Close other open submenus
            document.querySelectorAll('.has-dropdown.open').forEach(openItem => {
                if(openItem !== parentItem) openItem.classList.remove('open');
            });

            // Toggle the clicked submenu
            parentItem.classList.toggle('open');
        });
    });

    // ==========================================
    // 2. DD/MM/YYYY DATE FORMAT ENFORCER
    // ==========================================
    // This forces native date pickers to display as dd/mm/yyyy
    const dateInputs = document.querySelectorAll('input[type="date"]');
    
    dateInputs.forEach(input => {
        // Start as text so we can manipulate the display format
        input.type = 'text';
        input.placeholder = 'dd/mm/yyyy';

        // When user clicks, turn it back into a native date picker
        input.addEventListener('focus', function() {
            this.type = 'date';
        });

        // When user clicks away, format the chosen date to dd/mm/yyyy
        input.addEventListener('blur', function() {
            if (this.value) {
                // Native value is always yyyy-mm-dd, so we split and rearrange
                const dateParts = this.value.split('-'); 
                if (dateParts.length === 3) {
                    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                    this.type = 'text';
                    this.value = formattedDate;
                }
            } else {
                this.type = 'text';
            }
        });
    });

    // ==========================================
    // 3. CHART.JS INITIALIZATION
    // ==========================================
    const canvasElement = document.getElementById('cashFlowChart');
    if (canvasElement) {
        const ctx = canvasElement.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], 
                datasets: [
                    {
                        label: 'Inflow (₹)',
                        data: [15000, 22000, 18000, 28000, 25000, 32000],
                        borderColor: '#4b6e7a', 
                        backgroundColor: 'rgba(75, 110, 122, 0.1)',
                        borderWidth: 2,
                        tension: 0.4, 
                        fill: true,
                        pointBackgroundColor: '#4b6e7a'
                    },
                    {
                        label: 'Outflow (₹)',
                        data: [12000, 19000, 15000, 20000, 22000, 25000],
                        borderColor: '#c62828', 
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
                        labels: { usePointStyle: true, boxWidth: 8 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: function(value) { return '₹' + (value / 1000) + 'k'; } },
                        grid: { color: '#e2e5ea' }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }
});

// ==========================================
// 4. TOOLBAR DROPDOWN MENUS (Sort/Filter/Export)
// ==========================================
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
