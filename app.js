import {fresh,mark,undo,won,restore,solve} from './core.js?v=017fc91a860d4fea';
import {analyze} from './deduction.js?v=017fc91a860d4fea';
import {targetFor,fallbackFor,signature} from './progression.js?v=017fc91a860d4fea';
const $=id=>document.getElementById(id),lp=new URLSearchParams(location.search).get('mode')==='lp';
const key=lp?'komorebi-lp-v1':'komorebi-v1';
const theme={icon:'🐹',name:'ハムスター'};
let g,selected=-1,hinted=[],premise=[],excluded=new Set(),hintCursor=0,busy=false,score=0,worker=null,lpCtaAvailable=false,recent=[];
const catalog=await fetch('./catalog.json?v=017fc91a860d4fea').then(r=>r.json());
function resetHint(){hinted=[];premise=[];excluded.clear();hintCursor=0;}
function save(){try{localStorage.setItem(key,JSON.stringify(g));localStorage.setItem(key+'-recent',JSON.stringify(recent.slice(-50)));}catch{$('status').textContent+=' 保存できない環境です。';}}
function render(){
 const focused=[...$('board').children].indexOf(document.activeElement),target=targetFor(g.stage,catalog);
 $('stage').textContent=lp?'小さな体験版':target.endless?`熟練ループ ${g.stage-30}`:`お部屋 ${g.stage} / 30`;
 $('difficulty').textContent=`${g.board.n}×${g.board.n} · 目標 ${target.target} / 実測 ${score}`;
 $('board').style.setProperty('--n',g.board.n);$('board').replaceChildren();
 $('pan-note').hidden=g.board.n<7;
 g.marks.forEach((v,i)=>{
  const b=document.createElement('button');b.className='cell'+(selected===i?' selected':'')+(hinted.includes(i)?' hinted':'')+(premise.includes(i)?' premise':'')+(excluded.has(i)?' excluded':'');b.dataset.region=g.board.regions[i];
  b.setAttribute('aria-label',`${Math.floor(i/g.board.n)+1}行 ${i%g.board.n+1}列 部屋${g.board.regions[i]+1} ${['空き',theme.name,'除外','仮置き'][v]}${excluded.has(i)?' ヒントで除外':''}`);b.setAttribute('aria-pressed',String(v!==0));
  const small=document.createElement('small');small.textContent=g.board.regions[i]+1;b.append(small,document.createTextNode(v?['',theme.icon,'×','?'][v]:excluded.has(i)?'·':''));
  b.onclick=()=>{
   if(busy||won(g))return;
   const value=Number(document.querySelector('input[name=mode]:checked').value);if(g.marks[i]===value)return;
   g=mark(g,i,value);selected=-1;resetHint();save();render();
   $('status').textContent=won(g)?'みんなの居場所が見つかりました！':'記録しました。戻す・仮置きでゆっくり考えられます。';
  };$('board').append(b);
 });
 if(focused>=0)$('board').children[focused]?.focus({preventScroll:true});
 $('next').hidden=!won(g)||lp;$('next').textContent=g.stage>=30?'熟練の別のお部屋へ →':'次のお部屋へ →';
 $('cta').hidden=!lp||(!won(g)&&!lpCtaAvailable);$('undo').disabled=!g.history.length||busy;$('hint').disabled=busy||won(g);$('next').disabled=busy;
}
async function start(stage){
 busy=true;$('status').textContent='次のお部屋を準備中…';if(g)render();
 const seed=crypto.getRandomValues(new Uint32Array(1))[0];
 const result=await new Promise(resolve=>{
  let finished=false;const finish=x=>{if(finished)return;finished=true;clearTimeout(timer);worker?.terminate();worker=null;resolve(x);};
  const timer=setTimeout(()=>finish(null),1000);
  try{worker=new Worker('./worker.js?v=017fc91a860d4fea',{type:'module'});worker.onmessage=e=>finish(e.data.ok?e.data:null);worker.onerror=()=>finish(null);worker.postMessage({seed,stage,catalog,recent});}catch{finish(null);}
 });
 const chosen=result||fallbackFor(seed,stage,catalog,recent);
 g=fresh(chosen.board,seed,stage);g.generatorVersion=2;score=chosen.score;recent.push(signature(g.board));busy=false;selected=-1;resetHint();save();render();
 $('status').textContent=(chosen.source==='mutated'?'新しいお部屋を用意しました。':'難度に合う検証済みのお部屋を用意しました。')+(stage>30?' 難度は上限です。熟練帯の別配置を楽しめます。':'');
}
$('undo').onclick=()=>{g=undo(g);selected=-1;resetHint();save();render();$('status').textContent='ひとつ前に戻しました。';};
$('hint').onclick=()=>{
 const placed=g.marks.flatMap((v,i)=>v===1?[i]:[]);
 if(!solve(g.board,placed,1).length){$('status').textContent='現在の配置では完成できません。戻すか仮置きに変えて見直しましょう。';return;}
 const step=analyze(g.board,placed).steps[hintCursor];
 if(!step){$('status').textContent='この配置からは用意した推論で進めません。戻して見直しましょう。';return;}
 premise=step.premise;hinted=step.place!==undefined?[step.place]:step.remove;
 if(step.place===undefined){step.remove.forEach(i=>excluded.add(i));hintCursor++;}
 render();$('status').textContent=`ヒント ${hintCursor+(step.place===undefined?0:1)}：${step.reason} ${step.place===undefined?'点のマスは除外できます。もう一度ヒントで次の理由へ。':'枠のマスに置いてみましょう。'}`;
};
$('next').onclick=()=>start(g.stage+1);
document.querySelectorAll('input[name=mode]').forEach(x=>x.onchange=()=>{selected=-1;render();});
try{g=restore(localStorage.getItem(key)||'');const stored=JSON.parse(localStorage.getItem(key+'-recent')||'[]');if(Array.isArray(stored))recent=stored.filter(x=>typeof x==='string').slice(-50);}catch{}
if(g){score=analyze(g.board).score;render();$('status').textContent=won(g)?'クリア済みのお部屋です。次へ進めます。':'前回のお部屋を再開しました。';}else await start(1);
document.addEventListener('visibilitychange',()=>{selected=-1;if(g){save();render();}});
if(lp){document.querySelector('header a').textContent='通常版へ';document.querySelector('header a').href='./';setTimeout(()=>{lpCtaAvailable=true;$('cta').hidden=false;},30000);}
