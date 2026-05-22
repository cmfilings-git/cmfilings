document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Function to fetch and load HTML components
    async function loadComponent(elementId, filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`Failed to load ${filePath}`);
            const html = await response.text();
            document.getElementById(elementId).innerHTML = html;
        } catch (error) {
            console.error(error);
            document.getElementById(elementId).innerHTML = `<p style="color:red; padding:20px;">Error loading ${filePath}. Are you using Live Server?</p>`;
        }
    }

    // 2. Load all components, THEN initialize the interactive UI
    Promise.all([
        loadComponent('sidebar-container', 'components/sidebar.html'),
        loadComponent('header-container', 'components/header.html'),
        loadComponent('main-content-container', 'components/dashboard.html')
    ]).then(() => {
        // Run this only AFTER the HTML is injected into the page
        initUI();
    });
});

// 3. UI Interactive Logic (Tabs, Checkboxes, Nav)
function initUI() {
    // --- Tab Switching Logic ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // --- To-Do Checkbox Strikethrough Logic ---
    const todoCheckboxes = document.querySelectorAll('.todo-checkbox');
    todoCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const todoItem = this.closest('.todo-item');
            if (this.checked) {
                todoItem.classList.add('completed');
            } else {
                todoItem.classList.remove('completed');
            }
        });
    });

    // --- Navigation Active State Logic ---
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if(this.getAttribute('href') === '#') e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}