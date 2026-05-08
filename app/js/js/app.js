if('serviceWorker' in navigator){

    window.addEventListener('load', () => {

        navigator.serviceWorker.register('/app/sw.js')
        .then(() => {
            console.log('Service Worker Registered');
        });

    });

}