// Original procedural score and effects. No sampled music, third-party audio or network.
const engines=[];
export const audioDebug=()=>engines.map(e=>e.inspect());
const notes=[72,76,79,76,74,77,81,77,71,74,79,74,69,72,76,72];
const hz=m=>440*2**((m-69)/12);
function tone(ctx,bus,time,midi,duration,level=.06,type='sine',active=null){
 const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(hz(midi),time);g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(level,time+.016);g.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(g);g.connect(bus);o.start(time);o.stop(time+duration+.03);active?.add(o);o.onended=()=>{active?.delete(o);o.disconnect();g.disconnect();};
}
function musicBeat(ctx,bus,t,beat,active){const m=notes[beat%notes.length];if(beat%2===0)tone(ctx,bus,t,m,.68,.055,'sine',active);if(beat%4===0){tone(ctx,bus,t,m-24,1.25,.065,'sine',active);tone(ctx,bus,t,m-12,1.0,.028,'triangle',active);}}
function effectNotes(ctx,bus,t,kind,active){
 const seq=kind==='remove'?[[76,0,.09],[69,.055,.13]]:kind==='clear'?[[72,0,.17],[76,.09,.2],[79,.18,.25]]:kind==='open'?[[48,0,.14],[79,.04,.23],[84,.13,.26],[88,.23,.32],[91,.34,.5]]:[[81,0,.085]];
 seq.forEach(([m,delay,d])=>tone(ctx,bus,t+delay,m,d,kind==='open'?.11:.075,kind==='open'?'triangle':'sine',active));
}
export function createAudio(storageKey){
 let settings={bgm:0,se:0};try{const v=JSON.parse(localStorage.getItem(storageKey+'-audio-v1'));if(v&&typeof v==='object'){settings.bgm=Math.max(0,Math.min(1,Number(v.bgm)||0));settings.se=Math.max(0,Math.min(1,Number(v.se)||0));}else if(JSON.parse(localStorage.getItem(storageKey+'-sound'))===true)settings.se=.4;}catch{}
 let ctx=null,music=null,fx=null,timer=null,desired=false,beat=0,next=0,last=-1,lastKind='',duckUntil=0;const active=new Set();let effects=0;
 function persist(){try{localStorage.setItem(storageKey+'-audio-v1',JSON.stringify(settings));}catch{}}
 function stop(){if(timer!==null){clearInterval(timer);timer=null;}for(const o of active){try{o.stop();}catch{}}active.clear();next=ctx?.currentTime||0;}
 function gains(){if(!ctx)return;const t=ctx.currentTime;music.gain.cancelScheduledValues(t);music.gain.setTargetAtTime(desired&&t>=duckUntil?settings.bgm:0,t,.05);fx.gain.setTargetAtTime(settings.se,t,.025);}
 function tick(){if(!ctx||ctx.state!=='running'||document.hidden)return;gains();while(next<ctx.currentTime+.16){if(desired&&settings.bgm>0&&next>=duckUntil)musicBeat(ctx,music,next,beat,active);beat++;next+=60/88;}}
 async function unlock(){if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ctx=new A();music=ctx.createGain();fx=ctx.createGain();const master=ctx.createDynamicsCompressor();master.threshold.value=-16;master.ratio.value=4;music.connect(master);fx.connect(master);master.connect(ctx.destination);music.gain.value=0;fx.gain.value=settings.se;next=ctx.currentTime;}
  if(document.hidden)return;try{await ctx.resume();}catch{return;}if(timer===null){next=ctx.currentTime+.02;timer=setInterval(tick,100);tick();}}
 function effect(kind){if(!ctx||ctx.state!=='running'||document.hidden||settings.se===0)return;const t=ctx.currentTime;if(kind===lastKind&&t-last<.075||active.size>22)return;last=t;lastKind=kind;effects++;effectNotes(ctx,fx,t+.005,kind,active);}
 function capsule(){if(!ctx)return;duckUntil=ctx.currentTime+2.7;gains();effect('clear');}
 function set(name,value){settings[name]=Math.max(0,Math.min(1,Number(value)||0));persist();gains();}
 const api={settings,set,unlock,effect,capsule,setScene(play){desired=play;gains();},inspect:()=>({initialized:!!ctx,state:ctx?.state||'locked',schedulerCount:timer===null?0:1,voices:active.size,effects,desired,settings:{...settings}})};
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();ctx?.suspend().catch(()=>{});}else if(ctx)unlock();});
 const gesture=()=>unlock();document.addEventListener('pointerdown',gesture,{passive:true});document.addEventListener('keydown',gesture);window.addEventListener('pagehide',()=>{stop();ctx?.suspend().catch(()=>{});});window.addEventListener('pageshow',()=>{if(ctx&&!document.hidden)unlock();});engines.push(api);return api;
}
export async function renderAudioPreview(){const ctx=new OfflineAudioContext(2,44100*10,44100),music=ctx.createGain(),fx=ctx.createGain();music.gain.value=.28;fx.gain.value=.55;music.connect(ctx.destination);fx.connect(ctx.destination);for(let i=0;i<14;i++)musicBeat(ctx,music,.1+i*60/88,i);effectNotes(ctx,fx,.7,'place');effectNotes(ctx,fx,1.5,'remove');effectNotes(ctx,fx,3,'clear');music.gain.setValueAtTime(.28,4);music.gain.linearRampToValueAtTime(.025,4.15);effectNotes(ctx,fx,5.45,'open');music.gain.setValueAtTime(.025,6.2);music.gain.linearRampToValueAtTime(.28,6.9);return ctx.startRendering();}
