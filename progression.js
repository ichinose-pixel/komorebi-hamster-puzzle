import {rng,solve,validBoard,          } from './core.js?v=0800796296e5a9c4';
import {analyze} from './deduction.js?v=0800796296e5a9c4';
                                                                                                   
                                                                                  
export function targetFor(stage       ,catalog        ){const index=Math.min(catalog.stages.length-1,Math.max(0,stage-1));return {...catalog.stages[index],endless:stage>catalog.stages.length};}
export function signature(b      )       {const map=new Map               ();return b.n+':'+b.regions.map(x=>{if(!map.has(x))map.set(x,map.size);return map.get(x);}).join(',');}
export function fallbackFor(seed       ,stage       ,catalog        ,recent         =[]){
 const target=targetFor(stage,catalog);const options=target.entries.filter(x=>!recent.includes(signature(x.board)));const pool=options.length?options:target.entries;
 const entry=pool[Math.floor(rng(seed)()*pool.length)];return {...entry,source:'verified-bank',repeated:!options.length};
}
export function generateStage(seed       ,stage       ,catalog        ,recent         =[],attempts=160){
 const base=fallbackFor(seed,stage,catalog,recent),target=targetFor(stage,catalog),random=rng(seed^0xa511e9b3);let board=base.board,changes=0;
 for(let attempt=0;attempt<attempts;attempt++){
  const i=Math.floor(random()*board.regions.length),n=board.n;
  const adj=[i-n,i+n,...(i%n?[i-1]:[]),...(i%n<n-1?[i+1]:[])].filter(j=>j>=0&&j<n*n&&board.regions[j]!==board.regions[i]);if(!adj.length)continue;
  const regions=[...board.regions];regions[i]=board.regions[adj[Math.floor(random()*adj.length)]];const next={n,regions};
  if(!validBoard(next)||solve(next).length!==1)continue;
  const a=analyze(next);if(a.remaining||a.score!==target.target||recent.includes(signature(next)))continue;
  board=next;changes++;if(changes>=4)break;
 }
 const a=analyze(board);return {board,seed,score:a.score,chain:a.chain,counts:a.counts,source:changes?'mutated':'verified-bank',repeated:recent.includes(signature(board)),changes};
}
