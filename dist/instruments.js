// Small original instrument voices, with realistic illustrated instruments.
const instrumentCatalog = [
  { id: 'drum', name: 'たいこ', call: 'どん！', color: '#efb2ae' },
  { id: 'tambourine', name: 'タンバリン', call: 'しゃん！', color: '#edcc94' },
  { id: 'maracas', name: 'マラカス', call: 'しゃかしゃか！', color: '#bbd3b5' },
  { id: 'xylophone', name: 'もっきん', call: 'ころころ♪', color: '#b7d9df' },
  { id: 'triangle', name: 'トライアングル', call: 'ちーん♪', color: '#c8bddf' },
  { id: 'cymbal', name: 'シンバル', call: 'しゃーん！', color: '#ebd58e' },
  { id: 'bells', name: 'すず', call: 'りんりん♪', color: '#e7b8d0' },
  { id: 'guitar', name: 'ギター', call: 'じゃらーん♪', color: '#edc49b' },
  { id: 'trumpet', name: 'ラッパ', call: 'ぱっぱー♪', color: '#e6d28f' },
];

function instrumentArt(id) {
  const index = instrumentCatalog.findIndex(item => item.id === id);
  return `<span class="instrument-sprite" style="--sprite-position:${index % 3 * 50}% ${Math.floor(index / 3) * 50}%" aria-hidden="true"></span>`;
}
function playInstrument(id, count = 0) {
  const voice = toyVoice(1.4);
  if (!voice) return;
  const note = [261.63, 329.63, 392, 523.25][count % 4];
  const bell = (frequency, delay = 0, volume = .12) => {
    voice.tone(frequency, 1.3, delay, volume);
    voice.tone(frequency * 2.76, .75, delay, volume * .36);
    voice.tone(frequency * 5.4, .35, delay, volume * .14);
  };
  switch (id) {
    case 'drum':
      voice.tone(145, .5, 0, .3, 'sine', 48); voice.noise(.11, 0, .12, 750); break;
    case 'tambourine':
      voice.noise(.36, 0, .19, 6100, .35); voice.tone(230, .13, 0, .08); [2400, 3300, 4700].forEach(f => voice.tone(f, .32, 0, .035)); break;
    case 'maracas':
      for (let i = 0; i < 4; i++) voice.noise(.13, i * .16, .16, 3600, .4); break;
    case 'xylophone':
      [note, note * 1.25, note * 1.5].forEach((f, i) => { voice.tone(f, .55, i * .15, .17); voice.tone(f * 4, .07, i * .15, .035); }); break;
    case 'triangle': bell(1800, 0, .13); break;
    case 'cymbal':
      voice.noise(1.25, 0, .24, 6900, .3); [2200, 3470, 5190].forEach(f => voice.tone(f, .7, 0, .025)); break;
    case 'bells':
      for (let i = 0; i < 3; i++) { bell(2100, i * .18, .065); bell(2900, i * .18, .045); } break;
    case 'guitar':
      [130.81, 164.81, 196, 261.63, 329.63, 392].forEach((f, i) => {
        for (let harmonic = 1; harmonic <= 5; harmonic++) voice.tone(f * harmonic, 1 / harmonic, i * .035, .085 / harmonic, 'sine');
        voice.noise(.025, i * .035, .022, 2100);
      }); break;
    case 'trumpet':
      for (let i = 0; i < 2; i++) {
        voice.tone(note * 1.5, .42, i * .38, .13, 'sawtooth');
        voice.tone(note * 1.5, .42, i * .38, .06);
      } break;
  }
}

function buildInstruments(scope) {
  const counts = new Map();
  const announcement = document.createElement('div'); announcement.className = 'instrument-announcement'; announcement.setAttribute('aria-hidden', 'true');
  scope.stage.append(announcement);
  const orchestra = document.createElement('div'); orchestra.className = 'instrument-orchestra'; scope.stage.append(orchestra);
  instrumentCatalog.forEach((instrument, index) => {
    const button = document.createElement('button'); button.className = `instrument instrument-${instrument.id}`;
    button.style.setProperty('--instrument-color', instrument.color);
    button.setAttribute('aria-label', `${instrument.name}を鳴らす`);
    button.innerHTML = `<span class="instrument-picture">${instrumentArt(instrument.id)}</span><span class="instrument-label">${instrument.name}</span>`;
    orchestra.append(button);
    scope.tap(button, () => {
      const count = counts.get(instrument.id) || 0; counts.set(instrument.id, count + 1);
      playInstrument(instrument.id, count); animateToy(button, 'instrument-playing');
      announcement.textContent = `${instrument.name}　${instrument.call}`; animateToy(announcement, 'instrument-saying');
      burstAt(scope, button, toyColors[index % toyColors.length], ['♪', '♫', '♪']);
    });
  });
}
