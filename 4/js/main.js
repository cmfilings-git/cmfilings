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

    // 3. Navbar Sticky Shadow Logic (Runs after components load)
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
});
