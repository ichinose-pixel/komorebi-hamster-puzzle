                                                     
                                                    
export const conflict = (b       , a        , c        )          => a === c || Math.floor(a/b.n) === Math.floor(c/b.n) || a%b.n === c%b.n || b.regions[a] === b.regions[c] || (Math.abs(Math.floor(a/b.n)-Math.floor(c/b.n)) <= 1 && Math.abs(a%b.n-c%b.n) <= 1);
export function validBoard(b       )          {
  if (!Number.isInteger(b.n) || b.n < 4 || b.n > 8 || b.regions.length !== b.n*b.n || b.regions.some(x=>!Number.isInteger(x)||x<0||x>=b.n)) return false;
  for(let k=0;k<b.n;k++) {
    const cells=b.regions.flatMap((v,i)=>v===k?[i]:[]), seen=new Set        (), todo=cells.slice(0,1);
    while(todo.length){const i=todo.pop() ;if(seen.has(i))continue;seen.add(i);for(const j of neighbors(i,b.n))if(b.regions[j]===k&&!seen.has(j))todo.push(j);}
    if(!cells.length||seen.size!==cells.length)return false;
  } return true;
}
function neighbors(i       ,n       )         {return [i-n,i+n,...(i%n?[i-1]:[]),...(i%n<n-1?[i+1]:[])].filter(j=>j>=0&&j<n*n);}
export function solve(b       , fixed           = [], limit=2)             {
  if(fixed.some((a,i)=>!Number.isInteger(a)||a<0||a>=b.n*b.n||fixed.slice(0,i).some(c=>conflict(b,a,c))))return [];
  const answers           =[];
  function visit(p         ){
    if(answers.length>=limit)return;
    if(p.length===b.n){answers.push([...p].sort((a,c)=>a-c));return;}
    let best              =null;
    for(let r=0;r<b.n;r++){
      if(p.some(i=>Math.floor(i/b.n)===r))continue;
      const options=Array.from({length:b.n},(_,c)=>r*b.n+c).filter(i=>p.every(j=>!conflict(b,i,j)));
      if(!best||options.length<best.length)best=options;
    }
    for(const i of best||[])visit([...p,i]);
  } visit(fixed);return answers;
}
export function logicalTrace(b      , fixed         =[])                                             {
  const p=[...fixed],steps       =[];let choices=0;
  while(p.length<b.n){
    const candidates=b.regions.map((_,i)=>i).filter(i=>p.every(j=>!conflict(b,i,j)));
    let found          =null, singles=0;
    for(const kind of ['row','column','region'])for(let k=0;k<b.n;k++){
      const group=(i       )=>kind==='row'?Math.floor(i/b.n):kind==='column'?i%b.n:b.regions[i];
      if(p.some(i=>group(i)===k))continue;
      const available=candidates.filter(i=>group(i)===k);
      if(available.length===1){singles++;found??={cell:available[0],reason:`${kind==='row'?'行':kind==='column'?'列':'領域'} ${k+1} で、置いた灯りと衝突しない候補はこの1マスだけです。`};}
    }
    if(!found)break;choices+=Math.max(0,4-singles);steps.push(found);p.push(found.cell);
  }
  return {steps,remaining:b.n-p.length,score:choices+8*(b.n-p.length)};
}
export function rng(seed       )           {let s=seed>>>0;return()=>{s+=0x6d2b79f5;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function shuffle   (a    ,random           )    {for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function candidate(seed       ,n=5)       {
  const random=rng(seed), cols         =[];
  function place()        {if(cols.length===n)return true;for(const c of shuffle(Array.from({length:n},(_,i)=>i),random)){if(cols.includes(c)||(cols.length&&Math.abs(cols.at(-1) -c)<=1))continue;cols.push(c);if(place())return true;cols.pop();}return false;}
  place();const regions=Array(n*n).fill(-1);cols.forEach((c,r)=>regions[r*n+c]=r);
  while(regions.includes(-1)){
    const edges           =[];regions.forEach((v,i)=>{if(v>=0)for(const j of neighbors(i,n))if(regions[j]<0)edges.push([j,v]);});
    const [i,v]=edges[Math.floor(random()*edges.length)];regions[i]=v;
  }return {n,regions};
}
export function generate(seed       ,target=0,attempts=100)                                         {
  let best           =null,bestScore=0;
  for(let i=0;i<attempts;i++){
    const b=candidate((seed+Math.imul(i,2654435761))>>>0);
    if(solve(b).length!==1)continue;
    const t=logicalTrace(b);if(t.remaining)continue;
    if(!best||Math.abs(t.score-target)<Math.abs(bestScore-target)){best=b;bestScore=t.score;}
    if(bestScore===target)break;
  }
  if(!best)throw new Error('GENERATION_EXHAUSTED');return {board:best,score:bestScore,exact:bestScore===target};
}
                                                                                                                                            
export function fresh(board      ,seed       ,stage=1)     {return {version:1,rulesVersion:1,generatorVersion:1,seed,stage,board,marks:Array(board.n**2).fill(0),history:[]};}
export function mark(g     ,cell       ,value       )      {if(!Number.isInteger(cell)||cell<0||cell>=g.marks.length||![0,1,2,3].includes(value))return g;const marks=[...g.marks];marks[cell]=value;return {...g,marks,history:[...g.history.slice(-99),g.marks]};}
export function undo(g     )     {return g.history.length?{...g,marks:g.history.at(-1) ,history:g.history.slice(0,-1)}:g;}
export function won(g     )        {const p=g.marks.flatMap((v,i)=>v===1?[i]:[]);return p.length===g.board.n&&p.every((a,i)=>p.slice(0,i).every(c=>!conflict(g.board,a,c)));}
export function restore(raw       )          {try{const g=JSON.parse(raw);if(g.version!==1||g.rulesVersion!==1||![1,2,3].includes(g.generatorVersion)||!Number.isSafeInteger(g.seed)||!Number.isSafeInteger(g.stage)||g.stage<1||g.stage>1000000||!validBoard(g.board)||solve(g.board).length!==1)return null;const valid=(a        )=>Array.isArray(a)&&a.length===g.board.n**2&&a.every(v=>[0,1,2,3].includes(v));if(!valid(g.marks)||!Array.isArray(g.history)||g.history.length>100||!g.history.every(valid))return null;return g;}catch{return null;}}
