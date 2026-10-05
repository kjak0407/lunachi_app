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
    currentTime:1, resume:async()=>{}, decodeAudioData:async bytes=>({duration:40,url:bytes}),
    createGain(){return {connect(){},disconnect(){},gain:{cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(v){levels.push(v);},setTargetAtTime(v){levels.push(v);}}};},
    createBufferSource(){const source={connect(){return this;},disconnect(){},start(when,offset){this.started=true;this.offset=offset;},stop(){this.stopped=true;this.onended?.();}};sources.push(source);return source;},
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

test('No autoplay; playlist continues across all twelve games and home',async()=>{
  const h=setup();assert.equal(h.requests.length,0);h.start();
  assert.equal(h.requests[0].url,'assets/bgm/nursery-twinkle.wav');h.requests[0].complete();await h.settle();
  assert.equal(h.document.body.dataset.bgmState,'playing');
  for(const id of ['animals','piano','balloons','vehicles','drums','drawing','peekaboo','fruit','water','explore','blocks','cooking']){
    const previous=h.sources.at(-1);h.navigate(id);assert.equal(previous.stopped,undefined);
    assert.equal(h.sources.at(-1),previous);assert.equal(previous.loop,false);
  }
  h.navigate('home');await h.settle();assert.equal(h.requests.length,1);
  assert.equal(h.document.body.dataset.bgmTrack,'twinkle');assert.equal(h.document.body.dataset.bgmState,'playing');
});
test('Navigation preserves loading; backgrounding cancels stale playback',async()=>{
  const h=setup();h.start();h.navigate('animals');h.navigate('water');
  assert.equal(h.requests.length,1);
  h.document.hidden=true;h.events.visibilitychange();h.requests[0].complete();await h.settle();assert.equal(h.sources.length,0);
  h.document.hidden=false;h.events.visibilitychange();await h.settle();assert.equal(h.sources.length,1);
  assert.equal(h.document.body.dataset.bgmTrack,'twinkle');
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
test('Music stays at the selected level over time; piano keeps its quieter screen level',async()=>{
  const h=setup();h.start();h.requests[0].complete();await h.settle();
  assert.equal(typeof h.context.duckMusic,'undefined');
  assert.equal(h.levels.at(-1),.35*.85*.6);
  h.context.audio.currentTime=2;h.context.syncMusic();assert.equal(h.levels.at(-1),.35*.85*.6);
  h.navigate('piano');await h.settle();
  assert.equal(h.levels.at(-1),.35*.85*.6*.4);
  h.preferences.enabled=false;h.context.syncMusic();
});

test('Song endings automatically play all ten, reshuffle, and never repeat immediately',async()=>{
  const h=setup();h.start();h.requests[0].complete();await h.settle();
  const titles=[];
  for(let i=0;i<20;i++){
    titles.push(h.document.body.dataset.bgmTrack);
    assert.equal(h.sources.at(-1).loop,false);
    h.sources.at(-1).onended();
    h.requests.at(-1).complete();await h.settle();
  }
  assert.equal(new Set(titles.slice(0,10)).size,10);
  assert.equal(new Set(titles.slice(10)).size,10);
  for(let i=1;i<titles.length;i++)assert.notEqual(titles[i],titles[i-1]);
  h.preferences.enabled=false;h.context.syncMusic();
});

test('Mute/background stop never advances; resume retains playback position',async()=>{
  const h=setup();h.start();h.requests[0].complete();await h.settle();
  h.context.audio.currentTime=8;h.document.hidden=true;h.events.visibilitychange();
  assert.equal(h.document.body.dataset.bgmTrack,'twinkle');
  h.document.hidden=false;h.events.visibilitychange();await h.settle();
  assert.equal(h.sources.at(-1).offset,7);
  const previous=h.sources.at(-1);
  h.preferences.musicEnabled=false;h.context.syncMusic();previous.onended();
  assert.equal(h.document.body.dataset.bgmTrack,'twinkle');assert.equal(h.requests.length,1);
});

