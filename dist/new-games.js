function newPlayArt(index) {
  return `<span class="new-play-art" style="--new-position:${index % 3 * 50}% ${Math.floor(index / 3) * 50}%" aria-hidden="true"></span>`;
}

toyBuilders.explore = scope => {
  const {stage} = scope;
  stage.innerHTML = '<div class="explore-world"><div class="explore-trees" aria-hidden="true">♧　♧　♧</div></div><div class="explore-dark" aria-hidden="true"></div><button class="explore-lamp" aria-label="懐中電灯。矢印キーでも探せます">'+newPlayArt(0)+'</button><p class="explore-message" aria-live="polite">ひかりで さがそう！</p>';
  const world = stage.querySelector('.explore-world'), message = stage.querySelector('.explore-message');
  const treasures = [{name:'いぬ',animal:0},{name:'ねこ',animal:1},{name:'ひよこ',animal:3},{name:'たからばこ',art:3},{name:'うさぎ',toy:7},{name:'おほしさま',variety:15},{name:'かめ',variety:6},{name:'あめ',variety:14}];
  let found = new Set(), x = .5, y = .5, resetPending = false;
  const spots = treasures.map((item,i) => {
    const spot = document.createElement('div'); spot.className='explore-hidden';
    spot.style.cssText=`left:${20+i%3*30}%;top:${15+Math.floor(i/3)*29}%`;
    spot.innerHTML=item.animal!==undefined ? `<span class="animal-portrait" style="--position:${animals[item.animal].position}" aria-hidden="true"></span>` : item.art!==undefined ? newPlayArt(item.art) : item.toy!==undefined ? toyArt(item.toy) : varietyArt(item.variety);
    world.append(spot); return spot;
  });
  function shine(nextX,nextY) {
    x=Math.max(.05,Math.min(.95,nextX)); y=Math.max(.05,Math.min(.93,nextY));
    stage.style.setProperty('--light-x',`${x*100}%`); stage.style.setProperty('--light-y',`${y*100}%`);
    const rect=stage.getBoundingClientRect(), radius=Math.min(rect.width*.28,110);
    spots.forEach((spot,i)=>{
      const r=spot.getBoundingClientRect();
      if(found.has(i)||Math.hypot(r.left+r.width/2-rect.left-x*rect.width,r.top+r.height/2-rect.top-y*rect.height)>radius*.75)return;
      found.add(i);spot.classList.add('found');animateToy(spot);
      const item=treasures[i];
      if(item.animal!==undefined) playSound(animals[item.animal].id); else toySound('chime',i%3);
      message.textContent=`${item.name}、みつけた！`;burstAt(scope,spot,'#ffdfa0',['✦','☆','✦']);
    });
    if(found.size===spots.length&&!resetPending){
      resetPending=true;message.textContent='ぜんぶ みつけた！';
      scope.after(()=>{found.clear();spots.forEach(s=>s.classList.remove('found'));resetPending=false;message.textContent='もういっかい さがそう！';},2200);
    }
  }
  function pointer(event){const r=stage.getBoundingClientRect();shine((event.clientX-r.left)/r.width,(event.clientY-r.top)/r.height);}
  scope.on(stage,'pointerdown',event=>{if(event.button!==0)return;stage.setPointerCapture(event.pointerId);pointer(event);});
  scope.on(stage,'pointermove',event=>{if(event.buttons)pointer(event);});
  scope.on(stage.querySelector('.explore-lamp'),'keydown',event=>{
    const delta={ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,-.15],ArrowDown:[0,.15],Enter:[.2,.15],' ':[-.2,-.15]}[event.key];
    if(delta){event.preventDefault();shine(x+delta[0],y+delta[1]);}
  });
};

toyBuilders.blocks = scope => {
  const {stage}=scope;
  stage.innerHTML='<p class="blocks-message" aria-live="polite">コトン！と つもう</p><button class="block-building" aria-label="積み木を積む。８個で塔ができます"><span class="block-tower" aria-hidden="true"></span><span class="block-floor" aria-hidden="true"></span></button><div class="block-controls"><button class="add-block" aria-label="積み木をひとつ積む">＋</button><button class="crash-blocks" aria-label="積み木を崩す">どーん！</button></div>';
  const tower=stage.querySelector('.block-tower'), message=stage.querySelector('.blocks-message');
  let count=0,crashing=false;
  function crash(){
    if(!count||crashing)return;crashing=true;
    const voice=toyVoice(); if(voice)for(let i=0;i<5;i++){voice.tone(180+i*45,.16,i*.08,.22,'triangle',70);voice.noise(.1,i*.08,.14,800+i*300);}
    [...tower.children].forEach((block,i)=>{block.style.setProperty('--fall-x',`${(i%2?1:-1)*(60+i*14)}px`);block.style.setProperty('--fall-turn',`${(i%2?1:-1)*(60+i*25)}deg`);block.classList.add('block-falling');});
    message.textContent='どーーん！';burstAt(scope,tower,'#e9ad64',['✦','☆','✦']);
    scope.after(()=>{tower.replaceChildren();count=0;crashing=false;message.textContent='もういっかい つもう！';},900);
  }
  function add(){
    if(crashing)return;if(count===8){crash();return;}
    const block=document.createElement('span');block.className='wood-block';
    block.style.cssText=`--block-color:${toyColors[count%toyColors.length]};--block-tilt:${count%2?3:-3}deg`;
    block.textContent=['★','♡','●','✿'][count%4];tower.append(block);count++;
    const voice=toyVoice();if(voice){voice.tone(320+count*30,.16,0,.27,'triangle',120);voice.noise(.06,0,.12,950);}
    message.textContent=count===8?'できた！さわると どーん！':`${count}こ、コトン！`;
  }
  scope.tap(stage.querySelector('.block-building'),add);scope.tap(stage.querySelector('.add-block'),add);scope.tap(stage.querySelector('.crash-blocks'),crash);
};

toyBuilders.cooking = scope => {
  const {stage}=scope;
  stage.innerHTML=`<div class="cooking-dog"><span class="animal-portrait" style="--position:0% 0%" aria-hidden="true"></span></div><p class="cooking-message" aria-live="polite">なにを やこうかな？</p><div class="cooking-pan">${newPlayArt(2)}<span class="cooking-steam" aria-hidden="true">♨</span></div><div class="cooking-ingredients">${[{name:'たまご',art:4},{name:'パン',art:5},{name:'やさい',art:6}].map(food=>`<button data-food="${food.art}" aria-label="${food.name}を焼く">${newPlayArt(food.art)}</button>`).join('')}</div><button class="serve-food" aria-label="できた料理をいぬに食べさせる" hidden>${newPlayArt(7)}</button>`;
  const pan=stage.querySelector('.cooking-pan'),dog=stage.querySelector('.cooking-dog'),message=stage.querySelector('.cooking-message'),serve=stage.querySelector('.serve-food');
  const ingredients=[...stage.querySelectorAll('[data-food]')];let busy=false;
  ingredients.forEach(button=>scope.tap(button,()=>{
    if(busy)return;busy=true;ingredients.forEach(b=>b.disabled=true);
    const food=document.createElement('span');food.className='cooking-food';food.innerHTML=newPlayArt(Number(button.dataset.food));pan.append(food);pan.classList.add('sizzling');message.textContent='じゅうじゅう！';
    const voice=toyVoice();if(voice){for(let i=0;i<5;i++)voice.noise(.24,i*.16,.15,4200,.7);voice.tone(660,.16,.78,.12);}
    scope.after(()=>{pan.classList.remove('sizzling');food.remove();pan.hidden=true;serve.hidden=false;message.textContent='できた！おさらに さわってね';toySound('chime');},1100);
  }));
  scope.tap(serve,()=>{
    if(serve.hidden)return;serve.hidden=true;dog.classList.add('eating');message.textContent='もぐもぐ、おいしい！';toySound('fruit');burstAt(scope,dog,'#e6a2b6',['♡','♡','♡']);
    scope.after(()=>{dog.classList.remove('eating');pan.hidden=false;ingredients.forEach(b=>b.disabled=false);busy=false;message.textContent='もういっかい つくろう！';},1400);
  });
};
