import {fresh,restore,         } from './core.js?v=6b507c7cf90ec9c4';
import {generateStage,signature,            } from './progression.js?v=6b507c7cf90ec9c4';
export const DAILY_VERSION=1;
export const LEVELS=['easy','standard','hard']         ;
                                        
// Disjoint logical-score bands, not just larger board dimensions.
export const BANDS={easy:{stages:[3,5,7],min:19,max:27},standard:{stages:[12,15,18],min:36,max:48},hard:{stages:[25,28,30],min:57,max:75}}         ;
                                                                                                           
                                                                      
export function validDate(date        )               {if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;const [y,m,d]=date.split('-').map(Number);return y>=2000&&y<=9999&&new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10)===date;}
export function localDate(now=new Date())       {if(!Number.isFinite(now.getTime()))throw Error('INVALID_DATE');return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
export function dailyId(date       ,level      ,slot       ){if(!validDate(date)||!LEVELS.includes(level)||!Number.isInteger(slot)||slot<0||slot>2)throw Error('INVALID_DAILY_ID');return `${date}:${level}:${slot}`;}
export function seedFor(id       )       {let h=2166136261;for(const c of 'hamudoku-daily-v1:'+id){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0;}
export function createDaily(date       ,catalog        )            {
 if(!validDate(date))throw Error('INVALID_DATE');const puzzles              =[];const seen         =[];
 for(const level of LEVELS)for(let slot=0;slot<3;slot++){
  const id=dailyId(date,level,slot),seed=seedFor(id),stage=BANDS[level].stages[slot];
  // Fixed operation budget keeps every device deterministic. Verified catalog fallback is built in.
  const entry=generateStage(seed,stage,catalog,seen,64);
  if(entry.score<BANDS[level].min||entry.score>BANDS[level].max)throw Error('DAILY_BANK_MISMATCH');
  const sig=signature(entry.board);if(seen.includes(sig))throw Error('DUPLICATE_DAILY_BOARD');seen.push(sig);
  puzzles.push({id,date,level,slot,seed,score:entry.score,game:fresh(entry.board,seed,stage)});
 }
 return {version:DAILY_VERSION,date,puzzles};
}
export function validateBundle(value            )     {
 if(value?.version!==1||!validDate(value.date)||!Array.isArray(value.puzzles)||value.puzzles.length!==9)throw Error('INVALID_DAILY_BUNDLE');
 const ids=new Set        ();for(const p of value.puzzles){if(p.date!==value.date||p.id!==dailyId(p.date,p.level,p.slot)||p.seed!==seedFor(p.id)||p.game.seed!==p.seed||!restore(JSON.stringify(p.game))||!Number.isFinite(p.score)||p.score<BANDS[p.level].min||p.score>BANDS[p.level].max)throw Error('INVALID_DAILY_PUZZLE');ids.add(p.id);}if(ids.size!==9)throw Error('DUPLICATE_DAILY_ID');
}
