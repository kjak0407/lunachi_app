// Rounded pastel vehicle drawings and the shared catalog for sound routing.
const vehicleCatalog = [
  { id: 'car', name: 'くるま', art: 2, sound: 'ぶるるん！', duration: 2.6 },
  { id: 'train', name: 'でんしゃ', art: 3, sound: 'ぽっぽー！', duration: 2.8 },
  { id: 'boat', name: 'ふね', art: 4, sound: 'ぼーっ！', duration: 2.8 },
  { id: 'airplane', name: 'ひこうき', sound: 'びゅーん！', duration: 2.8, sky: true },
  { id: 'bus', name: 'バス', sound: 'ぷっぷー！', duration: 2.8 },
  { id: 'helicopter', name: 'ヘリコプター', sound: 'ばたばた！', duration: 2.8, sky: true },
  { id: 'firetruck', name: 'しょうぼうしゃ', sound: 'うー！ カンカン！', duration: 2.8 },
  { id: 'ambulance', name: 'きゅうきゅうしゃ', sound: 'ぴーぽー！', duration: 2.8 },
  { id: 'police', name: 'パトカー', sound: 'うーうー！', duration: 2.8 },
];

function vehicleArt(vehicle) {
  if (vehicle.art !== undefined) return toyArt(vehicle.art);
  const face = '<circle cx="118" cy="57" r="2.5" fill="#665a58"/><circle cx="133" cy="57" r="2.5" fill="#665a58"/><path d="M121 65q5 5 10 0" fill="none" stroke="#665a58" stroke-width="2.5" stroke-linecap="round"/>';
  const wheels = '<g fill="#776f80"><circle cx="40" cy="88" r="12"/><circle cx="119" cy="88" r="12"/></g><g fill="#f4e9dd"><circle cx="40" cy="88" r="5"/><circle cx="119" cy="88" r="5"/></g>';
  const light = '<rect class="vehicle-beacon" x="99" y="22" width="21" height="10" rx="5" fill="#ef8e96"/>';
  let drawing;
  if (vehicle.id === 'airplane') {
    drawing = '<path d="M28 58L16 30h18l20 25M72 63L55 20h21l33 41M70 71l-12 23h20l23-24" fill="#b5c5e7"/><path d="M22 58q-12 6 0 18h106q28-2 22-14l-17-11H48Z" fill="#f8d9a9"/><path d="M119 51h14l13 10h-27Z" fill="#b1d9df"/><g fill="#b1d9df"><circle cx="62" cy="64" r="5"/><circle cx="81" cy="64" r="5"/><circle cx="100" cy="64" r="5"/></g>';
  } else if (vehicle.id === 'helicopter') {
    drawing = '<path d="M67 65L16 50v-15H6v30l57 19" fill="#b4cdae"/><path d="M57 97h78M73 85v12m48-12v12" stroke="#887d8b" stroke-width="5" stroke-linecap="round"/><path d="M89 37V22" stroke="#887d8b" stroke-width="5"/><g class="vehicle-rotor"><rect x="30" y="17" width="119" height="6" rx="3" fill="#887d8b"/></g><rect x="57" y="35" width="89" height="50" rx="25" fill="#c1dcba"/><path d="M102 40h16q24 0 24 29h-40Z" fill="#dbf0f4"/>' + face;
  } else {
    const color = vehicle.id === 'bus' ? '#f3d395' : vehicle.id === 'firetruck' ? '#eea1a2' : '#fcf9f3';
    drawing = `<rect x="17" y="33" width="130" height="54" rx="17" fill="${color}"/>`;
    if (vehicle.id === 'bus') drawing += '<g fill="#d1e8ec"><rect x="25" y="41" width="21" height="22" rx="5"/><rect x="52" y="41" width="21" height="22" rx="5"/><rect x="79" y="41" width="21" height="22" rx="5"/><rect x="108" y="41" width="32" height="30" rx="8"/></g><path d="M24 74h77" stroke="#e6b971" stroke-width="5"/>';
    if (vehicle.id === 'firetruck') drawing += light + '<rect x="105" y="40" width="35" height="31" rx="7" fill="#d1e8ec"/><path d="M28 30h66M28 23h66M35 23v7m15-7v7m15-7v7m15-7v7" stroke="#e9e4da" stroke-width="4" stroke-linecap="round"/><rect x="27" y="45" width="65" height="29" rx="5" fill="#e8c7b7"/><path d="M36 53h47m-47 12h47" stroke="#d28e87" stroke-width="3"/>';
    if (vehicle.id === 'ambulance') drawing += light + '<rect x="105" y="40" width="35" height="31" rx="7" fill="#d1e8ec"/><path d="M18 78h128" stroke="#efa5ab" stroke-width="9"/><path d="M51 45v23m-11-11h22" stroke="#dc929d" stroke-width="7" stroke-linecap="round"/>';
    if (vehicle.id === 'police') drawing += light + '<rect x="35" y="40" width="33" height="24" rx="7" fill="#d1e8ec"/><rect x="105" y="40" width="35" height="31" rx="7" fill="#d1e8ec"/><path d="M17 73h130v8q0 6-14 6H31q-14 0-14-6Z" fill="#858292"/><path d="m83 47 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#e9c879"/>';
    drawing += face + wheels;
  }
  return `<svg class="vehicle-art" viewBox="0 0 160 110" aria-hidden="true">${drawing}</svg>`;
}
