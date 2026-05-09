// =========================================
// THEME TOGGLE
// =========================================

const themeToggle = document.getElementById('theme-toggle');

// LOAD SAVED THEME

window.addEventListener('load', () => {

    const savedTheme = localStorage.getItem('theme');

    if(savedTheme === 'dark'){

        document.body.classList.add('dark-mode');

    }

});

// TOGGLE THEME

if(themeToggle){

    themeToggle.addEventListener('click', () => {

        document.body.classList.toggle('dark-mode');

        if(document.body.classList.contains('dark-mode')){

            localStorage.setItem('theme','dark');

        }else{

            localStorage.setItem('theme','light');

        }

    });

}