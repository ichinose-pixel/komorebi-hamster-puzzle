import {conflict,           } from './core.js?v=0800796296e5a9c4';

                                                                                                                                                                
                                                                                                                                     
// No search and no reference solution: all deductions follow from exactly one per unit.
export function analyze(b      ,fixed         =[],eliminated         =[])          {
 const placed=[...fixed],blocked=new Set        (eliminated),steps            =[],depth=Array(b.n*b.n).fill(0);
 const units=Array.from({length:3*b.n},(_,u)=>({name:`${u<b.n?'行':u<2*b.n?'列':'部屋'} ${u%b.n+1}`,cells:b.regions.flatMap((v,i)=>(u<b.n?Math.floor(i/b.n)===u:u<2*b.n?i%b.n===u-b.n:v===u-2*b.n)?[i]:[])}));
 const counts={single:0,locked:0,adjacency:0,pair:0};
 for(let iteration=0;iteration<200&&placed.length<b.n;iteration++){
  const available=b.regions.map((_,i)=>i).filter(i=>!blocked.has(i)&&placed.every(p=>!conflict(b,i,p)));
  const active=units.filter(u=>!u.cells.some(i=>placed.includes(i))).map(u=>({...u,candidates:u.cells.filter(i=>available.includes(i))}));
  if(active.some(u=>!u.candidates.length))break;
  let found                    ;
  const single=active.find(u=>u.candidates.length===1);
  if(single){const d=1+Math.max(0,...single.cells.filter(i=>i!==single.candidates[0]).map(i=>depth[i]));found={kind:'single',place:single.candidates[0],remove:[],premise:single.candidates,context:single.cells,reason:`${single.name} に残る候補は1マスだけです。`,depth:d};}
  // A unit's candidates sharing a row/column/region exclude all other cells of that unit.
  if(!found)for(const u of active){
   for(const v of active){if(u===v)continue;if(!u.candidates.every(i=>v.cells.includes(i)))continue;
    const remove=v.candidates.filter(i=>!u.candidates.includes(i));if(!remove.length)continue;
    found={kind:'locked',remove,premise:u.candidates,context:u.cells,reason:`${u.name} の候補はすべて ${v.name} の中。${v.name} のそれ以外のマスには置けません。`,depth:1+Math.max(0,...u.cells.map(i=>depth[i]))};break;
   }if(found)break;
  }
  // Every possible position in a unit touches a given candidate: that candidate is impossible.
  if(!found)for(const u of active){
   const remove=available.filter(i=>!u.candidates.includes(i)&&u.candidates.every(j=>conflict(b,i,j)));
   if(remove.length){found={kind:'adjacency',remove,premise:u.candidates,reason:`${u.name} のどの候補を選んでも、枠のマスは行・列・部屋または隣接のルールに違反します。`,depth:1+Math.max(0,...u.cells.map(i=>depth[i]))};break;}
  }
  // Hall pair: two disjoint regions occupy exactly two rows/columns.
  if(!found){const rooms=active.filter(u=>u.name.startsWith('部屋'));
   outer:for(let a=0;a<rooms.length;a++)for(let c=a+1;c<rooms.length;c++)for(const axis of ['row','column']){
    const cells=[...rooms[a].candidates,...rooms[c].candidates];const line=(i       )=>axis==='row'?Math.floor(i/b.n):i%b.n;const lines=[...new Set(cells.map(line))];if(lines.length!==2)continue;
    const remove=available.filter(i=>lines.includes(line(i))&&!rooms[a].cells.includes(i)&&!rooms[c].cells.includes(i));if(!remove.length)continue;
    found={kind:'pair',remove,premise:cells,context:[...rooms[a].cells,...rooms[c].cells],reason:`${rooms[a].name} と ${rooms[c].name} の2匹は ${axis==='row'?'行':'列'} ${lines.map(x=>x+1).join('・')} を使います。その2本の他の部屋には置けません。`,depth:1+Math.max(0,...[...rooms[a].cells,...rooms[c].cells].map(i=>depth[i]))};break outer;
   }
  }
  if(!found)break;
  steps.push(found);counts[found.kind]++;
  if(found.place!==undefined){placed.push(found.place);for(const i of b.regions.keys())if(conflict(b,i,found.place))depth[i]=Math.max(depth[i],found.depth);}
  for(const i of found.remove){blocked.add(i);depth[i]=Math.max(depth[i],found.depth);}
 }
 const chain=Math.max(0,...steps.map(s=>s.depth));
 // Experimental cognitive-work proxy; size is not part of the score.
 const score=counts.single+4*counts.locked+6*counts.adjacency+9*counts.pair+2*chain;
 return {steps,solution:placed,remaining:b.n-placed.length,score,chain,counts};
}
