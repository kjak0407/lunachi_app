// Small original instrument voices, with rounded SVG illustrations.
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
  const face = '<circle cx="54" cy="68" r="2.5" fill="#74635a"/><circle cx="70" cy="68" r="2.5" fill="#74635a"/><path d="M57 76q5 4 10 0" stroke="#74635a" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  const pictures = {
    drum: '<rect x="22" y="39" width="80" height="52" rx="16" fill="#edb0aa"/><path d="m25 50 15 28 15-28 15 28 15-28 15 28" stroke="#fff1d9" stroke-width="4" fill="none"/><ellipse cx="62" cy="40" rx="40" ry="14" fill="#fff3dc"/><ellipse cx="62" cy="39" rx="33" ry="9" fill="#f3e1bc"/><path d="m20 12 28 19m53-19-28 19" stroke="#ab8b74" stroke-width="6" stroke-linecap="round"/>',
    tambourine: '<circle cx="62" cy="59" r="39" fill="#f8edce" stroke="#e3b984" stroke-width="10"/><g fill="#b7c5ce" stroke="#edf4f5" stroke-width="2"><ellipse cx="62" cy="20" rx="12" ry="7"/><ellipse cx="62" cy="98" rx="12" ry="7"/><ellipse cx="23" cy="59" rx="7" ry="12"/><ellipse cx="101" cy="59" rx="7" ry="12"/></g>' + face,
    maracas: '<g transform="rotate(-22 40 65)"><rect x="32" y="61" width="13" height="45" rx="6" fill="#c7aa85"/><ellipse cx="39" cy="40" rx="24" ry="30" fill="#e8b7a8"/><path d="M17 39h44" stroke="#fff0cd" stroke-width="10"/></g><g transform="rotate(22 88 65)"><rect x="81" y="61" width="13" height="45" rx="6" fill="#c7aa85"/><ellipse cx="88" cy="40" rx="24" ry="30" fill="#b9d2ae"/><path d="M66 39h44" stroke="#fff0cd" stroke-width="10"/></g>',
    xylophone: '<path d="M21 40h87M21 88h87" stroke="#b59a83" stroke-width="7"/>' + ['#eab2ad','#edc791','#e5d589','#bdd2ac','#add2dc'].map((color, i) => `<rect x="${16 + i * 20}" y="${22 + i * 5}" width="16" height="${78 - i * 10}" rx="6" fill="${color}"/><circle cx="${24 + i * 20}" cy="45" r="2" fill="#fff9"/>`).join('') + '<path d="m14 14 56 36" stroke="#a48b78" stroke-width="4" stroke-linecap="round"/><circle cx="71" cy="51" r="7" fill="#f5ebd8"/>',
    triangle: '<path d="M61 20 18 93h88L74 38" stroke="#9dbbc9" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M61 20v-9" stroke="#c8b494" stroke-width="4"/><path d="m79 91 32-33" stroke="#bda783" stroke-width="5" stroke-linecap="round"/>',
    cymbal: '<ellipse cx="42" cy="58" rx="32" ry="39" fill="#e5c579"/><ellipse cx="86" cy="58" rx="32" ry="39" fill="#efd590"/><g fill="none" stroke="#fff2c4" stroke-width="3"><ellipse cx="42" cy="58" rx="23" ry="30"/><ellipse cx="86" cy="58" rx="23" ry="30"/></g><g fill="#b8a17c"><ellipse cx="42" cy="58" rx="7" ry="12"/><ellipse cx="86" cy="58" rx="7" ry="12"/></g>',
    bells: '<path d="M26 79V51a36 36 0 0 1 72 0v28" fill="none" stroke="#e3b3c8" stroke-width="12" stroke-linecap="round"/><rect x="22" y="79" width="80" height="17" rx="8" fill="#b7cee0"/><g fill="#eed18e" stroke="#d5b777" stroke-width="2"><circle cx="26" cy="53" r="11"/><circle cx="40" cy="27" r="11"/><circle cx="67" cy="17" r="11"/><circle cx="91" cy="35" r="11"/><circle cx="99" cy="62" r="11"/></g><path d="M23 49v8m14-34 5 7m23-17 3 8m22 26 4 6m2 6v8" stroke="#9b8564" stroke-width="3" stroke-linecap="round"/>',
    guitar: '<g transform="rotate(25 63 62)"><rect x="57" y="8" width="15" height="63" rx="5" fill="#bea087"/><rect x="52" y="3" width="25" height="21" rx="7" fill="#cbaa85"/><path d="M44 55q-19-6-18 12 0 10 8 15-14 7-10 21 7 20 38 17 34 0 38-20 3-13-11-20 12-12 4-22-8-9-22 0Z" transform="translate(0 -13)" fill="#edc18e"/><circle cx="63" cy="77" r="12" fill="#a68c75"/><path d="M58 19v80m5-80v80m5-80v80" stroke="#fff0d4" stroke-width="1.4"/><rect x="49" y="94" width="29" height="6" rx="3" fill="#ab8c71"/></g>',
    trumpet: '<path d="M20 57h61q11-3 27-18v50q-16-15-27-18H43q-16 0-16 17 0 12 20 12h28q15 0 15-18V61" fill="none" stroke="#e6c87f" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/><path d="m84 55 24-16v50L84 73Z" fill="#efd997"/><ellipse cx="109" cy="64" rx="8" ry="25" fill="#d3ae67"/><path d="M43 58V40m15 18V40m15 18V40" stroke="#bfa779" stroke-width="5"/><path d="M38 39h10m5 0h10m5 0h10M12 57h10" stroke="#eeddb7" stroke-width="6" stroke-linecap="round"/>',
  };
  return `<svg class="instrument-art" viewBox="0 0 124 124" aria-hidden="true">${pictures[id]}</svg>`;
}

function playInstrument(id, count = 0) {
  const voice = toyVoice(1.4);
  if (!voice) return;
  if (typeof duckMusic === 'function') duckMusic(1.4);
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
