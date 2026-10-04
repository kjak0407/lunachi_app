import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const code = readFileSync(new URL('../dist/music.js', import.meta.url), 'utf8');
function setup() {
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {hidden:id !== 'home',listeners:{},setAttribute(){},addEventListener(name,fn){this.listeners[name]=fn;}});
    return nodes.get(id);
  };
  const events={}, requests=[], sources=[], levels=[];
  const audio = {
    currentTime:1, resume:async()=>{}, decodeAudioData:async bytes=>bytes,
    createGain(){return {connect(){},disconnect(){},gain:{cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(v){levels.push(v);},setTargetAtTime(v){levels.push(v);}}};},
    createBufferSource(){const source={connect(){return this;},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};sources.push(source);return source;},
  };
  let observer;
  const document={hidden:false,body:{dataset:{}},addEventListener(name,fn){events[name]=fn;}};
  const preferences={enabled:true,volume:60,musicEnabled:true,musicVolume:35};
  const context=vm.createContext({$,audio,master:{},preferences,document,currentToy:null,
    setTimeout,clearTimeout,
    window:{addEventListener(){}},initAudio(){},syncSettings(){context.syncMusic();},
    MutationObserver:class {constructor(fn){observer=fn;}observe(){}},
    fetch(url){let complete;const promise=new Promise(resolve=>complete=resolve);requests.push({url,complete:()=>complete({ok:true,arrayBuffer:async()=>url})});return promise;},
  });
  function $(id){return node(id);}
  vm.runInContext(code,context);
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  return {context,node,events,requests,sources,levels,document,preferences,settle,
    start(){node('home-music').listeners.click();},
    navigate(id){node('home').hidden=id!=='home';node('animals').hidden=id!=='animals';node('toy-game').hidden=['home','animals'].includes(id);context.currentToy=id;observer();},
  };
}

test('No autoplay; start home music, then switch all nine games and return home',async()=>{
  const h=setup();assert.equal(h.requests.length,0);h.start();
  assert.equal(h.requests[0].url,'assets/bgm/home.wav');h.requests[0].complete();await h.settle();
  assert.equal(h.document.body.dataset.bgmState,'playing');
  for(const id of ['animals','piano','balloons','vehicles','drums','drawing','peekaboo','fruit','water']){
    const previous=h.sources.at(-1);h.navigate(id);assert.equal(previous.stopped,true);
    assert.equal(h.requests.at(-1).url,`assets/bgm/${id}.wav`);h.requests.at(-1).complete();await h.settle();
    assert.equal(h.sources.at(-1).loop,true);assert.equal(h.document.body.dataset.bgmTrack,id);
  }
  h.navigate('home');await h.settle();assert.equal(h.requests.length,10);
  assert.equal(h.document.body.dataset.bgmTrack,'home');assert.equal(h.document.body.dataset.bgmState,'playing');
});
test('Rapid navigation and backgrounding cancel in-flight music',async()=>{
  const h=setup();h.start();h.navigate('animals');h.navigate('water');
  h.requests[0].complete();h.requests[1].complete();await h.settle();assert.equal(h.sources.length,0);
  h.document.hidden=true;h.events.visibilitychange();h.requests[2].complete();await h.settle();assert.equal(h.sources.length,0);
  h.document.hidden=false;h.events.visibilitychange();await h.settle();assert.equal(h.sources.length,1);
  assert.equal(h.document.body.dataset.bgmTrack,'water');
});
test('Music mute, global mute, zero volume and level changes control active source',async()=>{
  const h=setup();h.start();h.requests[0].complete();await h.settle();
  h.preferences.musicVolume=80;h.context.syncMusic();assert.equal(h.levels.at(-1),.8*.85*.6);
  h.node('home-music').listeners.click();assert.equal(h.preferences.musicEnabled,false);assert.equal(h.sources.at(-1).stopped,true);
  h.node('home-music').listeners.click();await h.settle();assert.equal(h.document.body.dataset.bgmState,'playing');
  h.preferences.volume=0;h.context.syncMusic();assert.equal(h.document.body.dataset.bgmState,'playing');
  for(const field of ['musicVolume']){
    h.preferences[field]=0;h.context.syncMusic();assert.equal(h.document.body.dataset.bgmState,'off');
    h.preferences[field]=35;h.context.syncMusic();await h.settle();assert.equal(h.document.body.dataset.bgmState,'playing');
  }
  h.preferences.enabled=false;h.context.syncMusic();assert.equal(h.sources.at(-1).stopped,true);
});
test('Effects briefly lower energetic music, and music returns to its selected level',async()=>{
  const h=setup();h.start();h.requests[0].complete();await h.settle();
  h.context.duckMusic(.6);assert.equal(h.levels.at(-1),.35*.85*.6*.32);
  h.context.audio.currentTime=2;h.context.syncMusic();assert.equal(h.levels.at(-1),.35*.85*.6);
  h.preferences.enabled=false;h.context.syncMusic();
});

