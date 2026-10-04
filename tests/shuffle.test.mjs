import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function setup() {
  const nodes = new Map(), events = {}, timers = new Map(), visits = [];
  let timerId = 0, now = 0;
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {listeners:{}, addEventListener(name, fn) {this.listeners[name] = fn;}});
    return nodes.get(id);
  };
  const document = {hidden:false, body:{classList:{add(){},remove(){}}},
    addEventListener(name,fn){events[name] = fn;}, querySelectorAll(){return [node('manual-game')];}};
  const preferences = {shuffleSeconds:60};
  const context = vm.createContext({$:node,document,preferences,Math,performance:{now:()=>now},
    games:['animals','piano','balloons','vehicles','drums','drawing','peekaboo','fruit','water'].map(id => ({id})),
    openPlayroomGame(id){visits.push(id);}, syncSettings(){}, window:{addEventListener(){}},
    setTimeout(fn,delay){const id = ++timerId; timers.set(id,{fn,delay}); return id;}, clearTimeout(id){timers.delete(id);},
  });
  vm.runInContext(readFileSync(new URL('../dist/shuffle.js',import.meta.url),'utf8'),context);
  return {node,document,events,preferences,visits,timers,
    elapse(ms){now += ms;},
    advance(){assert.equal(timers.size,1); const [id,timer] = [...timers][0]; timers.delete(id); now += timer.delay; timer.fn();}};
}

test('Shuffle starts immediately, visits all nine once, and avoids repeats between rounds',()=>{
  const h = setup(); h.node('shuffle-button').listeners.click();
  assert.equal(h.visits.length,1); assert.equal([...h.timers.values()][0].delay,60000);
  for(let i=0;i<8;i++) h.advance();
  assert.equal(new Set(h.visits).size,9);
  h.advance(); assert.notEqual(h.visits[8],h.visits[9]);
  h.node('toy-home').listeners.click(); assert.equal(h.timers.size,0);
});

test('Continuous touches do not reset deadlines; held drawing switches even if the timer is delayed',()=>{
  const h = setup(); h.node('shuffle-button').listeners.click();
  for(let i=0;i<5;i++) {h.elapse(10000);h.events.pointermove();h.events.pointerdown();}
  assert.equal(h.visits.length,1);
  h.elapse(10000); h.events.pointermove();
  assert.equal(h.visits.length,2);
  assert.equal(h.timers.size,1);
  assert.equal([...h.timers.values()][0].delay,60000);
  h.events.pointerup(); assert.equal(h.visits.length,2);
});

test('Returning from background preserves deadline and switches immediately if overdue',()=>{
  const h = setup(); h.node('shuffle-button').listeners.click();
  h.elapse(20000); h.document.hidden = true; h.events.visibilitychange();
  h.elapse(10000); h.document.hidden = false; h.events.visibilitychange();
  assert.equal([...h.timers.values()][0].delay,30000);
  h.document.hidden = true; h.events.visibilitychange(); h.elapse(35000);
  h.document.hidden = false; h.events.visibilitychange();
  assert.equal(h.visits.length,2);
});

test('Changing interval reschedules; background suspends; manual play cancels shuffle',()=>{
  const h = setup(); h.node('shuffle-button').listeners.click();
  h.node('shuffle-seconds').listeners.input({target:{value:'20'}});
  assert.equal(h.preferences.shuffleSeconds,20); assert.equal([...h.timers.values()][0].delay,20000);
  h.document.hidden = true; h.events.visibilitychange(); assert.equal(h.timers.size,0);
  h.document.hidden = false; h.events.visibilitychange(); assert.equal(h.timers.size,1);
  assert.equal(h.visits.length,1);
  h.node('manual-game').listeners.click(); assert.equal(h.timers.size,0);
  h.events.visibilitychange(); assert.equal(h.timers.size,0);
});
