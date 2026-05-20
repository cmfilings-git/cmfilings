document.addEventListener('DOMContentLoaded', async () => {

    // 1. Array of components to load dynamically
    const components = [
        { id: 'navbar-container', url: 'nav/navbar.html' },
        { id: 'about-container', url: 'section/about.html' },
        { id: 'service-container', url: 'section/service.html' },
        { id: 'portal-container', url: 'section/portal.html' },
        { id: 'reviews-container', url: 'section/reviews.html' },
        { id: 'contact-container', url: 'section/contact.html' },
        { id: 'footer-container', url: 'section/footer.html' }
    ];

    // 2. Fetch and insert each component
    for (const component of components) {
        try {
            const response = await fetch(component.url);
            if (response.ok) {
                const html = await response.text();
                document.getElementById(component.id).innerHTML = html;
            } else {
                console.error(`Failed to load ${component.url}`);
            }
        } catch (error) {
            console.error(`Error loading ${component.url}:`, error);
        }
    }

    // 3. Navbar Sticky Shadow Logic
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                navbar.classList.add('shadow-nav');
            } else {
                navbar.classList.remove('shadow-nav');
            }
        });
    }

    // 4. Day / Night Toggle Logic
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    const themeToggleBtn = document.getElementById('theme-toggle');

    // Check if user previously saved a theme preference in localStorage
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        if(themeToggleLightIcon) themeToggleLightIcon.classList.remove('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        if(themeToggleDarkIcon) themeToggleDarkIcon.classList.remove('hidden');
    }

    // Listen for toggle clicks
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            // Toggle icons inside button
            themeToggleDarkIcon.classList.toggle('hidden');
            themeToggleLightIcon.classList.toggle('hidden');

            // Toggle "dark" class on the HTML tag
            if (localStorage.getItem('color-theme')) {
                if (localStorage.getItem('color-theme') === 'light') {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                }
            } else {
                if (document.documentElement.classList.contains('dark')) {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                } else {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                }
            }
        });
    }
});
