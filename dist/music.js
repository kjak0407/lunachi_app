// Original local WAV loops share the existing audio output, but have their own level.
const musicBuffers = new Map();
let musicStarted = false, musicVoice = null, musicLoading = null, musicRequest = 0;
let musicDuckUntil = 0, musicDuckTimer;

function musicLevel() {
  const screenLevel = musicScreen() === 'piano' ? .4 : 1;
  return preferences.musicVolume / 100 * .85 * screenLevel * (audio.currentTime < musicDuckUntil ? .32 : 1);
}

// Let taps stand out even with a much more energetic soundtrack.
function duckMusic(duration = .6) {
  if (!musicVoice || !audio) return;
  musicDuckUntil = Math.max(musicDuckUntil, audio.currentTime + duration);
  musicVoice.gain.gain.cancelScheduledValues(audio.currentTime);
  musicVoice.gain.gain.setTargetAtTime(musicLevel(), audio.currentTime, .015);
  clearTimeout(musicDuckTimer);
  musicDuckTimer = setTimeout(() => syncMusic(), (musicDuckUntil - audio.currentTime) * 1000 + 40);
}

function musicScreen() {
  if (!$('animals').hidden) return 'animals';
  if (!$('toy-game').hidden) return currentToy;
  return 'home';
}

function musicState(state, track = musicScreen()) {
  // DOM diagnostics allow us to verify routing without exposing developer text in the UI.
  document.body.dataset.bgmState = state;
  document.body.dataset.bgmTrack = track;
  const playing = state === 'playing';
  const button = $('home-music');
  button.setAttribute('aria-pressed', String(playing));
  button.setAttribute('aria-label', playing ? 'BGMを止める' : 'BGMを再生する');
  button.textContent = playing ? '♪ おんがくを とめる' : '♪ おんがくを はじめる';
}

function stopMusic() {
  clearTimeout(musicDuckTimer); musicDuckUntil = 0;
  musicRequest++;
  musicLoading = null;
  const previous = musicVoice;
  musicVoice = null;
  if (previous) {
    const now = audio.currentTime;
    previous.gain.gain.cancelScheduledValues(now);
    previous.gain.gain.setTargetAtTime(0, now, .025);
    try { previous.source.stop(now + .15); } catch {}
  }
}

function musicBuffer(track) {
  if (musicBuffers.has(track)) return musicBuffers.get(track);
  const pending = fetch(`assets/bgm/${track}.wav`)
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
  const track = musicScreen();
  const shouldPlay = musicStarted && audio && preferences.enabled && preferences.volume > 0 && preferences.musicEnabled && preferences.musicVolume > 0 && !document.hidden;
  if (!shouldPlay) {
    if (musicVoice || musicLoading) stopMusic();
    musicState(document.hidden ? 'paused' : 'off', track);
    return;
  }
  const level = musicLevel();
  if (musicVoice?.track === track) {
    musicVoice.gain.gain.setTargetAtTime(level, audio.currentTime, .06);
    musicState('playing', track);
    return;
  }
  if (musicLoading === track) return;
  stopMusic();
  const token = musicRequest;
  musicLoading = track; musicState('loading', track);
  Promise.all([musicBuffer(track), audio.resume()]).then(([buffer]) => {
    if (token !== musicRequest || document.hidden || musicScreen() !== track || !preferences.enabled || preferences.volume === 0 || !preferences.musicEnabled || preferences.musicVolume === 0) return;
    const source = audio.createBufferSource(), gain = audio.createGain();
    source.buffer = buffer; source.loop = true;
    source.connect(gain).connect(master);
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(musicLevel(), audio.currentTime + .35);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    musicVoice = {source, gain, track}; musicLoading = null;
    source.start(); musicState('playing', track);
  }).catch(() => {
    if (token !== musicRequest) return;
    musicLoading = null; musicState('off', track);
    // Leave the button available to retry; effects and gameplay remain usable.
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
  if (musicStarted && preferences.enabled && preferences.volume > 0 && preferences.musicEnabled && preferences.musicVolume > 0 && (musicVoice || musicLoading)) {
    preferences.musicEnabled = false;
  } else {
    musicStarted = true; preferences.musicEnabled = true; preferences.enabled = true;
    if (preferences.volume === 0) preferences.volume = 60;
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
