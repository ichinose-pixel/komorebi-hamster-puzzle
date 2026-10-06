export const CARE_TIMING={sulk:48*60*60*1000,goodbye:14*24*60*60*1000,reviveCost:3}         ;
                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                            
const clone=   (v  )  =>JSON.parse(JSON.stringify(v));
const integer=(n        )=>Number.isSafeInteger(n)&&Number(n)>=0;
function time(now       ){if(!integer(now))throw Error('INVALID_CARE_TIME');}
function newHam(id       ,clock       ,n       )    {return {id,name:`ハム ${n}`,personality:(['collector','dreamer','host']         )[(n-1)%3],born:clock,fed:clock,cleaned:clock,meals:0,cleanups:0,returns:0,state:'well'};}
export function initialCare(now       )     {time(now);return {version:1,clock:0,observed:now,paused:true,enabled:false,active:'ham-1',nextId:2,hams:{'ham-1':newHam('ham-1',0,1)},memories:[],revivals:[]};}
export function advanceCare(c     ,now       )     {
 time(now);const next=clone(c),delta=Math.max(0,now-next.observed);next.observed=Math.max(now,next.observed);
 if(next.active&&!next.paused){next.clock+=delta;const ham=next.hams[next.active],neglect=Math.max(next.clock-ham.fed,next.clock-ham.cleaned);
  if(neglect>=CARE_TIMING.goodbye){ham.state='ghost';const key=`${ham.id}:${ham.returns}`;if(!next.memories.some(m=>m.key===key))next.memories.push({key,id:ham.id,at:next.clock});next.active=null;}
  else ham.state=neglect>=CARE_TIMING.sulk?'sulking':'well';
 }
 return next;
}
export function careAction(c     ,kind               ,now       )     {if(!['feed','clean'].includes(kind))throw Error('INVALID_CARE_ACTION');const next=advanceCare(c,now);if(!next.active)throw Error('NO_RESIDENT');if(next.paused)throw Error('CARE_PAUSED');const h=next.hams[next.active];if(kind==='feed'){h.fed=next.clock;h.meals++;}else{h.cleaned=next.clock;h.cleanups++;}h.state=Math.max(next.clock-h.fed,next.clock-h.cleaned)>=CARE_TIMING.sulk?'sulking':'well';next.lastAction={kind,at:next.clock};return next;}
export function pauseCare(c     ,paused        ,now       )     {const next=advanceCare(c,now);next.paused=paused;if(!paused)next.enabled=true;return next;}
export function welcomeCare(c     ,now       )     {const next=advanceCare(c,now);if(next.active)return next;const number=next.nextId++,id=`ham-${number}`;next.hams[id]=newHam(id,next.clock,number);next.active=id;next.paused=false;next.lastAction={kind:'welcome',at:next.clock};return next;}
export function reviveCare(c     ,id       ,available       ,now       )     {const next=advanceCare(c,now);if(next.active)throw Error('RESIDENT_PRESENT');const h=next.hams[id];if(!h||h.state!=='ghost')throw Error('NOT_IN_SKY');if(available<CARE_TIMING.reviveCost)throw Error('NEED_STARLIGHT');h.returns++;next.revivals.push({key:`${id}:return:${h.returns}`,id,cost:CARE_TIMING.reviveCost});h.state='well';h.fed=next.clock;h.cleaned=next.clock;next.active=id;next.paused=false;next.lastAction={kind:'revive',at:next.clock};return next;}
export function validateCare(c     )     {
 if(c?.version!==1||![c.clock,c.observed,c.nextId].every(integer)||c.nextId<2||typeof c.paused!=='boolean'||!c.hams||typeof c.hams!=='object'||Array.isArray(c.hams)||!Array.isArray(c.memories)||!Array.isArray(c.revivals))throw Error('INVALID_CARE');
 let living=0;for(const [id,h] of Object.entries(c.hams)){if(!/^ham-[1-9]\d*$/.test(id)||id!==h.id||typeof h.name!=='string'||h.name.length>30||!['collector','dreamer','host'].includes(h.personality)||![h.born,h.fed,h.cleaned,h.meals,h.cleanups,h.returns].every(integer)||[h.born,h.fed,h.cleaned].some(n=>n>c.clock)||!['well','sulking','ghost'].includes(h.state))throw Error('INVALID_HAM');if(h.state!=='ghost'){living++;if(c.active!==id)throw Error('INVALID_ACTIVE_HAM');}}
 if(living!==(c.active===null?0:1)||c.active!==null&&!c.hams[c.active])throw Error('INVALID_ACTIVE_HAM');
 for(const m of c.memories)if(!c.hams[m.id]||!integer(m.at)||m.at>c.clock||typeof m.key!=='string')throw Error('INVALID_MEMORY');
 for(const r of c.revivals)if(!c.hams[r.id]||r.cost!==CARE_TIMING.reviveCost||typeof r.key!=='string')throw Error('INVALID_REVIVAL');
 if(new Set(c.memories.map(m=>m.key)).size!==c.memories.length||new Set(c.revivals.map(m=>m.key)).size!==c.revivals.length)throw Error('DUPLICATE_CARE_EVENT');
 if(c.lastAction&&(!['feed','clean','welcome','revive'].includes(c.lastAction.kind)||!integer(c.lastAction.at)||c.lastAction.at>c.clock))throw Error('INVALID_CARE_ACTION');
}
