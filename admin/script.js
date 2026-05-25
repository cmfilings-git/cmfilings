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

// Global function to load components dynamically (e.g. from Sidebar)
window.loadPage = async function(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to load ${filePath}`);
        const html = await response.text();
        document.getElementById('main-content-container').innerHTML = html;
        
        initUI(); // Re-initialize UI logic for the new DOM elements
        
        // If loading a page with the client table, fetch live data
        if (document.querySelector('.data-table') && filePath.includes('clients-list')) {
            if(typeof loadLiveClientData === 'function') {
                loadLiveClientData();
            }
        }
    } catch (error) {
        console.error(error);
    }
}

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

// --- Google Sheets Form Submission Logic ---
// Your active Google Apps Script Web App URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxC5qy7BZrvi9x9M-vyUGNIym8mSBxz5f_-rk_EcvSOVd5flGBup1ynkSi2v7YYofh_/exec"; 

// We use document.addEventListener so it works even after the form is dynamically loaded into the page
document.addEventListener('submit', async function(e) {
    
    // Check if the form being submitted is our New Client form
    if(e.target && e.target.id === 'newClientForm') {
        e.preventDefault(); // Stop the page from reloading
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        // Ensure the timestamp field is populated right before submission
        const timeStampField = form.querySelector('input[name="#TimeStamp"]');
        if (timeStampField) {
            timeStampField.value = new Date().toLocaleString(); 
        }
        
        // Show loading state
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        // Gather all form data into a JSON object
        const formData = new FormData(form);
        const dataObject = {};
        formData.forEach((value, key) => {
            dataObject[key] = value;
        });

        try {
            // Send the data to your Google Apps Script
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                // Using text/plain avoids some strict CORS preflight checks from Google Apps Script
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', 
                },
                body: JSON.stringify(dataObject) 
            });

            const result = await response.json();

            if(result.status === "success" || result.result === "success") {
                alert(`Success! Client added successfully.`);
                form.reset(); // Clear the form
            } else {
                alert("Error saving client: " + (result.message || result.error));
            }

        } catch (error) {
            console.error('Submission failed:', error);
            alert("Network error. Could not connect to the database.");
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    }
});
