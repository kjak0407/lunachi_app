import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('Wallpaper follows local time boundaries and updates after returning to the app',()=>{
  let hour = 5, tick;
  const events = {}, document = {hidden:false,body:{dataset:{}},addEventListener(name,fn){events[name]=fn;}};
  const context = vm.createContext({document,
    Date:class {getHours(){return hour;}},
    setInterval(fn){tick=fn;},window:{addEventListener(name,fn){events[name]=fn;}}});
  vm.runInContext(readFileSync(new URL('../dist/home-time.js',import.meta.url),'utf8'),context);
  assert.equal(document.body.dataset.homeTime,'night');
  for(const [h,period] of [[6,'morning'],[11,'morning'],[12,'day'],[17,'day'],[18,'night'],[23,'night'],[0,'night']]){
    hour=h; tick(); assert.equal(document.body.dataset.homeTime,period);
  }
  hour=8; events.visibilitychange(); assert.equal(document.body.dataset.homeTime,'morning');
  hour=13; events.pageshow(); assert.equal(document.body.dataset.homeTime,'day');
});
