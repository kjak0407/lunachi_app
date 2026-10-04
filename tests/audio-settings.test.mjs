import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');
const restore = source.slice(source.indexOf('let preferences ='), source.indexOf('let audio,'));
const sync = source.slice(source.indexOf('function syncSettings()'), source.indexOf('function initAudio()'));
function setup(saved, failSave = false) {
  const nodes = new Map();
  const levels = {};
  let stored = saved;
  const context = vm.createContext({
    localStorage: { getItem: () => stored, setItem(key, value) { if (failSave) throw Error('Unavailable'); stored = value; } },
    $(id) { if (!nodes.has(id)) nodes.set(id, { setAttribute() {} }); return nodes.get(id); },
    soundSvg: () => '', audio: { currentTime: 1 },
    master: { gain: { setTargetAtTime(value) { levels.master = value; } } },
    effectsGain: { gain: { setTargetAtTime(value) { levels.effects = value; } } },
  });
  vm.runInContext(restore + sync, context);
  return { context, levels, nodes, saved: () => stored, preferences: () => JSON.parse(vm.runInContext('JSON.stringify(preferences)', context)) };
}
test('Separate volumes persist across reload; effects volume does not change the shared output', () => {
  const first = setup(null);
  vm.runInContext('preferences.volume=22; preferences.musicVolume=77; syncSettings()', first.context);
  assert.equal(first.levels.master, .75);
  assert.equal(first.levels.effects, .22);
  const reloaded = setup(first.saved());
  assert.equal(reloaded.preferences().volume, 22);
  assert.equal(reloaded.preferences().musicVolume, 77);
  vm.runInContext('preferences.shuffleSeconds=120; syncSettings()', first.context);
  assert.equal(setup(first.saved()).preferences().shuffleSeconds, 120);
  vm.runInContext('preferences.volume=0; syncSettings()', first.context);
  assert.equal(first.levels.master, .75);
  assert.equal(first.levels.effects, 0);
  assert.equal(first.preferences().musicVolume, 77);
});
test('Existing settings remain usable and storage failures are visible', () => {
  const h = setup(JSON.stringify({enabled:true,volume:44}), true);
  assert.equal(h.preferences().volume, 44);
  assert.equal(h.preferences().musicVolume, 35);
  assert.equal(h.preferences().shuffleSeconds, 60);
  h.context.syncSettings();
  assert.match(h.nodes.get('settings-save-status').textContent, /保存できません/);
  assert.equal(h.levels.effects, .44);
});
