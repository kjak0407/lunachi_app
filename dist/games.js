// Eight small play spaces. All sounds and assets remain local to the app.
const toyColors = ['#eeaaa8', '#efc18a', '#eadc83', '#a9c7a0', '#9bc9d6', '#b5a5d3', '#dda9c9'];
const toyVoices = new Set();
let disposeToyGame = () => {};
let currentToy = null;
let noiseBuffer;
let drawingStrokes = [];

function toyArt(index, extra = '') {
  const x = index % 4 / 3 * 100, y = Math.floor(index / 4) / 3 * 100;
  return `<span class="toy-art ${extra}" style="--toy-position:${x}% ${y}%" aria-hidden="true"></span>`;
}

function stopToySounds() {
  for (const voice of [...toyVoices]) voice.stop();
}

// Brief envelopes, restrained volume and a cap on overlapping sounds.
function toyVoice(duration = .6) {
  if (!preferences.enabled || preferences.volume === 0 || document.hidden) return null;
  initAudio();
  if (!audio) { $('toy-status').textContent = 'このブラウザでは音が使えません。'; return null; }
  while (toyVoices.size >= 8) toyVoices.values().next().value.stop();
  const output = audio.createGain();
  output.connect(effectsGain);
  const sources = [];
  let ended = false, remaining = 0;
  const now = audio.currentTime;
  const voice = {
    stop() {
      if (ended) return;
      ended = true;
      output.gain.setTargetAtTime(0, audio.currentTime, .005);
      sources.forEach(source => { try { source.stop(audio.currentTime + .025); } catch {} });
      toyVoices.delete(voice);
    },
    tone(frequency, length = duration, offset = 0, volume = .18, type = 'sine', endFrequency = frequency) {
      const source = audio.createOscillator(), envelope = audio.createGain();
      source.type = type;
      source.frequency.setValueAtTime(frequency, now + offset);
      source.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + offset + length);
      envelope.gain.setValueAtTime(0, now + offset);
      envelope.gain.linearRampToValueAtTime(volume, now + offset + .008);
      envelope.gain.exponentialRampToValueAtTime(.0001, now + offset + length);
      source.connect(envelope).connect(output);
      remaining++;
      source.onended = () => {
        source.disconnect(); envelope.disconnect();
        if (--remaining === 0) { toyVoices.delete(voice); output.disconnect(); ended = true; }
      };
      sources.push(source);
      source.start(now + offset); source.stop(now + offset + length + .01);
    },
    noise(length = .2, offset = 0, volume = .2, center = 1200, q = .6) {
      if (!noiseBuffer) {
        noiseBuffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), envelope = audio.createGain();
      source.buffer = noiseBuffer;
      filter.type = 'bandpass'; filter.frequency.value = center; filter.Q.value = q;
      envelope.gain.setValueAtTime(0, now + offset);
      envelope.gain.linearRampToValueAtTime(volume, now + offset + .008);
      envelope.gain.exponentialRampToValueAtTime(.0001, now + offset + length);
      source.connect(filter).connect(envelope).connect(output);
      remaining++;
      source.onended = () => {
        source.disconnect(); filter.disconnect(); envelope.disconnect();
        if (--remaining === 0) { toyVoices.delete(voice); output.disconnect(); ended = true; }
      };
      sources.push(source);
      source.start(now + offset); source.stop(now + offset + length + .01);
    },
  };
  toyVoices.add(voice);
  return voice;
}

function toySound(kind, value = 0) {
  const voice = toyVoice();
  if (!voice) return;
  const notes = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88];
  if (kind === 'piano') {
    voice.tone(notes[value], 1.1, 0, .22);
    voice.tone(notes[value] * 2, .65, 0, .055);
    voice.tone(notes[value] * 3, .25, 0, .018);
  } else if (kind === 'pop') {
    voice.tone(460, .12, 0, .2, 'sine', 90); voice.noise(.09, 0, .13, 1600);
  } else if (kind === 'drum') {
    if (value === 2) voice.noise(.55, 0, .28, 5500, .3);
    else { voice.tone(value ? 250 : 140, .4, 0, .32, 'sine', value ? 110 : 48); voice.noise(.12, 0, .18, value ? 1800 : 700); }
  } else if (kind === 'fruit') {
    voice.tone(240 + value * 90, .38, 0, .23, 'sine', 680 + value * 90);
    voice.tone(550 + value * 100, .22, .1, .09, 'sine', 190);
  } else if (kind === 'water') {
    voice.noise(.28, 0, .18, 1700);
    voice.tone(550, .19, .03, .13, 'sine', 150);
    voice.tone(950, .14, .13, .08, 'sine', 310);
  } else if (kind === 'duck') {
    voice.tone(340, .22, 0, .2, 'triangle', 210); voice.tone(340, .24, .27, .18, 'triangle', 210);
  } else {
    voice.tone(880 + value * 90, .36, 0, .12);
    voice.tone(1320 + value * 90, .3, .07, .07);
  }
}

function gameScope(stage) {
  const listeners = [], timers = new Set();
  const scope = {
    stage,
    on(element, name, handler, options) {
      element.addEventListener(name, handler, options);
      listeners.push(() => element.removeEventListener(name, handler, options));
    },
    after(callback, delay) {
      const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
      timers.add(timer); return timer;
    },
    tap(element, callback) {
      scope.on(element, 'pointerdown', e => { if (e.button === 0) callback(e); });
      scope.on(element, 'click', e => { if (e.detail === 0) callback(e); });
    },
    dispose() { listeners.forEach(remove => remove()); timers.forEach(clearTimeout); },
  };
  scope.on(stage, 'contextmenu', e => e.preventDefault());
  return scope;
}

function animateToy(element, name = 'toy-bounce') {
  element.classList.remove(name);
  void element.offsetWidth;
  element.classList.add(name);
}

function toyBurst(scope, x, y, color = '#bb90b9', symbols = ['✦', '♡', '♪']) {
  const stage = scope.stage;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) symbols = ['♡'];
  while (stage.querySelectorAll('.toy-effect').length > 36) stage.querySelector('.toy-effect').remove();
  symbols.forEach((symbol, i) => {
    const effect = document.createElement('span');
    effect.className = 'toy-effect'; effect.textContent = symbol;
    effect.setAttribute('aria-hidden', 'true');
    effect.style.cssText = `left:${x}px;top:${y}px;color:${color};--effect-x:${(i - 1) * 42}px;--effect-y:${-65 - i * 12}px`;
    stage.append(effect);
    scope.after(() => effect.remove(), 950);
  });
}

function burstAt(scope, element, color, symbols) {
  const a = element.getBoundingClientRect(), b = scope.stage.getBoundingClientRect();
  toyBurst(scope, a.left + a.width / 2 - b.left, a.top + a.height / 2 - b.top, color, symbols);
}

const toyInfo = {
  piano: ['すきな おとを ならしてみよう', 'ゆびを すべらせても ひけるよ', '#f2eafa'],
  balloons: ['ふうせんの なかは なあに？', 'ふうせんを さわってみてね', '#edf5fb'],
  vehicles: ['どの のりものに しよう？', 'さわると うごくよ。したにも のりものが いるよ！', '#edf4e4'],
  drums: ['いろんな おとを ならそう♪', 'すきな がっきを さわってみてね', '#fff1de'],
  drawing: ['ゆびで きらきら おえかき', 'ペンも スタンプも つかってみよう', '#f7f4ee'],
  peekaboo: ['だれが かくれているかな？', 'さわると、いないいないばあ！', '#e7efd8'],
  fruit: ['くだもの、どうぞ！', 'くだものを さわって たべさせてね', '#fff0ec'],
  water: ['ちゃぷちゃぷ、ぷかぷか', 'いきものも おみずも さわってみよう', '#e5f5f7'],
};

function openToyGame(id) {
  disposeToyGame(); stopSound(); stopToySounds(); initAudio();
  currentToy = id;
  const game = games.find(game => game.id === id), info = toyInfo[id];
  $('home').hidden = true; $('animals').hidden = true; $('toy-game').hidden = false;
  document.body.classList.remove('in-meadow'); document.body.classList.add('in-toy');
  $('toy-game').className = `screen play-screen ${id}-screen`;
  $('toy-game').style.setProperty('--play-bg', info[2]);
  $('toy-title').textContent = game.fullName;
  $('toy-hint').textContent = info[0]; $('toy-footer').textContent = info[1];
  $('toy-status').textContent = '';
  const stage = $('toy-stage'); stage.replaceChildren(); stage.className = `toy-stage ${id}-stage`;
  const scope = gameScope(stage);
  const extraDispose = toyBuilders[id](scope) || (() => {});
  disposeToyGame = () => { scope.dispose(); extraDispose(); disposeToyGame = () => {}; };
  syncSettings(); window.scrollTo(0, 0); $('toy-home').focus({ preventScroll: true });
}

$('toy-home').addEventListener('click', () => {
  const previous = currentToy;
  disposeToyGame(); stopSound(); stopToySounds(); currentToy = null;
  $('toy-game').hidden = true; $('home').hidden = false;
  document.body.classList.remove('in-toy');
  window.scrollTo(0, 0);
  document.querySelector(`[data-game="${previous}"]`).focus({ preventScroll: true });
});
$('toy-mute').addEventListener('click', () => {
  const muted = !preferences.enabled;
  preferences.enabled = muted;
  if (!preferences.enabled) { stopToySounds(); stopSound(); }
  syncSettings();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopToySounds(); });
$('sound-enabled').addEventListener('change', () => { if (!preferences.enabled) stopToySounds(); });
$('volume').addEventListener('input', () => { if (preferences.volume === 0) stopToySounds(); });

const toyBuilders = {
  piano(scope) {
    const { stage } = scope, labels = ['ど', 'れ', 'み', 'ふぁ', 'そ', 'ら', 'し'];
    stage.innerHTML = `<div class="piano-notes" aria-hidden="true">♪ ♫ ♪</div><div class="piano-board" aria-label="ピアノの鍵盤">${labels.map((name, i) => `<button class="piano-key" data-note="${i}" style="--key-color:${toyColors[i]}" aria-label="${name}の音"><span>${name}</span></button>`).join('')}</div>`;
    const pointers = new Map();
    function play(key) {
      const note = Number(key.dataset.note);
      toySound('piano', note); animateToy(key, 'key-pressed');
      scope.after(() => key.classList.remove('key-pressed'), 230);
      const a = key.getBoundingClientRect(), b = stage.getBoundingClientRect();
      toyBurst(scope, a.left + a.width / 2 - b.left, a.top - b.top, toyColors[note], ['♪', '♫', '♪']);
    }
    stage.querySelectorAll('.piano-key').forEach(key => {
      scope.on(key, 'click', e => { if (e.detail === 0) play(key); });
    });
    scope.on(stage, 'pointerdown', e => {
      if (e.button !== 0) return;
      const key = e.target.closest('.piano-key'); if (!key) return;
      stage.setPointerCapture(e.pointerId); pointers.set(e.pointerId, key); play(key);
    });
    scope.on(stage, 'pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      const key = document.elementFromPoint(e.clientX, e.clientY)?.closest('.piano-key');
      if (key && stage.contains(key) && key !== pointers.get(e.pointerId)) { pointers.set(e.pointerId, key); play(key); }
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => scope.on(stage, name, e => pointers.delete(e.pointerId)));
  },

  vehicles(scope) {
    const { stage } = scope;
    const lanes = document.createElement('div'); lanes.className = 'vehicle-lanes'; stage.append(lanes);
    vehicleCatalog.forEach(vehicle => {
      loadRecordingBuffer(vehicle.id).catch(() => {});
      const lane = document.createElement('button');
      lane.style.setProperty('--drive-duration', `${vehicle.duration}s`);
      lane.className = `vehicle-lane ${vehicle.id}-lane ${vehicle.sky ? 'sky-lane' : 'road-lane'}`; lane.setAttribute('aria-label', `${vehicle.name}を${vehicle.sky ? '飛ばす' : '走らせる'}`);
      lane.innerHTML = `<span class="vehicle-actor">${vehicleArt(vehicle)}</span><span class="vehicle-name">${vehicle.name}</span><span class="vehicle-call" aria-hidden="true">${vehicle.sound}</span>`;
      lanes.append(lane);
      let touchStart;
      scope.on(lane, 'pointerdown', e => { if (e.button === 0) touchStart = { x: e.clientX, y: e.clientY }; });
      const playVehicle = () => {
        playSound(vehicle.id);
        lane.style.setProperty('--travel', `${Math.max(20, lane.clientWidth - 140)}px`);
        animateToy(lane, 'running');
      };
      scope.on(lane, 'pointerup', e => {
        if (touchStart && Math.hypot(e.clientX - touchStart.x, e.clientY - touchStart.y) < 12) playVehicle();
        touchStart = null;
      });
      scope.on(lane, 'pointercancel', () => { touchStart = null; });
      scope.on(lane, 'click', e => { if (e.detail === 0) playVehicle(); });
    });
  },

  drums(scope) {
    buildInstruments(scope);
  },

};
