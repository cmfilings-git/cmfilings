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

    // --- 3. Google Sheets Integration ---
    // IMPORTANT: Replace the URL below with your Google Apps Script Web App URL from Step 1
    const scriptURL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
    const form = document.getElementById('contactForm');
    const msg = document.getElementById('formMsg');
    const submitBtn = document.getElementById('submitBtn');

    form.addEventListener('submit', e => {
      e.preventDefault();
      
      // Update UI to show submission is in progress
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Submitting...';

      fetch(scriptURL, { method: 'POST', body: new FormData(form)})
        .then(response => {
          msg.classList.remove('hidden');
          msg.textContent = "Thank you! Your inquiry has been received. We will get back to you shortly.";
          form.reset();
          
          setTimeout(() => msg.classList.add('hidden'), 5000);
          
          // Reset Button
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Submit Request <i data-lucide="arrow-right" style="width:20px;height:20px"></i>';
          lucide.createIcons();
        })
        .catch(error => {
          console.error('Error!', error.message);
          msg.classList.remove('hidden');
          msg.classList.replace('text-green-600', 'text-red-600');
          msg.classList.replace('bg-green-50', 'bg-red-50');
          msg.textContent = "Oops! Something went wrong. Please try again.";
          
          // Reset Button
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Submit Request <i data-lucide="arrow-right" style="width:20px;height:20px"></i>';
          lucide.createIcons();
        });
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
