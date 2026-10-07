import {cheekHam} from './character.js?v=843e60a0f442c23e';
import {tapController} from './interaction.js?v=843e60a0f442c23e';
import {conflict,solve} from './core.js?v=843e60a0f442c23e';
export const LEARNING_BOARD={n:4,regions:[2,0,0,1,2,0,0,1,2,0,0,3,2,0,3,3]};
const solution=solve(LEARNING_BOARD)[0],first=solution[0],colors=['#F3D995','#AAD9CE','#CBBCE6','#F0BAB4'];
const steps=[['まずは、いっしょに。','光るマスを、トン・トン。'],['よこは、ひとり席。','同じ横の列には、もう置かない。'],['たても、ひとり席。','同じ縦の列にも、1匹だけ。'],['色のおへやに、1匹。','同じ色・番号は、ひとつのおへや。'],['となりは、空けてね。','ななめも、ぴったり隣には置かない。'],['こんどは、あなたの番。','残り3匹の居場所を見つけよう。'],['みんなの席、できた！','この調子で、ぼくのおうちもよろしく。']];
export function learningSnapshot(raw){
 const good=raw?.version===1&&Number.isInteger(raw.step)&&raw.step>=0&&raw.step<=6&&Array.isArray(raw.marks)&&raw.marks.length===16&&raw.marks.every(v=>[0,1,2].includes(v));
 if(!good)return {version:1,step:0,marks:Array(16).fill(0)};
 const placed=raw.marks.flatMap((v,i)=>v===1?[i]:[]);
 if(placed.some((a,i)=>placed.slice(0,i).some(b=>conflict(LEARNING_BOARD,a,b)))||raw.step>0&&raw.marks[first]!==1||raw.step===6&&placed.length!==4)return {version:1,step:0,marks:Array(16).fill(0)};
 return {version:1,step:raw.step,marks:[...raw.marks],...(raw.triedBlocked===true?{triedBlocked:true}:{})};
}
export function mountFirstExperience({read,onProgress,onComplete}){
 const dialog=document.createElement('dialog');dialog.id='first-experience';dialog.setAttribute('aria-labelledby','learn-title');document.body.append(dialog);
 let state=learningSnapshot(null),replay=false,notice='',guide=[],hint=-1,active=false;
 const controller=tapController({getMark:i=>state.marks[i],preview:(i,on)=>dialog.querySelector(`[data-learn-cell="${i}"]`)?.classList.toggle('tap-pending',on),act:(i,kind)=>act(i,kind)});
 const commit=()=>{if(!replay)onProgress(structuredClone(state));};
 function group(step){return Array.from({length:16},(_,i)=>i).filter(i=>step===1?Math.floor(i/4)===Math.floor(first/4):step===2?i%4===first%4:step===3?LEARNING_BOARD.regions[i]===LEARNING_BOARD.regions[first]:Math.abs(Math.floor(i/4)-Math.floor(first/4))<=1&&Math.abs(i%4-first%4)<=1);}
 function explain(i,placed){const j=placed.find(j=>conflict(LEARNING_BOARD,i,j));if(j===undefined)return null;const sameRow=Math.floor(i/4)===Math.floor(j/4),sameCol=i%4===j%4,sameRoom=LEARNING_BOARD.regions[i]===LEARNING_BOARD.regions[j];guide=Array.from({length:16},(_,n)=>n).filter(n=>sameRow?Math.floor(n/4)===Math.floor(j/4):sameCol?n%4===j%4:sameRoom?LEARNING_BOARD.regions[n]===LEARNING_BOARD.regions[j]:Math.abs(Math.floor(n/4)-Math.floor(j/4))<=1&&Math.abs(n%4-j%4)<=1);return sameRow?'この横の列には、もう1匹。':sameCol?'この縦の列には、もう1匹。':sameRoom?'この色のおへやは、もう満員。':'ななめも、ひとマス空けよう。';}
 function act(i,kind){
  if(!active)return;
  if(state.step===0){if(i!==first){notice='光る席に、まず1匹。';render();return;}if(kind==='single'){notice='同じ席をすばやく、トン・トン。';render();return;}state.marks[first]=1;state.step=1;notice='置けた！ この子の横を見てみよう。';commit();render();return;}
  if(state.step===4){
   if(kind!=='double'){notice='光る席を、トン・トン。';render();return;}
   if(!state.triedBlocked){
    if(i!==0){notice='まずは光る席を試してみよう。';render();return;}
    explain(i,[first]);state.triedBlocked=true;notice='同じ横の列にいるから、ここは置けないね。次は光る席へ。';commit();render();return;
   }
   if(i!==7){notice='今度は、光る空いた席へ置いてみよう。';render();return;}
   state.marks[7]=1;state.step=5;guide=[];notice='置けたね！ あとは自分で探してみよう。';commit();render();return;
  }
  if(state.step!==5)return;
  guide=[];hint=-1;if(i===first){notice='この子の席は決まっています。';render();return;}
  if(state.marks[i]){state.marks[i]=0;notice='戻して考え直せるよ。';}
  else if(kind==='single'){state.marks[i]=2;notice='×は「ここには置かない」のメモ。もう1回で消せます。';}
  else{const placed=state.marks.flatMap((v,n)=>v===1?[n]:[]),reason=explain(i,placed);if(reason){notice=reason;render();return;}state.marks[i]=1;notice='いい席だね。あと'+(4-state.marks.filter(v=>v===1).length)+'匹。';if(state.marks.filter(v=>v===1).length===4)state.step=6;}
  commit();render();
 }
 function render(){
  const step=state.step,reason=step>=1&&step<=4,highlight=reason?group(step===4&&state.triedBlocked?1:step):guide;
  const remaining=4-state.marks.filter(v=>v===1).length;
  const description=step===4?(state.triedBlocked?'今度は、空いている席へ。':'光る席に、置けるかな？ トン・トン。'):step===5?`残り${remaining}匹の居場所を見つけよう。`:steps[step][1];
  // Completion and placement counts are derived from the board, never a cached notice.
  if(step===6)notice='4匹みんな、席が決まったね！ 練習はこれでおしまい。';
  else if(step===4)notice=state.triedBlocked?'同じ横の列にいるから、ここは置けないね。次は光る席へ。':'となりや、ななめも空けるよ。まずは光る席を試してみよう。';
  else if(step===5&&notice.startsWith('いい席だね。'))notice=`いい席だね。あと${remaining}匹。`;
  dialog.innerHTML=`<div class="learn-shell"><header class="learn-top"><span>はじめの、小さなおへや</span><button id="learn-close" aria-label="練習を閉じる">×</button></header><div class="learn-scroll"><div class="learn-copy"><span class="learn-kicker">${step===6?'できたね！':step===5?'03 / じぶんで置く':step===0?'01 / いっしょに置く':'02 / 居場所のひみつ'}</span><h2 id="learn-title">${step===4?(state.triedBlocked?'ここなら、どうかな？':'この席、置けるかな？'):steps[step][0]}</h2><p>${description}</p></div><div class="learn-board-wrap"><div class="learn-board" role="group" aria-label="練習用4行4列の盤面">${state.marks.map((v,i)=>{const region=LEARNING_BOARD.regions[i],isGuide=highlight.includes(i),target=step===0&&i===first||step===4&&i===(state.triedBlocked?7:0)||i===hint;return `<button data-learn-cell="${i}" class="learn-cell ${isGuide?'reason-cell':''} ${target?'learn-target':''} ${v===1?'occupied':''}" style="--learn-color:${colors[region]};--edge-top:${i<4||LEARNING_BOARD.regions[i-4]!==region?3:0}px;--edge-bottom:${i>=12||LEARNING_BOARD.regions[i+4]!==region?3:0}px;--edge-left:${i%4===0||LEARNING_BOARD.regions[i-1]!==region?3:0}px;--edge-right:${i%4===3||LEARNING_BOARD.regions[i+1]!==region?3:0}px" aria-label="${Math.floor(i/4)+1}行${i%4+1}列 おへや${region+1} ${v===1?'ハム':v===2?'除外':'空き'}"><small>${region+1}</small>${v===1?cheekHam(step===6?'eat':'sit','learn-'+i):v===2?'<b class="learn-x">×</b>':isGuide?'<span class="reason-mark">·</span>':''}${target?'<span class="tap-cue">トン・トン</span>':''}</button>`;}).join('')}</div>${reason?`<span class="learn-rule-label">${['','よこに1匹','たてに1匹','色ごとに1匹','ななめも空ける'][step===4&&state.triedBlocked?1:step]}</span>`:''}</div><div class="learn-speaking"><span>${cheekHam(step===6?'eat':'sit','learn-guide')}</span><p id="learn-notice" role="status">${notice|| (step===0?'ぼくの席、ここかな。光るマスに2回タップしてみて。':step===5?'2回でハム。1回で×のメモ。置いたハムは1回で戻せます。':step===6?'練習はこれでおしまい。いつでも「遊び方」から会いにきてね。':'色がついたところは、この子のために空けておこう。')}</p></div></div><footer class="learn-actions">${step===0?'<p class="learn-touch-guide"><i></i><i></i> 同じマスを2回タップ</p>':step===4?'<p class="learn-touch-guide">光る席を2回タップ</p>':reason?`<div class="learn-rule-dots">${[1,2,3,4].map(n=>`<i class="${n<=step?'done':''}"></i>`).join('')}</div><button id="learn-next" class="primary">${step===4?'自分でやってみる':'次のひみつを見る'} <b>→</b></button>`:step===5?'<span class="learn-count">'+state.marks.filter(v=>v===1).length+' / 4 匹</span><button id="learn-hint" class="secondary">ひとつヒント</button>':'<button id="learn-finish" class="primary">'+(replay?'練習をおわる':'最初のおへやへ')+' →</button>'}</footer></div>`;
  dialog.querySelector('#learn-close').onclick=()=>dialog.close();
  dialog.querySelectorAll('[data-learn-cell]').forEach(b=>{b.onclick=e=>{if(e.detail===0)act(Number(b.dataset.learnCell),'double');};b.onpointerup=e=>{if(e.isPrimary&&e.button===0){e.preventDefault();controller.tap(Number(b.dataset.learnCell));}};});
  dialog.querySelector('#learn-next')?.addEventListener('click',()=>{controller.reset();state.step++;notice='';commit();render();});
  dialog.querySelector('#learn-hint')?.addEventListener('click',()=>{const placed=state.marks.flatMap((v,i)=>v===1?[i]:[]),bad=placed.find(i=>!solution.includes(i));hint=bad??solution.find(i=>state.marks[i]!==1);notice=bad!==undefined?'光る子を一度戻すと、みんなが入れるよ。':state.marks[hint]===2?'光る×を消してから、そこへトン・トン。':'光る席が、次の子の居場所。';render();});
  dialog.querySelector('#learn-finish')?.addEventListener('click',()=>{dialog.close();onComplete(replay);});
 }
 dialog.addEventListener('close',()=>{active=false;controller.reset();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)controller.reset();});window.addEventListener('pagehide',()=>controller.reset());
 return {open(isReplay=false){replay=isReplay;state=learningSnapshot(replay?null:read());notice='';guide=[];hint=-1;active=true;render();dialog.showModal();dialog.querySelector('#learn-close').focus({preventScroll:true});},pause(){controller.reset();},close(){dialog.close();}};
}
