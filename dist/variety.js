// Distinct play loops: roaming, popping, stamping, finding, feeding and splashing.
function varietyArt(index) {
  return `<span class="toy-art variety-art" style="--toy-position:${index % 4 / 3 * 100}% ${Math.floor(index / 4) / 3 * 100}%" aria-hidden="true"></span>`;
}

const stampImages = {};
for (const [name, src] of Object.entries({animal:'assets/animals.png',toy:'assets/playthings.png',variety:'assets/variety.png'})) {
  const image = new Image(); image.src = src; stampImages[name] = image;
}
const stampChoices = [
  {name:'いぬ',sheet:'animal',index:0}, {name:'ねこ',sheet:'animal',index:1},
  {name:'ひよこ',sheet:'animal',index:3}, {name:'いちご',sheet:'toy',index:10},
  {name:'おほしさま',sheet:'variety',index:15}, {name:'あめ',sheet:'variety',index:14},
];
function stampArt(stamp) {
  if (stamp.sheet === 'animal') return `<span class="animal-portrait" style="--position:${stamp.index % 3 / 2 * 100}% ${Math.floor(stamp.index / 3) * 100}%" aria-hidden="true"></span>`;
  return stamp.sheet === 'toy' ? toyArt(stamp.index) : varietyArt(stamp.index);
}
toyBuilders.drawing = (scope) => {
  const {stage} = scope;
  stage.innerHTML = `<div class="drawing-toolbar" aria-label="おえかきの色">${toyColors.slice(0,6).map((color,i)=>`<button class="color-choice" style="--paint:${color}" data-color="${i}" aria-label="${['ピンク','オレンジ','きいろ','みどり','あお','むらさき'][i]}で描く" aria-pressed="${i===0}"></button>`).join('')}<button class="clear-drawing" aria-label="おえかきを消す">けす</button></div><div class="stamp-toolbar" aria-label="ペンとスタンプ"><button class="stamp-tool" data-tool="pen" aria-label="ペンで描く" aria-pressed="true">✎</button>${stampChoices.map((stamp,i)=>`<button class="stamp-tool" data-tool="${i}" aria-label="${stamp.name}のスタンプ" aria-pressed="false">${stampArt(stamp)}</button>`).join('')}</div><canvas class="drawing-canvas" tabindex="0" role="button" aria-label="おえかきする場所。指で描くかスタンプを押す"></canvas>`;
  const canvas=stage.querySelector('canvas'), ctx=canvas.getContext('2d'), pointers=new Map();
  let width=1,height=1,colorIndex=0,tool='pen',lastSound=0;
  function paint(point,prev) {
    if (point.stamp !== undefined) {
      const stamp=stampChoices[point.stamp], img=stampImages[stamp.sheet];
      if (!img.complete || !img.naturalWidth) return;
      const cols=stamp.sheet==='animal'?3:4, rows=stamp.sheet==='animal'?2:4;
      const cellW=img.naturalWidth/cols, cellH=img.naturalHeight/rows, size=Math.min(width*.23,88);
      ctx.shadowBlur=0;
      ctx.drawImage(img,stamp.index%cols*cellW,Math.floor(stamp.index/cols)*cellH,cellW,cellH,point.x*width-size/2,point.y*height-size/2,size,size);
      return;
    }
    const color=toyColors[point.color]; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=14;
    ctx.strokeStyle=color; ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=10;
    if (prev) {ctx.beginPath();ctx.moveTo(prev.x*width,prev.y*height);ctx.lineTo(point.x*width,point.y*height);ctx.stroke();}
    ctx.beginPath();ctx.arc(point.x*width,point.y*height,7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    if(point.star){ctx.fillStyle='#fff';ctx.font='17px sans-serif';ctx.fillText('✦',point.x*width-6,point.y*height+5);}
  }
  function redraw(){
    const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=r.width;height=r.height;
    canvas.width=Math.max(1,Math.round(width*dpr));canvas.height=Math.max(1,Math.round(height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);
    drawingStrokes.forEach(stroke=>stroke.forEach((point,i)=>paint(point,i?stroke[i-1]:null)));
  }
  const observer=new ResizeObserver(redraw);observer.observe(canvas);
  Object.values(stampImages).forEach(img=>scope.on(img,'load',redraw));
  const tools=[...stage.querySelectorAll('.stamp-tool')], colors=[...stage.querySelectorAll('.color-choice')];
  function setTool(next){tool=next;tools.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tool===next)));}
  tools.forEach(button=>scope.on(button,'click',()=>{setTool(button.dataset.tool);toySound('chime');}));
  colors.forEach(button=>scope.on(button,'click',()=>{
    colorIndex=Number(button.dataset.color);setTool('pen');colors.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));toySound('chime',colorIndex);
  }));
  scope.on(stage.querySelector('.clear-drawing'),'click',()=>{drawingStrokes=[];pointers.clear();ctx.clearRect(0,0,width,height);toySound('pop');});
  function add(stroke,x,y){
    const r=canvas.getBoundingClientRect(),prev=stroke.at(-1);
    const point={x:Math.max(0,Math.min(1,(x-r.left)/width)),y:Math.max(0,Math.min(1,(y-r.top)/height)),color:colorIndex,star:stroke.length%5===0};
    if(tool!=='pen')point.stamp=Number(tool);
    const distance=prev?Math.hypot((point.x-prev.x)*width,(point.y-prev.y)*height):Infinity;
    if(distance<(point.stamp===undefined?4:55))return;
    paint(point,point.stamp===undefined?prev:null);stroke.push(point);
    if(performance.now()-lastSound>110){toySound('chime',colorIndex);lastSound=performance.now();}
  }
  function begin(x,y){const stroke=[];drawingStrokes.push(stroke);add(stroke,x,y);return stroke;}
  scope.on(canvas,'pointerdown',e=>{if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,begin(e.clientX,e.clientY));});
  scope.on(canvas,'pointermove',e=>{const stroke=pointers.get(e.pointerId);if(stroke)add(stroke,e.clientX,e.clientY);});
  ['pointerup','pointercancel','lostpointercapture'].forEach(event=>scope.on(canvas,event,e=>pointers.delete(e.pointerId)));
  scope.on(canvas,'keydown',e=>{if(!['Enter',' '].includes(e.key))return;e.preventDefault();const r=canvas.getBoundingClientRect();begin(r.left+width*(.2+Math.random()*.6),r.top+height*(.2+Math.random()*.6));});
  return ()=>observer.disconnect();
};

toyBuilders.balloons = (scope) => {
  const { stage } = scope;
  for (let i = 0; i < 14; i++) {
    const button = document.createElement('button');
    button.className = 'rising-balloon';
    button.setAttribute('aria-label', `${i + 1}つめのふうせんを割る`);
    const duration = 13 + i % 4;
    button.style.cssText = `left:${9 + i % 5 * 19}%;--hue:${i * 43}deg;--rise-time:${duration}s;--rise-delay:${-i / 14 * duration}s;--sway:${i % 2 ? 16 : -16}px;--static-top:${10 + Math.floor(i / 5) * 29}%`;
    button.innerHTML = toyArt(1); stage.append(button);
    let popped = false;
    scope.tap(button, () => {
      if (popped) return;
      popped = true;
      const a = button.getBoundingClientRect(), b = stage.getBoundingClientRect();
      button.classList.add('popped'); button.disabled = true;
      toySound('pop');
      const x = a.left + a.width / 2 - b.left, y = a.top + a.height * .35 - b.top;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const ring = document.createElement('span');
      ring.className = 'balloon-pop-ring'; ring.setAttribute('aria-hidden', 'true');
      ring.style.cssText = `left:${x}px;top:${y}px`;
      stage.append(ring); scope.after(() => ring.remove(), 650);
      for (let k = 0; k < (reduced ? 6 : 22); k++) {
        const bit = document.createElement('span');
        bit.className = `balloon-confetti${k % 3 === 0 ? ' confetti-star' : ''}`;
        bit.setAttribute('aria-hidden', 'true');
        bit.textContent = k % 3 === 0 ? '✦' : '';
        const angle = Math.PI * 2 * k / 22, distance = 70 + Math.random() * 100;
        bit.style.cssText = `left:${x}px;top:${y}px;--confetti-x:${Math.cos(angle) * distance}px;--confetti-y:${Math.sin(angle) * distance}px;--confetti-color:${toyColors[k % toyColors.length]};--confetti-turn:${k % 2 ? 360 : -360}deg`;
        stage.append(bit); scope.after(() => bit.remove(), 1150);
      }
      const prizes = [varietyArt(14), varietyArt(15), '⭐', toyArt(10), '🌈'];
      for (let j = 0; j < 5; j++) {
        const prize = document.createElement('span');
        prize.className = 'balloon-prize'; prize.setAttribute('aria-hidden', 'true');
        prize.innerHTML = prizes[(i + j) % prizes.length];
        prize.style.cssText = `left:${x}px;top:${y}px;--prize-x:${(j - 2) * 52}px;--prize-y:${-95 + Math.abs(j - 2) * 25}px`;
        stage.append(prize); scope.after(() => prize.remove(), 1300);
      }
      scope.after(() => {
        popped = false; button.disabled = false;
        button.style.setProperty('--rise-delay', '0s');
        button.classList.remove('popped');
      }, 1300);
    });
  }
};

toyBuilders.peekaboo = (scope) => {
  const { stage } = scope;
  const covers = [{name:'はこ',art:9}, {name:'しげみ',art:8}, {name:'プレゼント',extra:12}, {name:'おはな',extra:13}];
  for (let i = 0; i < 9; i++) {
    const animal = animals[i % animals.length], cover = covers[i % covers.length];
    const rabbit = i === 6;
    const name = rabbit ? 'うさぎ' : animal.name;
    const label = `${cover.name}${i + 1}の後ろを見てみる`;
    const button = document.createElement('button');
    button.className = 'hide-object';
    button.style.cssText = `left:${17 + i % 3 * 33}%;top:${12 + Math.floor(i / 3) * 32 + (i % 3 === 1 ? 4 : 0)}%`;
    button.setAttribute('aria-label', label); button.setAttribute('aria-expanded', 'false');
    button.innerHTML = `<span class="peek-call" aria-hidden="true">ばあ！</span>${rabbit ? `<span class="peek-animal rabbit-portrait">${toyArt(7)}</span>` : `<span class="peek-animal animal-portrait" style="--position:${animal.position}" aria-hidden="true"></span>`}<span class="peek-cover">${cover.extra === undefined ? toyArt(cover.art) : varietyArt(cover.extra)}</span>`;
    stage.append(button);
    scope.tap(button, () => {
      const reveal = !button.classList.contains('revealed');
      button.classList.toggle('revealed', reveal); button.setAttribute('aria-expanded', String(reveal));
      button.setAttribute('aria-label', reveal ? `${name}${i + 1}をもう一度隠す` : label);
      if (reveal) {
        if (rabbit) toySound('chime'); else playSound(animal.id);
        burstAt(scope, button, '#c6a3ca', ['♡', '✦']);
      } else { stopSound(); toySound('chime'); }
    });
  }
};

toyBuilders.fruit = (scope) => {
  const { stage } = scope;
  stage.innerHTML = `<div class="snack-girl" aria-hidden="true">${varietyArt(0)}</div><p class="snack-message" aria-live="polite">どうぞ！</p><div class="fruit-basket" aria-label="くだもののかご"></div>`;
  const girl = stage.querySelector('.snack-girl'), message = stage.querySelector('.snack-message');
  const basket = stage.querySelector('.fruit-basket');
  let request = 0;
  const fruits = [{name:'いちご',art:10}, {name:'りんご',art:11}, {name:'バナナ',art:12}, {name:'みかん',extra:3}, {name:'ぶどう',extra:4}, {name:'もも',extra:5}];
  fruits.forEach((fruit, i) => {
    const art = fruit.extra === undefined ? toyArt(fruit.art) : varietyArt(fruit.extra);
    const button = document.createElement('button');
    button.className = 'feed-fruit'; button.setAttribute('aria-label', `${fruit.name}を食べさせる`);
    button.innerHTML = `${art}<span>${fruit.name}</span>`; basket.append(button);
    scope.tap(button, () => {
      const token = ++request;
      girl.innerHTML = varietyArt(1); girl.classList.remove('chewing'); message.textContent = 'あーん！';
      toySound('fruit', i % 3); animateToy(button);
      // Each fruit takes a visible path from its basket into the girl's mouth.
      const a = button.getBoundingClientRect(), b = stage.getBoundingClientRect(), g = girl.getBoundingClientRect();
      const snack = document.createElement('span'); snack.className = 'flying-snack'; snack.setAttribute('aria-hidden', 'true');
      snack.innerHTML = art;
      snack.style.cssText = `left:${a.left + a.width / 2 - b.left - 30}px;top:${a.top + a.width / 2 - b.top - 30}px;--food-x:${g.left + g.width / 2 - a.left - a.width / 2}px;--food-y:${g.top + g.height * .6 - a.top - a.width / 2}px`;
      stage.append(snack);
      scope.after(() => snack.remove(), 700);
      scope.after(() => {
        if (token !== request) return;
        girl.innerHTML = varietyArt(2); girl.classList.add('chewing'); message.textContent = 'もぐもぐ…';
        toySound('chime', i % 3);
      }, 550);
      scope.after(() => {
        if (token !== request) return;
        girl.innerHTML = varietyArt(0); girl.classList.remove('chewing'); message.textContent = 'おいしい！';
        burstAt(scope, girl, '#e3a8b5', ['♡', '♡']);
      }, 1550);
    });
  });
};

toyBuilders.water = (scope) => {
  const { stage } = scope;
  stage.innerHTML = `<div class="water-surface" tabindex="0" role="button" aria-label="おみずをちゃぷちゃぷする"></div>`;
  const surface = stage.querySelector('.water-surface'), pointers = new Map();
  function splash(x, y) {
    const rect = stage.getBoundingClientRect();
    const ripple = document.createElement('span'); ripple.className = 'water-ripple'; ripple.setAttribute('aria-hidden', 'true');
    ripple.style.cssText = `left:${x - rect.left}px;top:${y - rect.top}px`;
    while (stage.querySelectorAll('.water-ripple').length >= 15) stage.querySelector('.water-ripple').remove();
    stage.append(ripple); scope.after(() => ripple.remove(), 1200); toySound('water');
  }
  scope.on(surface, 'pointerdown', e => {
    if (e.button !== 0) return;
    surface.setPointerCapture(e.pointerId); pointers.set(e.pointerId, {x:e.clientX,y:e.clientY,time:performance.now()}); splash(e.clientX,e.clientY);
  });
  scope.on(surface, 'pointermove', e => {
    const prev = pointers.get(e.pointerId);
    if (prev && Math.hypot(e.clientX-prev.x,e.clientY-prev.y)>25 && performance.now()-prev.time>75) {
      splash(e.clientX,e.clientY); pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,time:performance.now()});
    }
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(event => scope.on(surface,event,e=>pointers.delete(e.pointerId)));
  scope.on(surface,'keydown',e=>{
    if (!['Enter',' '].includes(e.key)) return;
    e.preventDefault(); const r=stage.getBoundingClientRect(); splash(r.left+r.width/2,r.top+r.height/2);
  });
  const creatures = [{name:'アヒル',art:13}, {name:'おさかな',art:14}, {name:'かめ',extra:6}, {name:'たこ',extra:7}, {name:'あざらし',extra:8}, {name:'くじら',extra:9}, {name:'ペンギン',extra:10}, {name:'かに',extra:11}];
  creatures.forEach((creature,i)=>{
    const button=document.createElement('button'); button.className='pond-creature';
    button.setAttribute('aria-label',`${creature.name}と遊ぶ`);
    button.style.cssText=`left:${i%2 ? 69 : 24}%;top:${9+Math.floor(i/2)*24}%;--float-delay:${-i*.55}s`;
    button.innerHTML=`<span class="creature-swimmer">${creature.extra === undefined ? toyArt(creature.art) : varietyArt(creature.extra)}</span>`;
    stage.append(button);
    scope.tap(button,()=>{
      toySound(i===0?'duck':'water'); animateToy(button.querySelector('.creature-swimmer'),'creature-playing');
      const r=button.getBoundingClientRect(); splash(r.left+r.width/2,r.top+r.height*.8);
      burstAt(scope,button,toyColors[i%7],['○','♡','○']);
    });
  });
};
