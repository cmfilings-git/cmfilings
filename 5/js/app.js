async function loadComponent(id, file) {
  const response = await fetch(file);
  const html = await response.text();
  document.getElementById(id).innerHTML = html;
}

loadComponent('navbar', 'components/navbar.html');
loadComponent('hero', 'components/hero.html');
loadComponent('modules', 'components/modules.html');
loadComponent('footer', 'components/footer.html');

// DARK MODE

document.addEventListener('click', function(e){

if(e.target.closest('#themeBtn')){

document.body.classList.toggle('dark');

const icon = document.querySelector('#themeBtn i');

if(document.body.classList.contains('dark')){
icon.className = 'fa-solid fa-sun';
}else{
icon.className = 'fa-solid fa-moon';
}

}

// MOBILE MENU

if(e.target.closest('#menuBtn')){
const menu = document.getElementById('mobileMenu');
menu.classList.toggle('show-menu');
}

});
