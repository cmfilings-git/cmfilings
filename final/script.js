lucide.createIcons();

const html=document.documentElement;

const themeToggle=document.getElementById('themeToggle');

if(localStorage.getItem('theme')==='dark'){
html.classList.add('dark');
}

themeToggle.onclick=()=>{

html.classList.toggle('dark');

localStorage.setItem(
'theme',
html.classList.contains('dark')
?'dark':'light'
);

};

if('serviceWorker' in navigator){

window.addEventListener('load',()=>{

navigator.serviceWorker.register('sw.js');

});

}