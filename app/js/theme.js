const toggleButton = document.getElementById('theme-toggle');

const savedTheme = localStorage.getItem('theme');

if(savedTheme === 'dark'){
    document.body.classList.add('dark-mode');
}

toggleButton.addEventListener('click', () => {

    document.body.classList.toggle('dark-mode');

    if(document.body.classList.contains('dark-mode')){
        localStorage.setItem('theme', 'dark');
    }else{
        localStorage.setItem('theme', 'light');
    }

});