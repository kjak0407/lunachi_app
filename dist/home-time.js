function homeTimePeriod(hour) {
  return hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'day' : 'night';
}
function updateHomeTime() {
  document.body.dataset.homeTime = homeTimePeriod(new Date().getHours());
}
updateHomeTime();
setInterval(updateHomeTime, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateHomeTime(); });
window.addEventListener('pageshow', updateHomeTime);
