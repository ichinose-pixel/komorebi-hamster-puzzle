import {candidate,rng,solve,validBoard,          } from './core.js?v=be6f9a6a74417ecf';
import {analyze,             } from './deduction.js?v=be6f9a6a74417ecf';
                                                                                                          
export const ENDLESS_BANDS=[{from:61,min:76,max:91,chain:10},{from:121,min:92,max:111,chain:12},{from:241,min:112,max:135,chain:14},{from:481,min:136,max:175,chain:16}];
export function endlessBand(stage       ){return ENDLESS_BANDS.filter(b=>b.from<=stage).at(-1)||ENDLESS_BANDS[0];}
function normalized(b      ){const ids=new Map               ();return b.regions.map(x=>{if(!ids.has(x))ids.set(x,ids.size);return ids.get(x);}).join(',');}
function transforms(b      ){const all        =[];for(let flip=0;flip<2;flip++)for(let turns=0;turns<4;turns++){const r=Array(b.n*b.n);for(let i=0;i<r.length;i++){let y=Math.floor(i/b.n),x=i%b.n;if(flip)x=b.n-1-x;for(let t=0;t<turns;t++)[x,y]=[b.n-1-y,x];r[y*b.n+x]=b.regions[i];}all.push({n:b.n,regions:r});}return all;}
export function canonical(b      ){return b.n+':'+transforms(b).map(normalized).sort()[0];}
export function solutionShape(b      ){const answer=solve(b,[],1)[0];if(!answer)return '';const shape={n:b.n,regions:Array(b.n*b.n).fill(0)};for(const i of answer)shape.regions[i]=1;return transforms(shape).map(x=>x.regions.join('')).sort()[0];}
export function tactics(a                      ){return ['locked','adjacency','pair'].map(k=>a.counts[k]||0).join(':');}
                                                                          
export function accepted(b      ,stage       ){if(!validBoard(b)||solve(b).length!==1)return null;const a=analyze(b),band=endlessBand(stage);return !a.remaining&&a.score>=band.min&&a.score<=band.max&&a.chain>=band.chain?a:null;}
export function novel(b      ,a                      ,h        ){return !h.boards.includes(canonical(b))&&!h.solutions.slice(-3).includes(solutionShape(b))&&h.tactics.at(-1)!==tactics(a);}
export function remember(h        ,e             )        {return {boards:[...h.boards,canonical(e.board)],solutions:[...h.solutions.slice(-7),solutionShape(e.board)],tactics:[...h.tactics.slice(-7),tactics(e)]};}
export function mutate(b      ,random           ,count=1)      {const regions=[...b.regions],n=b.n;for(let step=0;step<count;step++){const i=Math.floor(random()*regions.length),adj=[i-n,i+n,...(i%n?[i-1]:[]),...(i%n<n-1?[i+1]:[])].filter(j=>j>=0&&j<regions.length&&regions[i]!==regions[j]);if(adj.length)regions[i]=regions[adj[Math.floor(random()*adj.length)]];}return {n,regions};}
export function reserve(seed       ,stage       ,bank               ,h        ){const pool=bank.filter(e=>e.score>=endlessBand(stage).min&&e.score<=endlessBand(stage).max&&e.chain>=endlessBand(stage).chain&&novel(e.board,e,h));if(!pool.length)throw Error('UNSEEN_RESERVE_EXHAUSTED');return {...pool[Math.floor(rng(seed)()*pool.length)],seed,source:'unseen-verified-reserve',repeated:false,changes:0};}
export function generateEndless(seed       ,stage       ,bank               ,h        ,attempts=2000){
 const random=rng(seed),band=endlessBand(stage),bases=bank.filter(e=>e.score>=band.min&&e.score<=band.max&&!h.solutions.slice(-3).includes(solutionShape(e.board)));let b           =null,origin           =null,changes=0,currentScore=0;
 for(let i=0;i<attempts;i++){
  // Start from a new placement/connected partition periodically; otherwise explore
  // a broad verified pool with longer, variable walks, never a four-cell cap.
  if(i===0||i%500===200){b=i===0?candidate(seed,7):bases[Math.floor(random()*bases.length)]?.board||candidate(seed+i,7);origin=b;currentScore=analyze(b).score;changes=0;}
  const next=mutate(b ,random,1+Math.floor(random()*3));if(!validBoard(next)||solve(next).length!==1)continue;
  const a=analyze(next);if(a.remaining)continue;const distance=(score       )=>score<band.min?band.min-score:score>band.max?score-band.max:0;
  if(distance(a.score)>distance(currentScore)&&random()>.12)continue;b=next;currentScore=a.score;changes++;
  const changedCells=next.regions.filter((v,j)=>v!==origin .regions[j]).length;
  if(changes<12||changedCells<8||a.score<band.min||a.score>band.max||a.chain<band.chain||!novel(next,a,h))continue;
  return {board:next,seed,score:a.score,chain:a.chain,counts:a.counts,source:'generated-endless',repeated:false,changes};
 }
 return reserve(seed,stage,bank,h);
}
