document.addEventListener("DOMContentLoaded", () => {
    const hamburgerBtn = document.querySelector('.btn-primary-menu');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if(sidebar && mainContent) {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded-view');
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('mobile-open');
                }
            }
        });
    }

    if (dropdownToggles) {
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault(); 
                const parentItem = toggle.closest('.has-dropdown');
                if (sidebar.classList.contains('collapsed')) {
                    sidebar.classList.remove('collapsed');
                    mainContent.classList.remove('expanded-view');
                }
                document.querySelectorAll('.has-dropdown.open').forEach(openItem => {
                    if(openItem !== parentItem) openItem.classList.remove('open');
                });
                parentItem.classList.toggle('open');
            });
        });
    }

    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.type = 'text';
        input.placeholder = 'dd/mm/yyyy';
        input.addEventListener('focus', function() { this.type = 'date'; });
        input.addEventListener('blur', function() {
            if (this.value) {
                const dateParts = this.value.split('-'); 
                if (dateParts.length === 3) {
                    this.type = 'text';
                    this.value = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                }
            } else {
                this.type = 'text';
            }
        });
    });

    const canvasElement = document.getElementById('cashFlowChart');
    if (canvasElement) {
        const ctx = canvasElement.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], 
                datasets: [
                    { label: 'Inflow (₹)', data: [15000, 22000, 18000, 28000, 25000, 32000], borderColor: '#4b6e7a', backgroundColor: 'rgba(75, 110, 122, 0.1)', borderWidth: 2, tension: 0.4, fill: true, pointBackgroundColor: '#4b6e7a' },
                    { label: 'Outflow (₹)', data: [12000, 19000, 15000, 20000, 22000, 25000], borderColor: '#c62828', backgroundColor: 'rgba(198, 40, 40, 0.05)', borderWidth: 2, tension: 0.4, fill: true, pointBackgroundColor: '#c62828' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } } }, scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return '₹' + (value / 1000) + 'k'; } }, grid: { color: '#e2e5ea' } }, x: { grid: { display: false } } } }
        });
    }
});

function toggleDropdown(menuId) {
    const dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        if (dropdowns[i].id !== menuId && dropdowns[i].classList.contains('show')) {
            dropdowns[i].classList.remove('show');
        }
    }
    document.getElementById(menuId).classList.toggle("show");
}

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

// ==========================================
// RUNNING DATE & TIME
// ==========================================
function updateLiveDateTime() {
    const dateEl = document.getElementById('live-date');
    const timeEl = document.getElementById('live-time');
    
    if (dateEl && timeEl) {
        const now = new Date();
        
        // Format Date: e.g., 23 Jun 2026
        const optionsDate = { day: '2-digit', month: 'short', year: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('en-IN', optionsDate);
        
        // Format Time: e.g., 06:07:04 PM
        const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        timeEl.textContent = now.toLocaleTimeString('en-IN', optionsTime).toUpperCase();
    }
}

// Run once immediately, then update every second (1000ms)
updateLiveDateTime();
setInterval(updateLiveDateTime, 1000);