// Locally arranged nursery songs: one playlist continues across all games.
const nurserySongs = [
  ['twinkle', 'きらきら星'], ['mary', 'メリーさんのひつじ'],
  ['butterfly', 'ちょうちょう'], ['bees', 'ぶんぶんぶん'],
  ['london', 'ロンドン橋'], ['yankee', 'アルプス一万尺'],
  ['jacques', 'グーチョキパーでなにつくろう'], ['row', 'こげこげボート'],
  ['joy', 'よろこびのうた'], ['jingle', 'ジングルベル'],
];
const musicBuffers = new Map();
let musicStarted = false, musicVoice = null, musicLoading = null, musicRequest = 0;
let musicTrack = 'twinkle', musicOffset = 0, musicBag = [], musicFailures = 0, musicRetry = null;

function nextMusicTrack() {
  if (!musicBag.length) {
    musicBag = nurserySongs.map(([id]) => id);
    for (let i = musicBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [musicBag[i], musicBag[j]] = [musicBag[j], musicBag[i]];
    }
    // The first round already began with Twinkle; later rounds include all ten.
    if (musicTrack === 'twinkle' && !musicStartedRound) musicBag = musicBag.filter(id => id !== 'twinkle');
    if (musicBag.at(-1) === musicTrack) [musicBag[0], musicBag[musicBag.length - 1]] = [musicBag.at(-1), musicBag[0]];
    musicStartedRound = true;
  }
  musicTrack = musicBag.pop(); musicOffset = 0;
}
let musicStartedRound = false;

function musicLevel() {
  const screenLevel = musicScreen() === 'piano' ? .4 : 1;
  return preferences.musicVolume / 100 * .85 * .6 * screenLevel;
}

function musicScreen() {
  if (!$('animals').hidden) return 'animals';
  if (!$('toy-game').hidden) return currentToy;
  return 'home';
}

function musicState(state, track = musicTrack) {
  // DOM diagnostics allow us to verify routing without exposing developer text in the UI.
  document.body.dataset.bgmState = state;
  document.body.dataset.bgmTrack = track;
  document.body.dataset.bgmTitle = nurserySongs.find(([id]) => id === track)?.[1] || '';
  const playing = state === 'playing';
  const button = $('home-music');
  button.setAttribute('aria-pressed', String(playing));
  button.setAttribute('aria-label', playing ? 'BGMを止める' : 'BGMを再生する');
  button.innerHTML = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M14 7v15a4 4 0 1 1-3-4V10l14-3v12a4 4 0 1 1-3-4V3Z" fill="#b29ac8"/>${playing ? '' : '<path d="m6 5 22 23" stroke="#896b60" stroke-width="2.5" stroke-linecap="round"/>'}</svg>`;
}

function stopMusic() {
  musicRequest++;
  clearTimeout(musicRetry); musicRetry = null;
  musicLoading = null;
  const previous = musicVoice;
  musicVoice = null;
  if (previous) {
    musicOffset = Math.min(previous.source.buffer.duration, previous.offset + Math.max(0, audio.currentTime - previous.startedAt));
    const now = audio.currentTime;
    previous.gain.gain.cancelScheduledValues(now);
    previous.gain.gain.setTargetAtTime(0, now, .025);
    try { previous.source.stop(now + .15); } catch {}
  }
}

function musicBuffer(track) {
  if (musicBuffers.has(track)) return musicBuffers.get(track);
  // Limit decoded audio memory on phones; keep the current and two recent songs.
  if (musicBuffers.size >= 3) musicBuffers.delete(musicBuffers.keys().next().value);
  const pending = fetch(`assets/bgm/nursery-${track}.wav`)
    .then(response => { if (!response.ok) throw new Error('Music unavailable'); return response.arrayBuffer(); })
    .then(bytes => audio.decodeAudioData(bytes))
    .catch(error => { musicBuffers.delete(track); throw error; });
  musicBuffers.set(track, pending);
  return pending;
}

function syncMusic() {
  $('music-enabled').checked = preferences.musicEnabled;
  $('music-volume').value = preferences.musicVolume;
  $('music-volume-value').textContent = `${preferences.musicVolume}%`;
  const track = musicTrack;
  const shouldPlay = musicStarted && audio && preferences.enabled && preferences.musicEnabled && preferences.musicVolume > 0 && !document.hidden;
  if (!shouldPlay) {
    if (musicVoice || musicLoading || musicRetry) stopMusic();
    musicState(document.hidden ? 'paused' : 'off', track);
    return;
  }
  const level = musicLevel();
  if (musicVoice?.track === track) {
    musicVoice.gain.gain.setTargetAtTime(level, audio.currentTime, .06);
    musicState('playing', track);
    return;
  }
  if (musicLoading === track || musicRetry) return;
  stopMusic();
  const token = musicRequest;
  musicLoading = track; musicState('loading', track);
  Promise.all([musicBuffer(track), audio.resume()]).then(([buffer]) => {
    if (token !== musicRequest || document.hidden || !preferences.enabled || !preferences.musicEnabled || preferences.musicVolume === 0) return;
    const source = audio.createBufferSource(), gain = audio.createGain();
    source.buffer = buffer; source.loop = false;
    source.connect(gain).connect(master);
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(musicLevel(), audio.currentTime + .35);
    source.onended = () => {
      source.disconnect(); gain.disconnect();
      // Stops from mute/backgrounding must never advance the playlist.
      if (musicVoice?.source !== source || token !== musicRequest) return;
      musicVoice = null; nextMusicTrack(); syncMusic();
    };
    const offset = musicOffset < buffer.duration - .05 ? musicOffset : 0;
    musicVoice = {source, gain, track, offset, startedAt:audio.currentTime}; musicLoading = null;
    musicFailures = 0;
    source.start(0, offset); musicState('playing', track);
  }).catch(() => {
    if (token !== musicRequest) return;
    musicLoading = null; musicState('off', track);
    // Skip an unavailable song, without an endless rapid retry loop.
    if (++musicFailures < nurserySongs.length) musicRetry = setTimeout(() => {
      musicRetry = null; nextMusicTrack(); syncMusic();
    }, 1500);
  });
}

function unlockMusic(event) {
  if (!event.isTrusted || event.target.closest?.('#home-music')) return;
  if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
  musicStarted = true;
  initAudio(); syncMusic();
}
document.addEventListener('pointerdown', unlockMusic, {capture:true});
document.addEventListener('keydown', unlockMusic, {capture:true});
$('home-music').addEventListener('click', () => {
  if (musicStarted && preferences.enabled && preferences.musicEnabled && preferences.musicVolume > 0 && (musicVoice || musicLoading)) {
    preferences.musicEnabled = false;
  } else {
    musicStarted = true; preferences.musicEnabled = true; preferences.enabled = true;
    musicFailures = 0;
    if (preferences.musicVolume === 0) preferences.musicVolume = 35;
    initAudio();
  }
  syncSettings();
});
$('music-enabled').addEventListener('change', event => { preferences.musicEnabled = event.target.checked; syncSettings(); });
$('music-volume').addEventListener('input', event => { preferences.musicVolume = Number(event.target.value); syncSettings(); });
document.addEventListener('visibilitychange', syncMusic);
window.addEventListener('pagehide', () => { stopMusic(); musicState('paused'); });
window.addEventListener('pageshow', syncMusic);
const musicScreens = new MutationObserver(syncMusic);
for (const id of ['home', 'animals', 'toy-game']) musicScreens.observe($(id), {attributes:true, attributeFilter:['hidden']});
syncMusic();
