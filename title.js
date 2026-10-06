import {localDate} from './daily.js?v=77f9ea4e4a11669e';
import {loginStatus,LOGIN_REWARDS} from './login.js?v=77f9ea4e4a11669e';
import {receiveLogin,balance} from './economy.js?v=77f9ea4e4a11669e';
export function mountTitle({store,ready,onDaily,onHome}){
 const $=id=>document.getElementById(id),dialog=document.createElement('dialog');dialog.id='login-dialog';dialog.setAttribute('aria-labelledby','login-heading');
 dialog.innerHTML='<button id="login-close" class="icon-button close" aria-label="閉じる">×</button><p class="eyebrow">A LITTLE WELCOME</p><h2 id="login-heading">今日も、いらっしゃい。</h2><p class="login-intro">遊びに来た日に、ひとつずつ。<br>お休みしても、続きから。</p><ol id="login-days" class="login-days"></ol><p id="login-wallet"></p><button id="login-claim" class="primary wide"></button><p id="login-feedback" role="status" aria-live="polite"></p><p class="login-note">7回受け取ると、また1日目へ。</p>';document.body.append(dialog);
 let claiming=false;
 function refresh(){
  const ok=ready(),w=ok?store.read():null,date=localDate(),s=loginStatus(w?.loginClaims,date);$('title-daily').disabled=!ok;$('title-login').disabled=!ok;
  const [year,month,day]=date.split('-');$('daily-date').textContent=`${Number(month)}月${Number(day)}日`;
  const completed=Object.keys(w?.dailyClaims||{}).filter(x=>x.startsWith(date+':')).length;$('daily-progress').textContent=`${completed} / 9 クリア`;
  $('login-amount').textContent=s.received?`今日の ${s.amount} コイン ✓`:`今日は ${s.amount} コイン`;
  $('login-mini').innerHTML=LOGIN_REWARDS.map((_,i)=>`<i class="${i<s.completed?'done':''} ${i===s.day-1?'current':''}">${i<s.completed?'✓':i+1}</i>`).join('');
  $('login-status').textContent=s.received?'受け取り済み ✓':s.available?'ごほうびを受け取る ↗':'7日分のごほうびを見る ↗';
  const furniture=(w?.ownedLegacy.length||0)+Object.values(w?.purchases||{}).filter(p=>p.kind==='furniture').length;
  const rooms=w?.rooms.length||1;$('house-status').textContent=furniture?`家具 ${furniture} 点 · ${rooms} つのおへや`:'小さなおうちで、待ってるよ';
  $('login-days').innerHTML=LOGIN_REWARDS.map((amount,i)=>`<li class="${i<s.completed?'done':''} ${i===s.day-1?'current':''}"><span>${i+1}日目</span><b>${i<s.completed?'✓':'●'}</b><strong>${amount}<small>コイン</small></strong></li>`).join('');
  $('login-wallet').textContent=`もっているコイン　${w?balance(w):0}`;
  $('login-claim').disabled=!ok||!s.available||claiming;$('login-claim').textContent=s.received?'今日は受け取り済み':s.available?`${s.amount} コインを受け取る`:'次の受取日までお待ちください';
 }
 $('title-daily').onclick=onDaily;$('title-house').onclick=onHome;$('title-login').onclick=()=>{refresh();$('login-feedback').textContent='';dialog.showModal();};$('login-close').onclick=()=>dialog.close();
 $('login-claim').onclick=async()=>{if(claiming)return;claiming=true;refresh();try{let gained=0;await store.transact(w=>{const next=receiveLogin(w,localDate());gained=balance(next)-balance(w);return next;});$('login-feedback').textContent=gained?`${gained} コイン、受け取りました。`:'今日のごほうびは受け取り済みです。';}catch{$('login-feedback').textContent='保存できませんでした。もう一度お試しください。';}finally{claiming=false;refresh();}};
 window.addEventListener('storage',()=>refresh());document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 setInterval(()=>{if(!$('title-screen').hidden||dialog.open)refresh();},30000);refresh();return {refresh};
}
