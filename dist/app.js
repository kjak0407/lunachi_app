const $ = (id) => document.getElementById(id);
const animals = [
  { id: 'dog', name: 'いぬ', says: 'わん わん！', emoji: '🐶', position: '0% 0%', color: '#f5ddca', shadow: '#e4c8b3', spark: '#d19c74' },
  { id: 'cat', name: 'ねこ', says: 'にゃ〜！', emoji: '🐱', position: '50% 0%', color: '#f8e6c5', shadow: '#e8d4ad', spark: '#ccab61' },
  { id: 'cow', name: 'うし', says: 'も〜！', emoji: '🐮', position: '100% 0%', color: '#dfeae2', shadow: '#c8d9cd', spark: '#8daa8c' },
  { id: 'chick', name: 'ひよこ', says: 'ぴよ ぴよ！', emoji: '🐥', position: '0% 100%', color: '#f5edc9', shadow: '#e3d8ae', spark: '#ccad60' },
  { id: 'pig', name: 'ぶた', says: 'ぶー ぶー！', emoji: '🐷', position: '50% 100%', color: '#f5dfe2', shadow: '#e3c6cc', spark: '#ce929f' },
  { id: 'sheep', name: 'ひつじ', says: 'めぇ〜！', emoji: '🐑', position: '100% 100%', color: '#e7e2ef', shadow: '#d3cadf', spark: '#ae98c4' },
];
const games = [
  { id: 'animals', name: 'どうぶつ', fullName: 'どうぶつのおしゃべり', color: '#f4d5c3' },
  { id: 'piano', name: 'ピアノ', fullName: 'ぽんぽんピアノ', art: 0, color: '#e5dff1' },
  { id: 'balloons', name: 'ふうせん', fullName: 'ぷかぷかふうせん', art: 1, color: '#f6dde2' },
  { id: 'vehicles', name: 'のりもの', fullName: 'のりものブーブー', art: 2, color: '#dbe9eb' },
  { id: 'drums', name: 'がっき', fullName: 'わくわく がっき', art: 5, color: '#f6e3c5' },
  { id: 'drawing', name: 'おえかき', fullName: 'きらきらおえかき', art: 6, color: '#deead9' },
  { id: 'peekaboo', name: 'いないばあ', fullName: 'いないいないばあ', art: 7, color: '#e8dff0' },
  { id: 'fruit', name: 'くだもの', fullName: 'くだものどうぞ', art: 10, color: '#f3dce0' },
  { id: 'water', name: 'おみず', fullName: 'おみずちゃぷちゃぷ', art: 13, color: '#daebed' },
];
let preferences = { enabled: true, volume: 60, musicEnabled: true, musicVolume: 35 };
try {
  const saved = JSON.parse(localStorage.getItem('lunachi-sound') || 'null');
  if (saved && typeof saved.enabled === 'boolean' && Number.isFinite(saved.volume)) {
    preferences = { enabled: saved.enabled, volume: Math.max(0, Math.min(100, saved.volume)), musicEnabled: saved.musicEnabled !== false, musicVolume: Number.isFinite(saved.musicVolume) ? Math.max(0, Math.min(100, saved.musicVolume)) : 35 };
  }
} catch { /* Storage can be unavailable in private browsing. */ }
let audio, master, effectsGain, activeVoice, page = 0, playRequest = 0;
const buffers = new Map();
const pageCount = Math.ceil(games.length / 9);
const soundSvg = (muted) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4 6 8H3v8h3l5 4Z"/>${muted ? '<path d="m16 9 5 6m0-6-5 6"/>' : '<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'}</svg>`;

function syncSettings() {
  $('sound-enabled').checked = preferences.enabled;
  $('volume').value = preferences.volume;
  $('volume-value').textContent = `${preferences.volume}%`;
  const muted = !preferences.enabled;
  $('mute-button').innerHTML = soundSvg(muted);
  $('mute-button').setAttribute('aria-label', muted ? '音をオンにする' : '音をオフにする');
  $('mute-button').setAttribute('aria-pressed', String(muted));
  $('toy-mute').innerHTML = soundSvg(muted);
  $('toy-mute').setAttribute('aria-label', muted ? '音をオンにする' : '音をオフにする');
  $('toy-mute').setAttribute('aria-pressed', String(muted));
  if (master) master.gain.setTargetAtTime(preferences.enabled ? .75 : 0, audio.currentTime, .025);
  if (effectsGain) effectsGain.gain.setTargetAtTime(preferences.volume / 100, audio.currentTime, .025);
  if (typeof syncMusic === 'function') syncMusic();
  try {
    localStorage.setItem('lunachi-sound', JSON.stringify(preferences));
    $('settings-save-status').textContent = 'この端末に自動保存しました。';
  } catch {
    $('settings-save-status').textContent = 'このブラウザでは保存できません。開いている間は設定を使えます。';
  }
}

function initAudio() {
  if (!audio) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) { currentSoundStatus().textContent = 'このブラウザでは音が使えません。'; return; }
    audio = new AudioContext();
    master = audio.createGain();
    master.connect(audio.destination);
    effectsGain = audio.createGain();
    effectsGain.connect(master);
    syncSettings();
    // Decode the small local WAVs in advance, before the first animal tap.
    animals.forEach(({ id }) => { loadRecordingBuffer(id).catch(() => {}); });
  }
  if (audio.state === 'suspended') audio.resume().catch(() => {
    currentSoundStatus().textContent = 'もう一度タップしてね。';
  });
}

function currentSoundStatus() {
  return $('toy-game').hidden ? $('sound-status') : $('toy-status');
}

// Real recordings, trimmed and level-matched. WAV is supported by iPhone Safari.
function loadRecordingBuffer(id) {
  if (buffers.has(id)) return buffers.get(id);
  const promise = fetch(`assets/audio/${id}.wav`)
    .then((response) => {
      if (!response.ok) throw new Error(`Audio unavailable: ${id}`);
      return response.arrayBuffer();
    })
    .then((bytes) => audio.decodeAudioData(bytes))
    .catch((error) => { buffers.delete(id); throw error; });
  buffers.set(id, promise);
  return promise;
}

function stopSound() {
  playRequest++; // Cancel any still-loading tap as well as current playback.
  if (!activeVoice || !audio) return;
  const voice = activeVoice;
  voice.gain.gain.cancelScheduledValues(audio.currentTime);
  voice.gain.gain.setTargetAtTime(0, audio.currentTime, .008);
  voice.source.stop(audio.currentTime + .04);
  activeVoice = null;
}

async function playSound(id) {
  if (!preferences.enabled || preferences.volume === 0) return;
  initAudio();
  if (!audio) return;
  stopSound();
  const request = playRequest;
  let buffer;
  try {
    const result = await Promise.all([loadRecordingBuffer(id), audio.resume()]);
    buffer = result[0];
  } catch {
    if (request === playRequest) currentSoundStatus().textContent = '音を読み込めませんでした。もう一度タップしてね。';
    return;
  }
  // A newer tap, home navigation, mute or backgrounding cancels this sound.
  const onAnimalScreen = !$('animals').hidden;
  const onPeekabooScreen = !$('toy-game').hidden && $('toy-game').classList.contains('peekaboo-screen');
  const vehicleSound = vehicleCatalog.some(vehicle => vehicle.id === id);
  const onVehicleScreen = !$('toy-game').hidden && $('toy-game').classList.contains('vehicles-screen');
  const onMatchingScreen = vehicleSound ? onVehicleScreen : (onAnimalScreen || onPeekabooScreen);
  if (request !== playRequest || !preferences.enabled || preferences.volume === 0 || document.hidden || !onMatchingScreen) return;
  currentSoundStatus().textContent = '';
  const source = audio.createBufferSource();
  const gain = audio.createGain();
  source.buffer = buffer;
  // Keep natural pitch and speed so the recorded sound remains recognizable.
  source.connect(gain).connect(effectsGain);
  const voice = { source, gain };
  activeVoice = voice;
  source.onended = () => {
    source.disconnect(); gain.disconnect();
    if (activeVoice === voice) activeVoice = null;
  };
  source.start();
}

const track = document.createElement('div');
track.className = 'home-track';
for (let p = 0; p < pageCount; p++) {
  const grid = document.createElement('div');
  grid.className = 'home-page';
  games.slice(p * 9, p * 9 + 9).forEach((game) => {
    const button = document.createElement('button');
    button.className = 'app-tile';
    button.style.setProperty('--tile', game.color);
    button.dataset.game = game.id;
    button.setAttribute('aria-label', `${game.fullName}で遊ぶ`);
    const artPosition = `${game.art % 4 / 3 * 100}% ${Math.floor(game.art / 4) / 3 * 100}%`;
    button.innerHTML = `<span class="tile-art">${game.id === 'animals' ? '<span class="animal-portrait" style="--position:0% 0%;width:95%" aria-hidden="true"></span>' : `<span class="toy-art" style="--toy-position:${artPosition}" aria-hidden="true"></span>`}<span class="play-badge" aria-hidden="true">▶</span></span><span class="tile-name">${game.name}</span>`;
    button.addEventListener('click', () => {
      if (game.id !== 'animals') { openToyGame(game.id); return; }
      initAudio();
      $('home').hidden = true;
      $('animals').hidden = false;
      document.body.classList.add('in-meadow');
      window.scrollTo(0, 0);
      $('back-home').focus({ preventScroll: true });
    });
    grid.append(button);
  });
  track.append(grid);
  const dot = document.createElement('button');
  dot.className = `page-dot${p === 0 ? ' active' : ''}`;
  dot.setAttribute('aria-label', `${p + 1}ページ目`);
  dot.setAttribute('aria-current', p === 0 ? 'page' : 'false');
  dot.addEventListener('click', () => setPage(p));
  $('page-dots').append(dot);
}
$('home-pages').append(track);
function setPage(next) {
  page = Math.max(0, Math.min(pageCount - 1, next));
  track.style.transform = `translateX(-${page * 100}%)`;
  [...track.children].forEach((grid, index) => { grid.inert = index !== page; });
  [...$('page-dots').children].forEach((dot, index) => {
    dot.classList.toggle('active', index === page);
    dot.setAttribute('aria-current', index === page ? 'page' : 'false');
  });
}
setPage(0);
let swipeStart;
$('home-pages').addEventListener('pointerdown', (e) => { swipeStart = { x: e.clientX, y: e.clientY }; });
$('home-pages').addEventListener('pointerup', (e) => {
  if (!swipeStart) return;
  const dx = e.clientX - swipeStart.x, dy = e.clientY - swipeStart.y;
  if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) setPage(page + (dx < 0 ? 1 : -1));
  swipeStart = null;
});
$('home-pages').addEventListener('pointercancel', () => { swipeStart = null; });

animals.forEach((animal) => {
  const button = document.createElement('button');
  button.className = `animal-friend animal-${animal.id}`;
  button.dataset.animal = animal.id;
  button.style.cssText = `--card:${animal.color};--shadow:${animal.shadow};--spark:${animal.spark};--position:${animal.position}`;
  button.setAttribute('aria-label', `${animal.name}。タップすると${animal.says}`);
  button.innerHTML = `<span class="animal-says" aria-hidden="true">${animal.says}</span><span class="animal-shadow" aria-hidden="true"></span><span class="animal-actor"><span class="animal-portrait" aria-hidden="true"></span></span><span class="animal-name">${animal.name}</span>`;
  let animationTimer;
  function play() {
    playSound(animal.id);
    clearTimeout(animationTimer);
    button.classList.remove('playing');
    void button.offsetWidth;
    button.classList.add('playing');
    animationTimer = setTimeout(() => button.classList.remove('playing'), 1150);
    button.querySelectorAll('.particle').forEach((particle) => particle.remove());
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (let i = 0; i < 5; i++) {
        const particle = document.createElement('span');
        particle.className = 'particle';
        particle.textContent = ['♡', '♪', '✦', '♡', '♪'][i];
        particle.setAttribute('aria-hidden', 'true');
        const angle = (i / 5 * Math.PI * 2) - Math.PI;
        particle.style.cssText = `--dx:${Math.cos(angle) * 80}px;--dy:${Math.sin(angle) * 65 - 20}px;--rotate:${i * 25 - 50}deg`;
        button.append(particle);
        particle.addEventListener('animationend', () => particle.remove(), { once: true });
      }
    }
  }
  button.addEventListener('pointerdown', (e) => { if (e.button === 0) play(); });
  button.addEventListener('click', (e) => { if (e.detail === 0) play(); });
  button.addEventListener('contextmenu', (e) => e.preventDefault());
  $('animal-meadow').append(button);
});

$('back-home').addEventListener('click', () => {
  stopSound();
  $('animals').hidden = true; $('home').hidden = false;
  document.body.classList.remove('in-meadow');
  $('sound-status').textContent = '';
  window.scrollTo(0, 0);
  document.querySelector('.app-tile:not(:disabled)').focus({ preventScroll: true });
});
  $('mute-button').addEventListener('click', () => {
  const muted = !preferences.enabled;
  preferences.enabled = muted;
  if (!preferences.enabled) stopSound();
  syncSettings();
});
const settings = $('settings-button');
settings.addEventListener('contextmenu', (e) => e.preventDefault());
settings.addEventListener('click', () => {
  stopSound();
  if (typeof stopToySounds === 'function') stopToySounds();
  if (!$('settings-dialog').open) $('settings-dialog').showModal();
});
$('sound-enabled').addEventListener('change', (e) => { preferences.enabled = e.target.checked; if (!preferences.enabled) stopSound(); syncSettings(); });
$('volume').addEventListener('input', (e) => { preferences.volume = Number(e.target.value); if (preferences.volume === 0) stopSound(); syncSettings(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) stopSound(); });
syncSettings();
