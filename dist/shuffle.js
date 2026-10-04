// Visit every play space once per shuffled round; suspend while backgrounded.
let shuffleActive = false;
let shuffleTimer = null;
let shuffleBag = [];
let shufflePrevious = null;

function stopShuffle() {
  shuffleActive = false;
  clearTimeout(shuffleTimer); shuffleTimer = null;
  shuffleBag = [];
  document.body.classList.remove('shuffle-playing');
}

function scheduleShuffle() {
  clearTimeout(shuffleTimer); shuffleTimer = null;
  if (!shuffleActive || document.hidden) return;
  shuffleTimer = setTimeout(nextShuffleGame, preferences.shuffleSeconds * 1000);
}

function nextShuffleGame() {
  if (!shuffleActive || document.hidden) return;
  if (!shuffleBag.length) {
    shuffleBag = games.map(game => game.id);
    for (let i = shuffleBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffleBag[i], shuffleBag[j]] = [shuffleBag[j], shuffleBag[i]];
    }
    // Avoid repeating the last game at a round boundary.
    if (shuffleBag.at(-1) === shufflePrevious) {
      [shuffleBag[0], shuffleBag[shuffleBag.length - 1]] = [shuffleBag.at(-1), shuffleBag[0]];
    }
  }
  shufflePrevious = shuffleBag.pop();
  openPlayroomGame(shufflePrevious);
  scheduleShuffle();
}

$('shuffle-button').addEventListener('click', () => {
  stopShuffle(); shuffleActive = true; shufflePrevious = null;
  document.body.classList.add('shuffle-playing');
  nextShuffleGame();
});
for (const id of ['back-home', 'toy-home']) $(id).addEventListener('click', stopShuffle, {capture:true});
document.querySelectorAll('[data-game]').forEach(button => button.addEventListener('click', stopShuffle, {capture:true}));
$('shuffle-seconds').addEventListener('input', event => {
  preferences.shuffleSeconds = Math.round(Math.max(10, Math.min(300, Number(event.target.value))) / 10) * 10;
  syncSettings(); scheduleShuffle();
});
document.addEventListener('visibilitychange', scheduleShuffle);
window.addEventListener('pagehide', () => { clearTimeout(shuffleTimer); shuffleTimer = null; });
window.addEventListener('pageshow', scheduleShuffle);
