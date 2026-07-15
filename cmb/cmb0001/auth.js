// auth.js
(function() {
    // 1. Check Authentication State
    const isAuth = localStorage.getItem('cmb_auth'); //
    const activeUser = localStorage.getItem('cmb_active_user'); //[cite: 6]

    // If not authenticated, redirect immediately to login
    if (isAuth !== 'true' || !activeUser) {
        window.location.replace('login.html'); //[cite: 6]
        return;
    }

    // 2. Apply Role-Based Access Control (RBAC) after DOM loads
    document.addEventListener('DOMContentLoaded', () => {
        
        // Let's assume 'staff' has restricted access
        if (activeUser === 'staff') { //[cite: 6]
            
            // Function to restrict UI elements once dynamic components load
            const applyStaffRestrictions = () => {
                // A. Hide restricted sidebar links (e.g., Users, Settings, Company)
                const restrictedLinks = ['users.html', 'settings.html', 'company.html']; //[cite: 5]
                restrictedLinks.forEach(link => {
                    const el = document.querySelector(`a[href="${link}"]`);
                    if (el) el.style.display = 'none';
                });

                // B. Hide administrative buttons (e.g., Delete Task in task.html)
                const deleteBtns = document.querySelectorAll('button[title="Delete Task"]'); //
                deleteBtns.forEach(btn => btn.style.display = 'none');
            };

            // Run immediately, and also set a small timeout to account for loadComponent() delays
            applyStaffRestrictions();
            setTimeout(applyStaffRestrictions, 500); 
        }

        // Update Header Profile Icon to reflect User
        setTimeout(() => {
            const profileIcon = document.querySelector('.rounded-full.bg-\\[\\#161c2d\\]'); //[cite: 3]
            if (profileIcon) {
                profileIcon.innerText = activeUser === 'admin' ? 'AD' : 'ST';
            }
        }, 500);
    });
})();x
