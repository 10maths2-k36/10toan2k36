function updateClock() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const period = hours >= 12 ? 'CH' : 'SA';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const formattedHours = String(hours).padStart(2, '0');
    const timeString = `${day}/${month}/${year} ${formattedHours}:${minutes}:${seconds} ${period}`;
    const clockElement = document.getElementById('live-clock');
    if (clockElement) {
        clockElement.innerText = timeString;
    }
}
document.addEventListener("DOMContentLoaded", () => {
    setInterval(updateClock, 1000);
    updateClock();
});