import {claimLogin,validateLogin,                } from './login.js?v=0755164c70ca2c22';
import {restore,won,         } from './core.js?v=0755164c70ca2c22';
import {signature,            } from './progression.js?v=0755164c70ca2c22';
import {createDaily,validateBundle,validDate,                           } from './daily.js?v=0755164c70ca2c22';
import {initialCare,advanceCare,careAction,pauseCare,welcomeCare,reviveCare,validateCare,         } from './care.js?v=0755164c70ca2c22';
export const WORLD_KEY='komorebi-v1-world-v1';
export const TEST_BALANCE={normal:3,daily:{easy:10,standard:15,hard:20}}         ;
                                                                       
export const FREE_POLICY           ={id:'free-v1',numerator:1,denominator:1};
export const LEGACY_SLOTS=['rug','table','seat','light','plant','snack','guest','portrait','phone','flags','shelf','crown'];
                                         
                                                                                                                                                                                                                                                                                                                                                                             
                                                                                                                             
                                                      
                                                                  
const clone=   (v  )  =>JSON.parse(JSON.stringify(v));
const safeInt=(v        )=>Number.isSafeInteger(v)&&Number(v)>=0;
const dict=(v        )=>!!v&&typeof v==='object'&&!Array.isArray(v);
const safeId=(v        )=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(v);
export function migrateWorld(oldCollection        )      {
 const c=oldCollection                                                                  ;
 const completed=Array.isArray(c?.completed)?[...new Set(c.completed.filter((x)            =>typeof x==='string'&&/^\d+:\d+$/.test(x)))]:[];
 const milestones=[1,5,10,15,20,25,30,36,42,48,54,60];
 const earnedCount=Array.isArray(c?.completed)?c.completed.filter(x=>typeof x==='string').length:0;
 const oldCount=c?.version===2?Math.max(Math.min(12,Math.max(0,Number(c.legacyFurniture)||0)),milestones.filter(n=>n<=earnedCount).length):Math.min(12,earnedCount);
 return {version:1,revision:0,normalClaims:Object.fromEntries(completed.map(id=>[id,{amount:0,policy:'legacy-no-retroactive-coins'}])),dailyClaims:{},days:{},highestDate:'',ownedLegacy:Array.from({length:Math.floor(oldCount)},(_,i)=>`legacy-${i}`),purchases:{},rooms:['main'],placements:Object.fromEntries(Array.from({length:Math.floor(oldCount)},(_,i)=>[`main/${LEGACY_SLOTS[i]}`,`legacy-${i}`]))};
}
export function balance(w      )       {const sum=Object.values(w.loginClaims||{}).reduce((n,c)=>n+c.amount,0)+Object.values(w.normalClaims).concat(Object.values(w.dailyClaims)).reduce((n,c)=>n+c.amount,0)-Object.values(w.purchases).reduce((n,p)=>n+p.price,0);if(!safeInt(sum))throw Error('INVALID_BALANCE');return sum;}
export function validateWorld(w      )     {
 if(w?.version!==1||!safeInt(w.revision)||![w.normalClaims,w.dailyClaims,w.days,w.purchases,w.placements].every(dict)||!Array.isArray(w.rooms)||!w.rooms.includes('main')||w.rooms.some(x=>!safeId(x))||!Array.isArray(w.ownedLegacy)||w.ownedLegacy.some(x=>!/^legacy-(?:[0-9]|1[01])$/.test(x))||new Set(w.rooms).size!==w.rooms.length||new Set(w.ownedLegacy).size!==w.ownedLegacy.length||w.highestDate!==''&&!validDate(w.highestDate))throw Error('INVALID_WORLD');
 for(const [id,c] of Object.entries(w.normalClaims)){if(!/^\d+:\d+$/.test(id)||!safeInt(c.amount)||typeof c.policy!=='string')throw Error('INVALID_NORMAL_CLAIM');}
 for(const [day,b] of Object.entries(w.days)){if(day!==b.date)throw Error('INVALID_DAY_KEY');validateBundle(b);}
 for(const [id,c] of Object.entries(w.dailyClaims)){const date=id.slice(0,10);if(!safeInt(c.amount)||typeof c.policy!=='string'||!w.days[date]?.puzzles.some(p=>p.id===id&&won(p.game)))throw Error('INVALID_DAILY_CLAIM');}
 for(const [id,p] of Object.entries(w.purchases)){if(!safeId(id)||!safeInt(p.price)||!['furniture','expansion'].includes(p.kind))throw Error('INVALID_PURCHASE');}
 for(const [location,id] of Object.entries(w.placements)){if(typeof id!=='string'||(!w.ownedLegacy.includes(id)&&w.purchases[id]?.kind!=='furniture')||location.split('/').length!==2||!w.rooms.includes(location.split('/')[0])||!safeId(location.split('/')[1]))throw Error('INVALID_PLACEMENT');}
 if(new Set(Object.values(w.placements)).size!==Object.values(w.placements).length)throw Error('DUPLICATE_PLACEMENT');balance(w);
 if(w.loginClaims)validateLogin(w.loginClaims);
 if(w.care)validateCare(w.care);
 if(w.rareDays){if(!dict(w.rareDays))throw Error('INVALID_RARE_DAYS');for(const [day,n] of Object.entries(w.rareDays)){if(!validDate(day)||n!==1||!['easy','standard','hard'].some(level=>[0,1,2].every(slot=>Object.hasOwn(w.dailyClaims,`${day}:${level}:${slot}`))))throw Error('INVALID_RARE_DAY');}}
 if(rareBalance(w)<0)throw Error('INVALID_RARE_BALANCE');
}
export function parseWorld(raw       )      {const w=JSON.parse(raw);validateWorld(w);return w;}
function award(base       ,policy           ){if(!safeId(policy.id)||!Number.isInteger(policy.numerator)||!Number.isInteger(policy.denominator)||policy.denominator<1||policy.numerator<policy.denominator||policy.numerator>policy.denominator*10)throw Error('INVALID_POLICY');return {amount:Math.floor(base*policy.numerator/policy.denominator),policy:policy.id};}
function changed(w      ){w.revision++;return w;}
export function openDay(w      ,date       ,catalog        )      {if(!validDate(date))throw Error('INVALID_DATE');if(w.days[date])return w;const next=clone(w);next.days[date]=createDaily(date,catalog);next.highestDate=next.highestDate>date?next.highestDate:date;return changed(next);}
export function saveDailyGame(w      ,id       ,game     )      {const date=id.slice(0,10),p=w.days[date]?.puzzles.find(p=>p.id===id);if(!p||!restore(JSON.stringify(game))||game.seed!==p.seed||game.stage!==p.game.stage||signature(game.board)!==signature(p.game.board))throw Error('INVALID_DAILY_GAME');if(w.dailyClaims[id])return w;const next=clone(w);next.days[date].puzzles.find(p=>p.id===id) .game=clone(game);return changed(next);}
export function completeDaily(w      ,id       ,game     ,policy=FREE_POLICY)      {if(w.dailyClaims[id])return w;if(!won(game))throw Error('NOT_COMPLETE');const next=saveDailyGame(w,id,game),p=next.days[id.slice(0,10)].puzzles.find(p=>p.id===id) ;p.game.history=[];next.dailyClaims[id]=award(TEST_BALANCE.daily[p.level],policy);if([0,1,2].every(slot=>Object.hasOwn(next.dailyClaims,`${p.date}:${p.level}:${slot}`))){next.rareDays??={};next.rareDays[p.date]=1;}return next;}
export function completeNormal(w      ,game     ,unlockedLegacy       ,policy=FREE_POLICY)      {if(!restore(JSON.stringify(game))||!won(game))throw Error('NOT_COMPLETE');const id=`${game.stage}:${game.seed}`;const next=clone(w);let dirty=false;if(!Object.hasOwn(next.normalClaims,id)){next.normalClaims[id]=award(TEST_BALANCE.normal,policy);dirty=true;}for(let i=0;i<Math.min(12,Math.max(0,Math.floor(unlockedLegacy)));i++){const item=`legacy-${i}`;if(!next.ownedLegacy.includes(item)){next.ownedLegacy.push(item);next.placements[`main/${LEGACY_SLOTS[i]}`]??=item;dirty=true;}}return dirty?changed(next):w;}
export function buy(w      ,itemId       ,catalog            )      {
 if(Object.hasOwn(w.purchases,itemId))return w;const item=catalog.items.find(i=>i.id===itemId);
 if(!item||!safeId(item.id)||!safeInt(item.price)||item.price===0||!['furniture','expansion'].includes(item.kind))throw Error('UNKNOWN_ITEM');
 if(item.requires?.some(id=>!w.rooms.includes(id)&&!Object.hasOwn(w.purchases,id)))throw Error('REQUIRES_UNLOCK');if(balance(w)<item.price)throw Error('INSUFFICIENT_COINS');
 if(item.kind==='expansion'&&(!item.roomId||!safeId(item.roomId)||w.rooms.includes(item.roomId)||!catalog.rooms.some(r=>r.id===item.roomId)))throw Error('INVALID_EXPANSION');
 const next=clone(w);next.purchases[item.id]={price:item.price,kind:item.kind};if(item.kind==='expansion')next.rooms.push(item.roomId );return changed(next);
}
export function place(w      ,itemId       ,roomId       ,slot       ,catalog            )      {
 const legacy=w.ownedLegacy.includes(itemId),item=catalog.items.find(i=>i.id===itemId);
 if(!legacy&&w.purchases[itemId]?.kind!=='furniture')throw Error('NOT_OWNED');
 if(!w.rooms.includes(roomId)||!catalog.rooms.find(r=>r.id===roomId)?.slots.includes(slot))throw Error('INVALID_SLOT');
 if(item?.slots&&!item.slots.includes(slot))throw Error('INCOMPATIBLE_SLOT');const key=`${roomId}/${slot}`;if(w.placements[key]===itemId)return w;
 const next=clone(w);for(const [k,v] of Object.entries(next.placements))if(v===itemId)delete next.placements[k];next.placements[key]=itemId;return changed(next);
}
export function removePlacement(w      ,roomId       ,slot       )      {const key=`${roomId}/${slot}`;if(!Object.hasOwn(w.placements,key))return w;const next=clone(w);delete next.placements[key];return changed(next);}
export function rareBalance(w      ){return Object.keys(w.rareDays||{}).length-(w.care?.revivals.reduce((n,r)=>n+r.cost,0)||0);}
export function tickResident(w      ,now       )      {const next=clone(w);next.care=w.care?advanceCare(w.care,now):initialCare(now);return changed(next);}
export function tendResident(w      ,kind               ,now       )      {const next=clone(w);next.care=careAction(w.care||initialCare(now),kind,now);return changed(next);}
export function restResident(w      ,paused        ,now       )      {const next=clone(w);next.care=pauseCare(w.care||initialCare(now),paused,now);return changed(next);}
export function welcomeResident(w      ,now       )      {const next=clone(w);next.care=welcomeCare(w.care||initialCare(now),now);return changed(next);}
export function returnResident(w      ,id       ,now       )      {const next=clone(w);next.care=reviveCare(w.care||initialCare(now),id,rareBalance(w),now);return changed(next);}

export function receiveLogin(w      ,date       )      {const claims=claimLogin(w.loginClaims,date);if(claims===w.loginClaims||!Object.keys(claims).length)return w;const next=clone(w);next.loginClaims=claims;return changed(next);}
