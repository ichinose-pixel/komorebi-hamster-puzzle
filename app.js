import {fresh,mark,undo,won,restore,solve} from './core.js?v=7c127fabbb404fea';
import {analyze} from './deduction.js?v=7c127fabbb404fea';
import {fallbackFor,signature} from './progression.js?v=7c127fabbb404fea';
import {hamster,roomScene,icon} from './art.js?v=7c127fabbb404fea';
const $=id=>document.getElementById(id),lp=new URLSearchParams(location.search).get('mode')==='lp';
const key=lp?'komorebi-lp-v1':'komorebi-v1',tutorialKey='komorebi-tutorial-v3',collectionKey=key+'-collection-v3';
const palette=['#E4CBA2','#BFD3BA','#D9C5CF','#C3D9D8','#E9BFA5','#CFD2A9','#C6CCE0','#E2D0BC'];
const catalog=await fetch('./catalog.json?v=7c127fabbb404fea').then(r=>{if(!r.ok)throw Error('catalog');return r.json();});
let g,busy=false,recent=[],hinted=[],premise=[],excluded=new Set(),hintCursor=0,errorCell=-1,winFor='',storageOk=true,worker=null,lpTimer=null;
let tut={version:1,index:0,ack:false,final:[],done:false},collection={version:1,completed:[]};
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
const oldTut=read(tutorialKey);if(oldTut?.version===1&&Number.isInteger(oldTut.index)&&oldTut.index>=0&&oldTut.index<=5&&Array.isArray(oldTut.final)&&oldTut.final.every(x=>Number.isInteger(x)&&x>=0&&x<25))tut={...oldTut,done:!!oldTut.done,ack:!!oldTut.ack};
const oldCollection=read(collectionKey);if(oldCollection?.version===1&&Array.isArray(oldCollection.completed))collection.completed=oldCollection.completed.filter(x=>typeof x==='string').slice(-10000);
function persist(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{storageOk=false;}}
function save(){if(g)persist(key,g);persist(key+'-recent',recent.slice(-50));persist(tutorialKey,tut);persist(collectionKey,collection);}
function message(text){$('status').textContent=text+(!storageOk?' この環境では保存できません。':'');}
function resetHint(){hinted=[];premise=[];excluded.clear();hintCursor=0;errorCell=-1;}
function sound(win=false){if(!$('sound').checked||matchMedia('(prefers-reduced-motion: reduce)').matches)return;try{const Audio=window.AudioContext||window.webkitAudioContext;const ctx=new Audio();[0,...(win?[.12,.24]:[])].forEach((delay,k)=>{const o=ctx.createOscillator(),gain=ctx.createGain();o.type='sine';o.frequency.value=win?[523,659,784][k]:440;gain.gain.setValueAtTime(0,ctx.currentTime+delay);gain.gain.linearRampToValueAtTime(.035,ctx.currentTime+delay+.01);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+delay+.15);o.connect(gain);gain.connect(ctx.destination);o.start(ctx.currentTime+delay);o.stop(ctx.currentTime+delay+.2);});setTimeout(()=>ctx.close(),700);}catch{}}
function conflictReason(b,p,i){for(const j of p){if(i===j)continue;if(Math.floor(i/b.n)===Math.floor(j/b.n))return 'この横の列には、もう1匹います。別の行に置いてみよう。';if(i%b.n===j%b.n)return 'この縦の列には、もう1匹います。別の列に置いてみよう。';if(b.regions[i]===b.regions[j])return `おへや ${b.regions[i]+1} は、もう満員。同じ番号のおへやには1匹です。`;if(Math.abs(Math.floor(i/b.n)-Math.floor(j/b.n))<=1&&Math.abs(i%b.n-j%b.n)<=1)return 'となりには近すぎるみたい。ななめも、ひとマスあけよう。';}return '';}
const roomBoard={n:5,regions:[0,0,0,0,0,1,1,2,2,0,1,1,2,2,0,3,3,3,4,4,3,3,4,4,4]},lineBoard={n:5,regions:[0,0,1,1,1,0,0,1,1,1,2,2,3,3,3,2,2,3,4,4,2,2,3,4,4]};
const finalBoard=catalog.stages[0].entries[0].board,finalSolution=solve(finalBoard)[0],finalFixed=finalSolution.slice(0,3);
const lessons=[
 {title:'まずは、おへやに1匹',caption:'枠のマスをタップ',board:roomBoard,fixed:[],target:0,text:'同じ色と番号は、ひとつのおへや。枠のマスに置いてみよう。',after:'ぴったり。このおへやには、1匹だけ住めます。'},
 {title:'ひと部屋に、ひとり',caption:'同じおへやに、もう1匹？',board:roomBoard,fixed:[0],target:14,text:'離れていても同じ番号は同じおへや。枠のマスにもう1匹置けるかな？',after:'ここは同じおへやなので置けません。色だけでなく、番号でも見分けられます。'},
 {title:'よこに並べない',caption:'別のおへやでも、同じ行',board:lineBoard,fixed:[0],target:4,text:'今度は別のおへや。でも、横一列にもう1匹います。枠をタップしてみよう。',after:'同じ横の行には1匹だけ。別のおへやでも横には並べません。'},
 {title:'たてにも並べない',caption:'縦の列も、1匹だけ',board:lineBoard,fixed:[0],target:20,text:'縦の列にも同じルールがあります。枠のマスを試してみよう。',after:'同じ縦の列にも1匹だけ。たて・よこ、両方を見てみよう。'},
 {title:'ななめも、ひとマスあける',caption:'おへやも行も列も違うけれど…',board:lineBoard,fixed:[6],target:12,text:'となり合うのは少し苦手。ななめの枠のマスに置くと、どうなるかな？',after:'ななめにくっつくのもNG。ハムスターのまわりは空けてあげよう。'},
 {title:'さいごは、あなたの番',caption:'あと2匹の居場所を探そう',board:finalBoard,fixed:finalFixed,target:null,text:'3匹はお引っ越し済み。3つのルールを使って、残り2匹を置いてみよう。',after:'できました！これで、おへや探しの準備はばっちり。'}
];
function tutorialMarks(){const l=lessons[tut.index],p=[...l.fixed,...(tut.index===0&&tut.ack?[0]:[]),...(tut.index===5?tut.final:[])];return l.board.regions.map((_,i)=>p.includes(i)?1:0);}
function drawBoard(b,marks,tutorial=false){
 const focus=[...$('board').children].indexOf(document.activeElement);$('board').style.setProperty('--n',b.n);$('board').replaceChildren();
 marks.forEach((v,i)=>{
  const button=document.createElement('button'),region=b.regions[i];button.className='cell';button.dataset.cell=i;button.dataset.region=region;button.style.setProperty('--tile',palette[region]);
  for(const [edge,j] of [['top',i-b.n],['bottom',i+b.n],['left',i%b.n?i-1:-1],['right',i%b.n<b.n-1?i+1:-1]])button.style.setProperty('--edge-'+edge,j<0||j>=marks.length||b.regions[j]!==region?'2px':'0px');
  button.setAttribute('aria-label',`${Math.floor(i/b.n)+1}行 ${i%b.n+1}列 おへや${region+1} ${['空き','ハムスター','除外','仮置き'][v]}`);button.setAttribute('aria-pressed',String(v!==0));
  const label=document.createElement('small');label.textContent=region+1;button.append(label);
  if(v===1||v===3){const piece=document.createElement('span');piece.className='piece';piece.innerHTML=hamster(!tutorial&&won(g));button.append(piece);if(v===3){button.classList.add('tentative');const q=document.createElement('span');q.className='tentative-label';q.textContent='?';button.append(q);}}
  else if(v===2||excluded.has(i)&&!tutorial){const x=document.createElement('span');x.className='mark';x.textContent=v===2?'×':'·';button.append(x);}
  if(hinted.includes(i)&&!tutorial)button.classList.add('hinted');if(premise.includes(i)&&!tutorial)button.classList.add('premise');if(excluded.has(i)&&!tutorial)button.classList.add('excluded');if(errorCell===i)button.classList.add('error');
  if(tutorial){const l=lessons[tut.index];if(!tut.ack&&l.target===i)button.classList.add('target');if((tut.index===2&&Math.floor(i/b.n)===0)||(tut.index===3&&i%b.n===0)||(tut.index===4&&Math.abs(Math.floor(i/b.n)-1)<=1&&Math.abs(i%b.n-1)<=1))button.classList.add('line-guide');}
  button.onclick=()=>tutorial?tutorialTap(i):playTap(i);$('board').append(button);
 });if(focus>=0)$('board').children[focus]?.focus({preventScroll:true});
}
function render(){
 const tutorial=!tut.done;document.querySelector('.app').classList.toggle('tutorial',tutorial);$('modes').hidden=tutorial;$('game-actions').hidden=tutorial;$('tutorial-actions').hidden=!tutorial;$('tutorial-progress').hidden=!tutorial;
 $('collection-count').textContent=collection.completed.length;
 if(tutorial){const l=lessons[tut.index];$('chapter').textContent='さわって覚える · はじめの一歩';$('stage').textContent=l.title;$('board-caption').textContent=l.caption;$('placed').textContent=`${tut.index+1} / ${lessons.length}`;drawBoard(l.board,tutorialMarks(),true);$('tutorial-progress').innerHTML=lessons.map((_,i)=>`<i class="${i<tut.index?'done':i===tut.index?'active':''}"></i>`).join('');$('tutorial-next').disabled=!tut.ack;$('tutorial-next').textContent=tut.index===5?'おへや探しをはじめる':'わかった、次へ';message(tut.ack?l.after:l.text);$('cta').hidden=true;return;}
 if(!g)return;
 $('cta').hidden=!lp||!document.querySelector('.app').classList.contains('lp-offer');
 $('chapter').textContent=lp?'ひとやすみの体験版':g.stage>30?'おだやかな熟練コース':['ひだまりのおへや','こもれびのおへや','星あかりのおへや'][g.stage<=8?0:g.stage<=18?1:2];
 $('stage').textContent=lp?'小さなおへや':`おへや ${String(g.stage).padStart(2,'0')}`;$('board-caption').textContent=`おへや ${g.stage} · 各行・各列・各部屋に1匹`;$('placed').textContent=`${g.marks.filter(x=>x===1).length} / ${g.board.n}`;
 drawBoard(g.board,g.marks);$('board').classList.toggle('sleeping',won(g));$('undo').disabled=busy||!g.history.length;$('hint').disabled=busy||won(g);$('next').disabled=busy;
}
function tutorialTap(i){
 const l=lessons[tut.index];if(tut.ack)return;
 if(tut.index===5){if(l.fixed.includes(i)||tut.final.includes(i)){message('その子は、もう居場所が決まっています。空いているマスを探そう。');return;}const p=[...l.fixed,...tut.final],reason=conflictReason(l.board,p,i);if(reason||!finalSolution.includes(i)){errorCell=i;render();message(reason||'その場所だと、残りの子が入れません。おへやの番号も見てみよう。');return;}tut.final.push(i);sound();if(tut.final.length===2)tut.ack=true;}
 else if(i!==l.target){errorCell=i;render();message('まずは、枠と小さな丸がついたマスを試してみよう。');return;}
 else{tut.ack=true;if(tut.index!==0)errorCell=i;else sound();}
 save();render();
}
function playTap(i){if(busy||won(g))return;const value=Number(document.querySelector('input[name=mode]:checked').value);if(g.marks[i]===value)return;
 if(value===1){const p=g.marks.flatMap((v,j)=>v===1&&i!==j?[j]:[]),reason=conflictReason(g.board,p,i);if(reason){errorCell=i;render();message(reason+' 仮置きなら考えをメモできます。');return;}}
 g=mark(g,i,value);resetHint();save();render();if(value===1)sound();if(won(g))complete();else message(value===3?'仮置きは考えのメモ。確かになったら「置く」で決めよう。':value===2?'ここには置かない、とメモしました。':'いい感じ。次の居場所も探してみよう。');}
async function start(stage){if(busy)return;busy=true;message('次のおへやを準備中…');if(g)render();const seed=crypto.getRandomValues(new Uint32Array(1))[0];
 const result=await new Promise(resolve=>{let finished=false;const finish=x=>{if(finished)return;finished=true;clearTimeout(timer);worker?.terminate();worker=null;resolve(x);};const timer=setTimeout(()=>finish(null),1000);try{worker=new Worker('./worker.js?v=7c127fabbb404fea',{type:'module'});worker.onmessage=e=>finish(e.data.ok?e.data:null);worker.onerror=()=>finish(null);worker.postMessage({seed,stage,catalog,recent});}catch{finish(null);}});
 const chosen=result||fallbackFor(seed,stage,catalog,recent);g=fresh(chosen.board,seed,stage);g.generatorVersion=2;recent.push(signature(g.board));busy=false;winFor='';resetHint();save();render();if(tut.done)message(stage>30?'ここからは熟練コース。同じ難しさの、新しい居場所探し。':'まずは、小さいおへやの候補を見てみよう。');}
function collectionInfo(){const count=collection.completed.length,unlocked=Math.min(3,Math.floor(count/5)),next=['若葉の鉢','こもれびランプ','小さな絵'][unlocked];return {count,unlocked,next,left:5-count%5};}
function complete(){const id=`${g.stage}:${g.seed}`;if(!collection.completed.includes(id)){collection.completed.push(id);save();}if(winFor===id)return;winFor=id;sound(true);render();message('みんなの居場所が決まりました。おへやが完成です！');const c=collectionInfo();$('win-room').innerHTML=roomScene(c.unlocked,true);$('win-title').textContent='みんな、ひとやすみ。';$('win-copy').textContent=`おへや ${g.stage} が完成しました。`;const reward=c.count%5===0&&c.count<=15;$('reward-title').textContent=reward?['若葉の鉢が届きました','ランプが届きました','小さな絵が届きました'][c.unlocked-1]:`できたおへや ${c.count}`;$('reward-copy').textContent=c.next?`あと${c.left}へやで「${c.next}」がおへやに届きます。`:'おへやがにぎやかになりました。次の居場所も探そう。';$('next').textContent=lp?'続けておへやをつくる':g.stage>=30?'熟練コースの次のおへやへ':'次のおへやへ';if(!$('celebration').open)$('celebration').showModal();}
function showCollection(){const c=collectionInfo();$('collection-room').innerHTML=roomScene(c.unlocked,true);$('collection-description').textContent=`完成したおへやは${c.count}こ。${c.next?`あと${c.left}こで${c.next}が届きます。`:'小さな家具がそろいました。'}`;$('collection-items').innerHTML=['若葉の鉢','ランプ','小さな絵'].map((name,i)=>`<div class="collectible ${i<c.unlocked?'unlocked':''}">${icon(i===0?'seed':i===1?'hint':'home')}<strong>${name}</strong><small>${i<c.unlocked?'おへやに飾りました':`${(i+1)*5}へやで届く`}</small></div>`).join('');$('collection-dialog').showModal();}
function beginLp(){if(lp&&tut.done&&lpTimer===null)lpTimer=setTimeout(()=>{$('cta').hidden=false;document.querySelector('.app').classList.add('lp-offer');},30000);}
function finishTutorial(){tut.done=true;save();resetHint();render();beginLp();message('準備できました。自分のペースで最初のおへやをつくろう。');if(g&&won(g)){winFor='';complete();}}
$('tutorial-next').onclick=()=>{if(!tut.ack)return;if(tut.index===5){finishTutorial();return;}tut.index++;tut.ack=false;tut.final=[];errorCell=-1;save();render();};$('skip').onclick=finishTutorial;
$('replay').onclick=()=>{$('help-dialog').close();tut={version:1,index:0,ack:false,final:[],done:false};save();resetHint();render();};
$('undo').onclick=()=>{if(busy)return;g=undo(g);winFor='';resetHint();save();render();message('ひとつ前に戻しました。ゆっくり考えて大丈夫。');};
$('hint').onclick=()=>{const placed=g.marks.flatMap((v,i)=>v===1?[i]:[]);if(!solve(g.board,placed,1).length){message('今の置き方では全員が入れません。「戻す」や「仮置き」で見直してみよう。');return;}const step=analyze(g.board,placed).steps[hintCursor];if(!step){message('いったん戻して、おへやごとの候補を見直してみよう。');return;}premise=step.premise;hinted=step.place!==undefined?[step.place]:step.remove;if(step.place===undefined){step.remove.forEach(i=>excluded.add(i));hintCursor++;}render();message(step.reason+(step.place===undefined?' 点のマスは除外。ヒントでもう一歩。':' 枠のマスに置いてみよう。'));};
$('next').onclick=()=>{if(busy)return;$('celebration').close();if(lp){location.href='./';return;}start(g.stage+1);};$('close-win').onclick=()=>$('celebration').close();$('view-room').onclick=()=>{$('celebration').close();showCollection();};
$('help').onclick=()=>$('help-dialog').showModal();$('learn-tab').onclick=()=>$('help-dialog').showModal();$('collection-tab').onclick=showCollection;$('play-tab').onclick=()=>{if(tut.done&&g&&won(g)){winFor='';complete();}};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
$('sound').checked=read(key+'-sound')===true;$('sound').onchange=()=>{persist(key+'-sound',$('sound').checked);sound();};
document.querySelector('.brand-mark').innerHTML=hamster();$('guide-art').innerHTML=hamster();document.querySelector('.hamster-symbol').innerHTML=hamster();$('seed-icon').innerHTML=icon('seed');$('reward-art').innerHTML=icon('seed');$('help').innerHTML=icon('help');$('close-win').innerHTML=icon('close');document.querySelectorAll('[data-close].icon-button').forEach(b=>b.innerHTML=icon('close'));$('undo').innerHTML=icon('undo')+'戻す';$('hint').innerHTML=icon('hint')+'ヒント';$('play-tab').innerHTML=icon('home')+'あそぶ';$('collection-tab').innerHTML=icon('seed')+'おへや';$('learn-tab').innerHTML=icon('book')+'あそびかた';
try{g=restore(localStorage.getItem(key)||'');const r=read(key+'-recent');if(Array.isArray(r))recent=r.filter(x=>typeof x==='string').slice(-50);}catch{}
if(g){render();if(tut.done)message(won(g)?'完成済みのおへやです。「あそぶ」から次へ進めます。':'おかえりなさい。前回の続きから遊べます。');}else await start(1);
document.addEventListener('visibilitychange',save);
const probe=document.createElement('span');probe.className='font-probe';probe.setAttribute('aria-hidden','true');document.body.append(probe);const typography=new ResizeObserver(()=>document.querySelector('.app').classList.toggle('large-text',probe.getBoundingClientRect().width>19));typography.observe(probe);
if(lp){$('mode-link').href='./';$('mode-link').textContent='通常モードへ';beginLp();}
