// =========================================
// SERVICE WORKER
// =========================================

if('serviceWorker' in navigator){

    window.addEventListener('load', () => {

        navigator.serviceWorker.register('sw.js')

        .then(() => {

            console.log('CMFilings Service Worker Registered');

        })

        .catch((error) => {

            console.log('Service Worker Error:', error);

        });

    });

}

// =========================================
// SPLASH SCREEN
// =========================================

window.addEventListener('load', () => {

    const splash = document.getElementById('splash');

    setTimeout(() => {

        if(splash){

            splash.style.opacity = '0';

            splash.style.visibility = 'hidden';

        }

    },1200);

});

// =========================================
// ACTIVE NAVIGATION
// =========================================

const currentPage = window.location.pathname;

const navItems = document.querySelectorAll('.nav-item');

navItems.forEach((item) => {

    item.classList.remove('active');

    const href = item.getAttribute('href');

    if(href && currentPage.includes(href)){

        item.classList.add('active');

    }

});

// =========================================
// CARD CLICK EFFECT
// =========================================

const cards = document.querySelectorAll('.card');

cards.forEach((card) => {

    card.addEventListener('touchstart', () => {

        card.style.transform = 'scale(0.98)';

    });

    card.addEventListener('touchend', () => {

        card.style.transform = '';

    });

});

// =========================================
// INSTALL PWA PROMPT
// =========================================

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {

    e.preventDefault();

    deferredPrompt = e;

    console.log('PWA Install Available');

});

// OPTIONAL INSTALL BUTTON

const installButton = document.getElementById('install-app');

if(installButton){

    installButton.addEventListener('click', async () => {

        if(deferredPrompt){

            deferredPrompt.prompt();

            const result = await deferredPrompt.userChoice;

            console.log(result.outcome);

            deferredPrompt = null;

        }

    });

}

// =========================================
// SMOOTH SCROLL TOP
// =========================================

window.scrollTo({
    top:0,
    behavior:'smooth'
});