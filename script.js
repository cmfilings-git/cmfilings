document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Theme Toggle Logic ---
    const themeBtn = document.getElementById('themeToggle');
    const htmlEl = document.documentElement;

    themeBtn.addEventListener('click', () => {
        htmlEl.classList.toggle('dark');
        const isDark = htmlEl.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // --- 2. Mobile Menu Toggle ---
    const menuBtn = document.getElementById('menuBtn');
    const closeMenuBtn = document.getElementById('closeMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    function openM() {
        mobileMenu.classList.add('open');
        menuOverlay.classList.remove('hidden');
    }
    
    function closeM() {
        mobileMenu.classList.remove('open');
        menuOverlay.classList.add('hidden');
    }
    
    menuBtn.addEventListener('click', openM);
    closeMenuBtn.addEventListener('click', closeM);
    menuOverlay.addEventListener('click', closeM);
    
    document.querySelectorAll('.mob-link').forEach(link => {
        link.addEventListener('click', closeM);
    });

    // --- 3. Contact Form Submission ---
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        this.reset();
        const msg = document.getElementById('formMsg');
        msg.classList.remove('hidden');
        setTimeout(() => msg.classList.add('hidden'), 4000);
    });

    // --- 4. Scroll Animations (IntersectionObserver) ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    // --- 5. Navbar Shadow on Scroll ---
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 20) {
            navbar.classList.add('shadow-md');
        } else {
            navbar.classList.remove('shadow-md');
        }
    });

    // --- 6. Loader Fadeout ---
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }, 800);

    // --- 7. Initialize Lucide Icons ---
    lucide.createIcons();

});
