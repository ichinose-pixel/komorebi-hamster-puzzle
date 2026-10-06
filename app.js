import {mountCoinReward} from './coin-ui.js?v=be6f9a6a74417ecf';
import {createEndlessQueue} from './endless-queue.js?v=be6f9a6a74417ecf';
import {mountTitle} from './title.js?v=be6f9a6a74417ecf';
import {mountWorld} from './world-ui.js?v=be6f9a6a74417ecf';
import {createWorldStore} from './world-store.js?v=be6f9a6a74417ecf';
import {completeNormal,completeDaily,saveDailyGame,balance,tickResident} from './economy.js?v=be6f9a6a74417ecf';
import {tapController} from './interaction.js?v=be6f9a6a74417ecf';
import {migrateCollection,roomCount,rewardFor,milestones} from './rewards.js?v=be6f9a6a74417ecf';
import {createAudio} from './audio.js?v=be6f9a6a74417ecf';
import {fresh,mark,undo,won,restore,solve} from './core.js?v=be6f9a6a74417ecf';
import {analyze} from './deduction.js?v=be6f9a6a74417ecf';
import {fallbackFor,signature} from './progression.js?v=be6f9a6a74417ecf';
import {hamster,roomScene,icon,titleScene,capsule,furniture,furnitureArt,episodes,episodeScene,snackScene,celebrateHam,showCast} from './art.js?v=be6f9a6a74417ecf';
const $=id=>document.getElementById(id),lp=new URLSearchParams(location.search).get('mode')==='lp';
const key=lp?'komorebi-lp-v1':'komorebi-v1',tutorialKey='komorebi-tutorial-v3',collectionKey=key+'-collection-v3';
const audio=createAudio(key);
const coinReward=mountCoinReward({dialog:$('celebration'),audio});let normalReceiptPending=false;
function syncAudio(){for(const name of ['bgm','se']){$(name+'-volume').value=Math.round(audio.settings[name]*100);$(name+'-value').textContent=Math.round(audio.settings[name]*100)+'%';}const on=audio.settings.bgm>0||audio.settings.se>0;$('sound').checked=on;$('title-sound').checked=on;}
function enableAudio(feedback=false){return audio.activate({feedback});}
for(const name of ['bgm','se'])$(name+'-volume').oninput=()=>{audio.set(name,Number($(name+'-volume').value)/100);syncAudio();if(audio.settings.bgm>0||audio.settings.se>0)enableAudio(name==='se'&&audio.settings.se>0);};
function masterSound(on){audio.set('bgm',on?.22:0);audio.set('se',on?.45:0);syncAudio();if(on)enableAudio(true);}
$('sound').onchange=()=>masterSound($('sound').checked);$('title-sound').onchange=()=>masterSound($('title-sound').checked);$('audio-resume').onclick=()=>enableAudio(true);$('title-audio-resume').onclick=()=>enableAudio(true);
audio.subscribe(status=>{const retry=['blocked','paused'].includes(status),copy={off:'音はオフです',waiting:'最初の操作で音が始まります',starting:'音を開始しています…',playing:'音を再生中',paused:'音が中断されました',blocked:'音を開始できませんでした。再開を押してください',unsupported:'この環境では音声を再生できません'}[status];$('audio-status').textContent=copy;$('title-audio-status').textContent=copy;$('audio-resume').hidden=!retry;$('title-audio-resume').hidden=!retry;});syncAudio();

const palette=['#F4D58F','#A5D9BE','#C9B9E3','#ADD8E5','#F3B7AA','#D4DFA2','#B5C5ED','#EBD0B2'];
const catalog=await fetch('./catalog.json?v=be6f9a6a74417ecf').then(r=>{if(!r.ok)throw Error('catalog');return r.json();});
let titleUI=null;
let activeDaily=null;
let rewardTimer=null,rewardId='',inGame=lp,input=null,hintPhase=0,hintStep=null,hintContext=[];
let g,busy=false,recent=[],hinted=[],premise=[],excluded=new Set(),hintCursor=0,errorCell=-1,winFor='',storageOk=true,worker=null,lpTimer=null;
let tut={version:1,index:0,ack:false,final:[],done:false},collection={version:1,completed:[]};
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
const oldTut=read(tutorialKey);if(oldTut?.version===1&&Number.isInteger(oldTut.index)&&oldTut.index>=0&&oldTut.index<=5&&Array.isArray(oldTut.final)&&oldTut.final.every(x=>Number.isInteger(x)&&x>=0&&x<25))tut={...oldTut,done:!!oldTut.done,ack:!!oldTut.ack};
const oldCollection=read(collectionKey);collection=migrateCollection(oldCollection);
const worldStore=createWorldStore(globalThis.hamudokuStorage??localStorage);
let worldReady=false;if(!lp)try{await worldStore.transact(w=>tickResident(w,Date.now()));worldReady=true;}catch{storageOk=false;}
const endless=createEndlessQueue({catalog,storage:localStorage,key,onError:()=>{storageOk=false;}});
function persist(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{storageOk=false;}}
function save(){if(g&&activeDaily&&worldReady){const id=activeDaily.id,snapshot=JSON.parse(JSON.stringify(g));void worldStore.transact(w=>saveDailyGame(w,id,snapshot)).catch(()=>{storageOk=false;});}else if(g)persist(key,g);persist(key+'-recent',recent.slice(-50));persist(tutorialKey,tut);persist(collectionKey,collection);}
function message(text){$('status').textContent=text+(!storageOk?' この環境では保存できません。':'');}
function resetHint(){hinted=[];premise=[];excluded.clear();hintCursor=0;hintPhase=0;hintStep=null;hintContext=[];errorCell=-1;$('hint-panel').hidden=true;}
function sound(kind=false){audio.effect(kind===true?'open':typeof kind==='string'?kind:'place');}
function conflictReason(b,p,i){for(const j of p){if(i===j)continue;if(Math.floor(i/b.n)===Math.floor(j/b.n))return 'この横の列には、もう1匹います。別の行に置いてみよう。';if(i%b.n===j%b.n)return 'この縦の列には、もう1匹います。別の列に置いてみよう。';if(b.regions[i]===b.regions[j])return `おへや ${b.regions[i]+1} は、もう満員。同じ番号のおへやには1匹です。`;if(Math.abs(Math.floor(i/b.n)-Math.floor(j/b.n))<=1&&Math.abs(i%b.n-j%b.n)<=1)return 'となりには近すぎるみたい。ななめも、ひとマスあけよう。';}return '';}
const roomBoard={n:5,regions:[0,0,0,0,0,1,1,2,2,0,1,1,2,2,0,3,3,3,4,4,3,3,4,4,4]},lineBoard={n:5,regions:[0,0,1,1,1,0,0,1,1,1,2,2,3,3,3,2,2,3,4,4,2,2,3,4,4]};
const finalBoard=catalog.stages[0].entries[0].board,finalSolution=solve(finalBoard)[0],finalFixed=finalSolution.slice(0,3);
const lessons=[
 {title:'まずは、おへやに1匹',caption:'枠のマスを2回タップ',board:roomBoard,fixed:[],target:0,text:'同じ色と番号は、ひとつのおへや。枠のマスを2回タップして置こう。',after:'ぴったり。本番では、置いたハムをもう一度タップすると戻せます。'},
 {title:'ひと部屋に、ひとり',caption:'同じおへやに、もう1匹？',board:roomBoard,fixed:[0],target:14,text:'離れていても同じ番号は同じおへや。枠のマスにもう1匹置けるかな？',after:'ここは同じおへやなので置けません。色だけでなく、番号でも見分けられます。'},
 {title:'よこに並べない',caption:'別のおへやでも、同じ行',board:lineBoard,fixed:[0],target:4,text:'今度は別のおへや。でも、横一列にもう1匹います。枠を2回タップしてみよう。',after:'同じ横の行には1匹だけ。別のおへやでも横には並べません。'},
 {title:'たてにも並べない',caption:'縦の列も、1匹だけ',board:lineBoard,fixed:[0],target:20,text:'縦の列にも同じルールがあります。枠のマスを試してみよう。',after:'同じ縦の列にも1匹だけ。たて・よこ、両方を見てみよう。'},
 {title:'ななめも、ひとマスあける',caption:'おへやも行も列も違うけれど…',board:lineBoard,fixed:[6],target:12,text:'となり合うのは少し苦手。ななめの枠のマスに置くと、どうなるかな？',after:'ななめにくっつくのもNG。ハムスターのまわりは空けてあげよう。'},
 {title:'さいごは、あなたの番',caption:'あと2匹の居場所を探そう',board:finalBoard,fixed:finalFixed,target:null,text:'3匹は固定です。残り2匹は2回タップで配置。1回で×、なぞってまとめて除外できます。',after:'できました！これで、おへや探しの準備はばっちり。'}
];
tut.excluded=Array.isArray(tut.excluded)?tut.excluded.filter(i=>Number.isInteger(i)&&i>=0&&i<25):[];
function tutorialMarks(){const l=lessons[tut.index],p=[...l.fixed,...(tut.index===0&&tut.ack?[0]:[]),...(tut.index===5?tut.final:[])];return l.board.regions.map((_,i)=>p.includes(i)?1:tut.index===5&&tut.excluded?.includes(i)?2:0);}
function drawBoard(b,marks,tutorial=false){
 const previous=[...$('board').children].map(el=>Number(el.dataset.mark));const focus=[...$('board').children].indexOf(document.activeElement);$('board').style.setProperty('--n',b.n);$('board').replaceChildren();
 marks.forEach((v,i)=>{
  const button=document.createElement('button'),region=b.regions[i];button.className='cell';button.dataset.cell=i;button.dataset.mark=v;button.dataset.region=region;button.style.setProperty('--tile',palette[region]);
  for(const [edge,j] of [['top',i-b.n],['bottom',i+b.n],['left',i%b.n?i-1:-1],['right',i%b.n<b.n-1?i+1:-1]])button.style.setProperty('--edge-'+edge,j<0||j>=marks.length||b.regions[j]!==region?'2px':'0px');
  button.setAttribute('aria-label',`${Math.floor(i/b.n)+1}行 ${i%b.n+1}列 おへや${region+1} ${['空き','ハムスター','除外','仮置き'][v]}`);button.setAttribute('aria-pressed',String(v!==0));
  const label=document.createElement('small');label.textContent=region+1;button.append(label);
  if(v===1||v===3){const piece=document.createElement('span');piece.className='piece';if(previous[i]===v)piece.style.animation='none';piece.innerHTML=hamster(!tutorial&&won(g));button.append(piece);if(v===3){button.classList.add('tentative');const q=document.createElement('span');q.className='tentative-label';q.textContent='?';button.append(q);}}
  else if(v===2||excluded.has(i)&&!tutorial){const x=document.createElement('span');x.className='mark';x.textContent=v===2?'×':'·';button.append(x);}
  if(hintContext.includes(i)&&!tutorial)button.classList.add('hint-context');if(hinted.includes(i)&&!tutorial)button.classList.add('hinted');if(premise.includes(i)&&!tutorial)button.classList.add('premise');if(excluded.has(i)&&!tutorial)button.classList.add('excluded');if(errorCell===i)button.classList.add('error');
  if(tutorial){const l=lessons[tut.index];if(!tut.ack&&l.target===i)button.classList.add('target');if((tut.index===2&&Math.floor(i/b.n)===0)||(tut.index===3&&i%b.n===0)||(tut.index===4&&Math.abs(Math.floor(i/b.n)-1)<=1&&Math.abs(i%b.n-1)<=1))button.classList.add('line-guide');}
  button.onclick=e=>{if(e.detail===0){input?.reset();if(tutorial)tutorialTap(i);else playTap(i,'keyboard');}};$('board').append(button);
 });if(focus>=0)$('board').children[focus]?.focus({preventScroll:true});
}
function render(){
 document.querySelector('.app').classList.toggle('hinting',!$('hint-panel').hidden);
 audio.setScene(!inGame||!tut.done||!g||!won(g));
 const tutorial=!tut.done;document.querySelector('.app').classList.toggle('tutorial',tutorial);$('advanced-input').hidden=tutorial;$('game-actions').hidden=tutorial;$('tutorial-actions').hidden=!tutorial;$('tutorial-progress').hidden=!tutorial;
 $('collection-count').textContent=collection.completed.length;$('swipe-demo').hidden=!tutorial;$('gesture-guide').hidden=tutorial;
 if(tutorial){const l=lessons[tut.index];$('chapter').textContent='さわって覚える · はじめの一歩';$('stage').textContent=l.title;$('board-caption').textContent=l.caption;$('placed').textContent=`${tut.index+1} / ${lessons.length}`;drawBoard(l.board,tutorialMarks(),true);$('tutorial-progress').innerHTML=lessons.map((_,i)=>`<i class="${i<tut.index?'done':i===tut.index?'active':''}"></i>`).join('');$('tutorial-next').disabled=!tut.ack;$('tutorial-next').textContent=tut.index===5?'おへや探しをはじめる':'わかった、次へ';message(tut.ack?l.after:l.text);$('cta').hidden=true;return;}
 if(!g)return;
 $('cta').hidden=!lp||!document.querySelector('.app').classList.contains('lp-offer');
 $('chapter').textContent=lp?'ひとやすみの体験版':g.stage>60?'ハムの気ままな延長戦':['ぼくの特等席','おやつは別腹','拍手の練習','おかわりの作戦','王冠の置き場所','ぼくの凱旋'][Math.min(5,Math.floor((g.stage-1)/10))];
 $('stage').textContent=lp?'小さなおへや':`おへや ${String(g.stage).padStart(2,'0')}`;$('board-caption').textContent=`おへや ${g.stage} · 各行・各列・各部屋に1匹`;$('placed').textContent=`${g.marks.filter(x=>x===1).length} / ${g.board.n}`;
 if(activeDaily){$('chapter').textContent='日替わり · '+activeDaily.date;$('stage').textContent={easy:'やさしい',standard:'ふつう',hard:'むずかしい'}[activeDaily.level]+' · 第'+(activeDaily.slot+1)+'問';$('board-caption').textContent='各行・各列・各部屋に1匹';}
 drawBoard(g.board,g.marks);$('board').classList.toggle('sleeping',won(g));$('undo').disabled=busy||!g.history.length;$('hint').disabled=busy||won(g);$('next').disabled=busy;
}
function tutorialTap(i,kind='double'){
 const l=lessons[tut.index];if(tut.ack)return;
 if(tut.index===5){if(tut.excluded?.includes(i)){tut.excluded=tut.excluded.filter(x=>x!==i);save();render();message('除外を消しました。2回タップでハムを置けます。');return;}if(tut.final.includes(i)){tut.final=tut.final.filter(x=>x!==i);save();render();message('置いたハムを戻しました。もう一度置いてみよう。');return;}if(l.fixed.includes(i)){message('その子は、もう居場所が決まっています。空いているマスを探そう。');return;}if(kind==='single'){tut.excluded??=[];tut.excluded.push(i);save();render();message('×を付けました。タップで消すか、ここからなぞって解除。');return;}const p=[...l.fixed,...tut.final],reason=conflictReason(l.board,p,i);if(reason||!finalSolution.includes(i)){errorCell=i;render();message(reason||'その場所だと、残りの子が入れません。おへやの番号も見てみよう。');return;}tut.final.push(i);sound();if(tut.final.length===2)tut.ack=true;}
 else if(i!==l.target){errorCell=i;render();message('まずは、枠と小さな丸がついたマスを試してみよう。');return;}
 else{tut.ack=true;if(tut.index!==0)errorCell=i;else sound();}
 save();render();
}
function playTap(i,action='double'){
 if(busy||!g||won(g))return;const current=g.marks[i],mode=Number(document.querySelector('input[name=mode]:checked').value);
 const value=current!==0?0:action==='single'?2:mode===3?3:1;
 if(value===1){const p=g.marks.flatMap((v,j)=>v===1?[j]:[]),reason=conflictReason(g.board,p,i);if(reason){errorCell=i;render();message(reason);return;}}
 g=mark(g,i,value);resetHint();save();render();sound(value===1?'place':value===0?'remove':'mark');if(won(g))complete();else message(value===0?'マークを消しました。空きマスは2回タップでハム、1回で除外。':value===3?'仮置きメモです。タップで消してから、通常操作で置き直せます。':value===2?'ここは除外。もう1回タップ、またはここからなぞると解除。':'いい居場所だね。ぼくの席は広めにね。');
}
async function start(stage){if(busy)return;input?.reset();busy=true;message('次のおへやを準備中…');if(g)render();if(stage>60){try{const chosen=await endless.take(stage);g=fresh(chosen.board,chosen.seed,stage);g.hintsUsed=0;g.generatorVersion=3;recent.push(signature(g.board));winFor='';resetHint();save();message('新しいおへや。ひとつずつ、手がかりをつなごう。');endless.prefetch(stage+1);}catch{message('新しい問題を準備できませんでした。少し待って、もう一度お試しください。');$('generation-retry').hidden=false;$('generation-retry').onclick=()=>{$('generation-retry').hidden=true;void start(stage);};}finally{busy=false;render();updateTitle();}return;}const seed=crypto.getRandomValues(new Uint32Array(1))[0];
 const result=await new Promise(resolve=>{let finished=false;const finish=x=>{if(finished)return;finished=true;clearTimeout(timer);worker?.terminate();worker=null;resolve(x);};const timer=setTimeout(()=>finish(null),1000);try{worker=new Worker('./worker.js?v=be6f9a6a74417ecf',{type:'module'});worker.onmessage=e=>finish(e.data.ok?e.data:null);worker.onerror=()=>finish(null);worker.postMessage({seed,stage,catalog,recent});}catch{finish(null);}});
 const chosen=result||fallbackFor(seed,stage,catalog,recent);g=fresh(chosen.board,seed,stage);g.hintsUsed=0;g.generatorVersion=2;recent.push(signature(g.board));if(stage>=60)endless.prefetch(stage+1);busy=false;winFor='';resetHint();save();render();if(tut.done)message(stage>60?'ここからは延長戦。難しさの上限は同じ、新しい盤面です。':'まずは、小さいおへやの候補を見てみよう。');}
function collectionInfo(){return {count:collection.completed.length,unlocked:roomCount(collection)};}
function nextLabel(){if(activeDaily)return '日替わりへ';return lp?'本編でつづける':`ステージ${g.stage+1}へ`;}
let showTimers=[];
function clearShow(){coinReward.stop();showTimers.forEach(clearTimeout);showTimers=[];clearTimeout(rewardTimer);rewardTimer=null;audio.cancelCelebration();document.querySelector('.app').classList.remove('clear-wave');}
function setShowPhase(phase){$('celebration').dataset.phase=phase;if(['burst','pose','photo'].includes(phase)){$('reward-stage').classList.add('revealed');$('celebration').classList.add('fanfare');}if(phase==='photo'){$('reward-stage').classList.add('installed');$('skip-reward').hidden=true;collection.revealed=rewardId;save();}}
function installReward(){setShowPhase('photo');}
function revealReward(skip=false){clearShow();setShowPhase('photo');if($('celebration').open)$('next').focus({preventScroll:true});}
function playShow(special){
 clearShow();document.querySelector('.app').classList.add('clear-wave');setShowPhase('preview');audio.effect('announce');
 const phases=[[120,'rise','rise1'],[350,'climb1','rise1'],[560,'climb2','rise2'],[780,'climb3','quiet'],[960,'hold','quiet'],[1150,'burst','pose'],[1850,'pose','mark'],[2700,'photo','mark']];
 for(const [ms,phase,sound] of phases)showTimers.push(setTimeout(()=>{setShowPhase(phase);if(sound==='quiet')audio.cancelCelebration();else if(sound==='crown')showTimers.push(setTimeout(()=>audio.effect('open'),390));else audio.effect(sound);},ms));
}

async function advanceStage(){if(normalReceiptPending)return;if(!lp&&!activeDaily&&g&&won(g)){let received=false;try{received=worldReady&&Object.hasOwn(worldStore.read()?.normalClaims||{},String(g.stage)+':'+g.seed);}catch{}if(!received){inGame=true;$('title-screen').hidden=true;document.querySelector('.app').hidden=false;winFor='';await complete();return;}}if(activeDaily){showTitle();void worldUI.open('daily');return;}if(busy)return;input?.reset();clearShow();document.querySelectorAll('dialog[open]').forEach(d=>d.close());if(g&&won(g)){if(lp){location.href='./';return;}inGame=true;$('title-screen').hidden=true;document.querySelector('.app').hidden=false;await start(g.stage+1);}else enterGame();}
async function complete(){
 if(activeDaily){if(winFor===activeDaily.id)return;winFor=activeDaily.id;const id=activeDaily.id,snapshot=JSON.parse(JSON.stringify(g));input?.reset();let earned=0;void worldStore.transact(w=>{const next=completeDaily(w,id,snapshot);earned=balance(next)-balance(w);return next;}).then(async()=>{showTitle();await worldUI.dailyDone(earned?'クリア！ '+earned+'コインを受け取りました。':'もう一度クリア！ この問題のコインは受け取り済みです。');}).catch(()=>{winFor='';message('保存できませんでした。日替わりを開き直して、もう一度受け取ってください。');});return;}

 const id=String(g.stage)+':'+g.seed;const before=roomCount(collection);if(!collection.completed.includes(id)){collection.completed.push(id);save();}if(winFor===id)return;winFor=id;rewardId=id;input?.reset();render();
 const receipt={before:0,after:0,amount:0,saved:worldReady||lp};if(worldReady){normalReceiptPending=true;try{const completedGame=JSON.parse(JSON.stringify(g)),unlocked=roomCount(collection);await worldStore.transact(w=>{receipt.before=balance(w);const next=completeNormal(w,completedGame,unlocked);receipt.after=balance(next);receipt.amount=receipt.after-receipt.before;return next;});}catch{receipt.saved=false;receipt.amount=0;receipt.after=receipt.before;storageOk=false;}finally{normalReceiptPending=false;}}if(!inGame||activeDaily||String(g.stage)+':'+g.seed!==id)return;
 const count=collection.completed.indexOf(id)+1,look=rewardFor(count),after=roomCount(collection),isNew=milestones.includes(count)&&milestones.indexOf(count)>=(collection.legacyFurniture||0),item=furniture[Math.max(0,after-1)];
 const special=g.hintsUsed===0||g.stage===60;$('celebration').classList.toggle('special',special);$('celebration').classList.toggle('milestone',isNew);$('win-title').textContent=g.stage===60?'60ステージ突破！':g.hintsUsed===0?'ノーヒント、達成！':'おみごと！';$('win-copy').textContent='ステージ '+g.stage+' クリア'+(g.hintsUsed===0?' · ノーヒントで解けた！':' · おみごと！');
 $('reward-title').textContent=isNew?item.name:look.title;$('reward-copy').textContent=special?'「かしこいのはきみ。主役は、ぼく。」':'「'+look.quote+'」';$('gift-label').textContent=isNew?'家具を獲得 · '+item.name:special?'ひらめきに、王冠を。':'ハムも拍手しています';
 $('reward-stage').dataset.variant=look.variant;$('reward-stage').classList.toggle('milestone',isNew);
 $('reward-object').innerHTML=showCast(special);$('capsule-art').innerHTML=capsule();$('reward-ham').innerHTML=hamster(true);$('reward-home').innerHTML=roomScene(after,true);
 $('next').textContent=nextLabel();$('reward-stage').classList.remove('revealed','installed');$('reward-details').hidden=false;$('skip-reward').hidden=false;$('celebration').classList.remove('fanfare');
 if(!$('celebration').open)$('celebration').showModal();clearTimeout(rewardTimer);message('クリア！ ハムが拍手を待っています。');
 coinReward.prepare(receipt,()=>{winFor='';void complete();});if(collection.revealed===id||matchMedia('(prefers-reduced-motion: reduce)').matches)revealReward(true);else playShow(special);coinReward.start();
}
function showCollection(){if(!lp){input?.reset();void worldUI.open('home');return;}const c=collectionInfo();$('collection-room').innerHTML=roomScene(c.unlocked,true);$('collection-description').textContent=`家具 ${c.unlocked} / 12 ・ クリア ${c.count} 回${c.unlocked===12?'。このお家の家具は完成！ パズルはこの先も続きます。':''}`;$('collection-items').innerHTML=furniture.map((item,i)=>`<div class="collectible ${i<c.unlocked?'unlocked':''}">${i<c.unlocked?furnitureArt(i):'<span class="locked-gift">?</span>'}<strong>${i<c.unlocked?item.name:'おたのしみ'}</strong><small>${i<c.unlocked?item.note:milestones[i]+'回クリアで届く'}</small></div>`).join('');const index=Math.max(0,c.count-1);$('home-story').hidden=true;$('home-story-title').textContent=episodes[index%4].title;$('home-story-art').innerHTML=episodeScene(index);$('home-story-art').setAttribute('aria-label',episodes[index%4].description);$('house-next').textContent=g&&won(g)?nextLabel():'パズルへ';$('collection-dialog').showModal();}
function showTitle(){input?.reset();save();if(activeDaily){activeDaily=null;g=restore(localStorage.getItem(key)||'');}document.querySelectorAll('dialog[open]').forEach(d=>d.close());inGame=false;audio.setScene(true);$('title-screen').hidden=false;document.querySelector('.app').hidden=true;clearTimeout(lpTimer);lpTimer=null;updateTitle();$('title-play').focus();}
function hasProgress(){return !!g&&(g.stage>1||g.marks.some(Boolean)||g.history.length>0||tut.done||tut.index>0||tut.ack);}
function updateTitle(){const progress=hasProgress();$('title-play').disabled=!g||busy;const stage=g?(won(g)?g.stage+1:g.stage):1;const state=g&&!won(g)&&g.marks.some(Boolean)?'続きから遊ぶ':!tut.done?'はじめてのパズル':'次のおへやを探そう';$('title-play').innerHTML='<strong>ステージ '+stage+'</strong><span>'+state+' <b>→</b></span>';$('title-restart').hidden=!progress;$('title-restart').disabled=busy;titleUI?.refresh();}
function enterGame(){if(!g||busy)return;inGame=true;$('title-screen').hidden=true;document.querySelector('.app').hidden=false;render();beginLp();if(tut.done&&won(g)){winFor='';complete();}else $('help').focus({preventScroll:true});}
function beginLp(){if(lp&&inGame&&tut.done&&lpTimer===null)lpTimer=setTimeout(()=>{$('cta').hidden=false;document.querySelector('.app').classList.add('lp-offer');},30000);}
function finishTutorial(){input?.reset();tut.done=true;save();resetHint();render();beginLp();message('準備できました。自分のペースで最初のおへやをつくろう。');if(g&&won(g)){winFor='';complete();}}
$('tutorial-next').onclick=()=>{input?.reset();if(!tut.ack)return;if(tut.index===5){finishTutorial();return;}tut.index++;tut.ack=false;tut.final=[];tut.excluded=[];errorCell=-1;save();render();};$('skip').onclick=finishTutorial;
$('replay').onclick=()=>{input?.reset();$('help-dialog').close();inGame=true;$('title-screen').hidden=true;document.querySelector('.app').hidden=false;tut={version:1,index:0,ack:false,final:[],done:false};save();resetHint();render();};
$('undo').onclick=()=>{input?.reset();if(busy)return;g=undo(g);winFor='';resetHint();save();render();message('ひとつ前に戻しました。ゆっくり考えて大丈夫。');};
function hintRender(){
 if(!hintStep)return;$('hint-panel').hidden=false;const cells=hintStep.place!==undefined?[hintStep.place]:hintStep.remove;premise=hintStep.premise;hinted=cells;
 const hasMark=hintStep.place!==undefined&&g.marks[hintStep.place]!==0;
 $('hint-heading').textContent=hintStep.fix?'ここを見直そう':hintStep.place!==undefined?'ここに置けます':'ここを除外できます';
 const action=hintStep.fix?'枠のマークを1回タップで消して考え直そう。':hintStep.place!==undefined?(hasMark?'枠のマークを1回で消し、2回タップでハムを置こう。':'枠の空きマスを2回タップでハムを置こう。'):'枠のマスには置けません。印を付けるかは自分で選べます。';
 $('hint-text').textContent=hintStep.reason+' '+action;$('hint-continue').textContent=hintStep.place===undefined&&!hintStep.fix?'除外を付ける':'閉じる';render();
}
$('hint').onclick=()=>{input?.reset();if(busy||!g||won(g))return;
 const placed=g.marks.flatMap((v,i)=>v===1?[i]:[]),solution=solve(g.board)[0],badPlaced=placed.filter(i=>!solution.includes(i)),badExcluded=g.marks.flatMap((v,i)=>v===2&&solution.includes(i)?[i]:[]);
 if(Number.isSafeInteger(g.hintsUsed))g.hintsUsed++;save();hintPhase=0;
 if(badPlaced.length||badExcluded.length){const wrong=badPlaced.length?badPlaced:badExcluded;hintStep={fix:true,premise:wrong,remove:wrong,reason:badPlaced.length?'今の配置では全員が入れません。枠のハムを一度戻すと考え直せます。':'必要な居場所を除外しています。枠の×を消すと候補が戻ります。'};hintContext=wrong;}
 else{const blocked=g.marks.flatMap((v,i)=>v===2?[i]:[]);hintStep=analyze(g.board,placed,blocked).steps[0];if(!hintStep){message('候補が見つかりません。マークを戻して確認しよう。');return;}hintContext=hintStep.context||hintStep.premise;}
 hintRender();
};
$('hint-continue').onclick=()=>{if(!hintStep)return;if(hintStep.place===undefined&&!hintStep.fix){const marks=[...g.marks];for(const i of hintStep.remove)if(marks[i]===0||marks[i]===3)marks[i]=2;g={...g,marks,history:[...g.history.slice(-99),g.marks]};save();}resetHint();render();};
$('hint-close').onclick=()=>{resetHint();render();};
$('next').onclick=advanceStage;$('house-next').onclick=advanceStage;$('close-win').onclick=()=>{$('celebration').close();};$('celebration').addEventListener('close',clearShow);$('skip-reward').onclick=()=>{audio.cancelCelebration();revealReward(true);};$('view-room').onclick=()=>{$('celebration').close();showCollection();};
$('help').onclick=()=>{input?.reset();$('help-dialog').showModal();};$('learn-tab').onclick=()=>$('help-dialog').showModal();$('collection-tab').onclick=showCollection;$('play-tab').onclick=()=>{if(tut.done&&g&&won(g)){winFor='';complete();}};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());

document.querySelector('.brand-mark').innerHTML=hamster();$('guide-art').innerHTML=hamster();document.querySelector('.hamster-symbol').innerHTML=hamster();$('seed-icon').innerHTML=icon('seed');$('reward-art').innerHTML=icon('seed');$('help').innerHTML=icon('help');$('close-win').innerHTML=icon('close');document.querySelectorAll('[data-close].icon-button').forEach(b=>b.innerHTML=icon('close'));$('undo').innerHTML=icon('undo')+'戻す';$('hint').innerHTML=icon('hint')+'ヒント';$('play-tab').innerHTML=icon('home')+'あそぶ';$('collection-tab').innerHTML=icon('seed')+'おへや';$('learn-tab').innerHTML=icon('book')+'あそびかた';
try{g=restore(localStorage.getItem(key)||'');const r=read(key+'-recent');if(Array.isArray(r))recent=r.filter(x=>typeof x==='string').slice(-50);}catch{}
if(g){render();if(tut.done)message(won(g)?'完成済みのおへやです。「あそぶ」から次へ進めます。':'おかえりなさい。前回の続きから遊べます。');}else await start(1);
document.addEventListener('visibilitychange',save);
const probe=document.createElement('span');probe.className='font-probe';probe.setAttribute('aria-hidden','true');document.body.append(probe);const typography=new ResizeObserver(()=>document.querySelector('.app').classList.toggle('large-text',probe.getBoundingClientRect().width>19));typography.observe(probe);
if(lp){$('mode-link').href='./';$('mode-link').textContent='通常モードへ';beginLp();}

const worldUI=mountWorld({store:worldStore,catalog,onDaily:async(p,replay)=>{if(!tut.done){enterGame();message('まずは遊び方を覚えよう。日替わりはあとで選べます。');return;}save();activeDaily={id:p.id,date:p.date,level:p.level,slot:p.slot};g=replay?fresh(p.game.board,p.seed,p.game.stage):JSON.parse(JSON.stringify(p.game));g.hintsUsed??=0;winFor='';resetHint();enterGame();},onClose:()=>titleUI?.refresh()});
titleUI=mountTitle({store:worldStore,ready:()=>worldReady,onDaily:()=>void worldUI.open('daily'),onHome:showCollection});if(lp)$('title-cards').hidden=true;
const retryButton=document.createElement('button');retryButton.id='generation-retry';retryButton.className='secondary wide';retryButton.textContent='新しい問題をもう一度準備する';retryButton.hidden=true;$('status').parentElement.after(retryButton);if(g){try{endless.rememberCurrent(g,recent);}catch{storageOk=false;}if(g.stage>=60)endless.prefetch(g.stage+1);}
$('title-art').innerHTML=titleScene();$('title-play').onclick=()=>g&&won(g)&&tut.done?void advanceStage():enterGame();$('title-home').onclick=showTitle;$('title-help').onclick=()=>$('help-dialog').showModal();updateTitle();if(lp){$('title-screen').hidden=true;document.querySelector('.app').hidden=false;}

let storyBeat=0;
function renderStory(){ $('story-skip').hidden=storyBeat===2; $('story-stage').innerHTML=snackScene(storyBeat,matchMedia('(prefers-reduced-motion: reduce)').matches);$('story-stage').setAttribute('aria-label',['主人公がおやつの籠を運び、白いハムスターが少しためらいながら待っている','主人公が小さなお皿を差し出し、友だちが手を伸ばす','友だちは喜んで食べる。主人公は自分の大きなお皿へちらりと目を向ける'][storyBeat]);$('story-progress').textContent=(storyBeat+1)+' / 3';$('story-next').textContent=storyBeat===2?(g&&won(g)?nextLabel():'パズルへ'):'つづき';$('story-skip').textContent=g&&won(g)?'お話をスキップして'+nextLabel():'お話を閉じる';$('story-back').disabled=storyBeat===0;}
function showStory(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());storyBeat=0;renderStory();$('story-dialog').showModal();}
$('open-story').onclick=showStory;$('story-next').onclick=()=>{if(storyBeat===2){advanceStage();}else{storyBeat++;renderStory();}};$('story-back').onclick=()=>{if(storyBeat>0){storyBeat--;renderStory();}};

$('story-skip').onclick=()=>{if(g&&won(g))advanceStage();else{$('story-dialog').close();showCollection();}};
$('title-restart').onclick=()=>{if(!busy)$('restart-dialog').showModal();};$('restart-cancel').onclick=()=>$('restart-dialog').close();
$('restart-confirm').onclick=async()=>{if(busy)return;activeDaily=null;$('restart-dialog').close();document.querySelectorAll('dialog[open]').forEach(d=>d.close());tut={version:1,index:0,ack:false,final:[],done:false};recent=[];g=null;winFor='';document.querySelector('input[name=mode][value="1"]').checked=true;inGame=true;$('title-screen').hidden=true;document.querySelector('.app').hidden=false;await start(1);updateTitle();};

let gesture=null,boardClickPending=false;
// A board pointerup may open a dialog. Consume its following compatibility click
// so it cannot hit a newly displayed Skip/Next button at the same coordinates.
document.addEventListener('pointerdown',()=>{boardClickPending=false;},true);
document.addEventListener('click',e=>{if(boardClickPending&&e.detail!==0){boardClickPending=false;e.preventDefault();e.stopImmediatePropagation();}},true);
const boardElement=$('board');
function cancelGesture(){if(!gesture)return;input?.reset();gesture=null;render();}
boardElement.addEventListener('pointerdown',e=>{if(busy||!g||(!tut.done&&tut.ack)||(tut.done&&won(g))||!e.isPrimary||e.button!==0)return;const cell=e.target.closest('.cell');if(!cell)return;const i=Number(cell.dataset.cell);const initial=tut.done?g.marks:tutorialMarks();gesture={base:initial,tutorial:!tut.done,id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,start:i,drag:false,marks:[...initial],seen:new Set(),value:initial[i]===2?0:2};boardElement.setPointerCapture(e.pointerId);});
function swipeCell(x,y){const el=document.elementFromPoint(x,y)?.closest('.cell');if(!el||el.parentElement!==boardElement)return;const i=Number(el.dataset.cell);if(gesture.seen.has(i))return;gesture.seen.add(i);if(gesture.base[i]!==0&&gesture.base[i]!==2)return;gesture.marks[i]=gesture.value;}
boardElement.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;if(!gesture.drag&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<9)return;if(!gesture.drag)input.reset();gesture.drag=true;if(gesture.tutorial&&tut.index!==5)return;const dx=e.clientX-gesture.lastX,dy=e.clientY-gesture.lastY,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/7));for(let k=0;k<=steps;k++)swipeCell(gesture.lastX+dx*k/steps,gesture.lastY+dy*k/steps);gesture.lastX=e.clientX;gesture.lastY=e.clientY;drawBoard(gesture.tutorial?lessons[tut.index].board:g.board,gesture.marks,gesture.tutorial);});
boardElement.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;boardClickPending=true;const done=gesture;gesture=null;if(boardElement.hasPointerCapture(e.pointerId))boardElement.releasePointerCapture(e.pointerId);if(!done.drag){input.tap(done.start);return;}if(done.tutorial){if(tut.index===5){tut.excluded=done.marks.flatMap((v,i)=>v===2?[i]:[]);save();}render();return;}if(done.marks.some((v,i)=>v!==g.marks[i])){g={...g,marks:done.marks,history:[...g.history.slice(-99),g.marks]};resetHint();save();}render();message(done.value===2?'なぞったマスを除外しました。戻すで、ひとなぞり分を取り消せます。':'なぞった除外マークを解除しました。');});
boardElement.addEventListener('pointercancel',cancelGesture);boardElement.addEventListener('lostpointercapture',cancelGesture);document.addEventListener('visibilitychange',()=>{if(document.hidden){input?.reset();cancelGesture();}});

input=tapController({getMark:i=>tut.done?g.marks[i]:tutorialMarks()[i],preview:(i,on)=>$('board').children[i]?.classList.toggle('tap-pending',on),act:(i,kind)=>{if(!tut.done){if(kind==='double'||tutorialMarks()[i]||tut.index===5)tutorialTap(i,kind);else message('同じマスを、トン・トンと2回タップ。');}else playTap(i,kind);}});
document.querySelectorAll('input[name=mode]').forEach(el=>el.addEventListener('change',()=>input.reset()));
