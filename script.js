/* MENU LOGIC */
function openMenu(){
    document.getElementById('menu').classList.add('active');
}

function closeMenu(){
    document.getElementById('menu').classList.remove('active');
}

/* DARK MODE LOGIC */
function toggleTheme(){
    document.body.classList.toggle('dark');
}

/* ITR COUNTDOWN LOGIC */
function updateITRCountdown(){
    const dueDate = new Date("July 31, 2026 23:59:59").getTime();
    const now = new Date().getTime();
    const difference = dueDate - now;
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
    
    const itrDaysElement = document.getElementById("itrDays");
    if (itrDaysElement) {
        itrDaysElement.innerText = days > 0 ? days : 0;
    }
}

updateITRCountdown();
setInterval(updateITRCountdown, 1000);
