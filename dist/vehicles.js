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
  const index = vehicleCatalog.findIndex(item => item.id === vehicle.id);
  return `<span class="vehicle-sprite" style="--sprite-position:${index % 3 * 50}% ${Math.floor(index / 3) * 50}%" aria-hidden="true"></span>`;
}
