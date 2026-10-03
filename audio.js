// Original score "A seat for me": 16 bars in C, 104 BPM. Local synthesis, no external music/samples.
const engines=[];export const audioDebug=()=>engines.map(e=>e.inspect());
const bpm=104,stepSeconds=60/bpm/2,loopSteps=128;
const melody=[
[76,0,79,81,79,0,76,74],[72,0,76,79,76,0,74,72],
[74,0,77,81,79,77,76,74],[71,0,74,79,0,77,76,74],
[76,0,79,84,83,81,79,76],[81,0,79,76,74,0,72,0],
[74,77,81,0,79,77,74,71],[72,0,0,0,0,0,74,75],
[76,79,84,0,83,81,79,76],[72,76,79,0,81,79,76,72],
[77,0,81,84,83,81,79,77],[76,0,79,83,81,79,76,74],
[74,77,81,0,79,77,76,74],[71,74,79,0,81,79,77,74],
[76,0,79,84,83,81,79,76],[74,0,71,0,67,0,0,0]];
const chords=[[48,55,60,64,71],[45,52,57,60,64],[50,57,60,65,69],[43,50,59,62,65],[48,55,60,64,67],[45,52,57,60,64],[50,57,60,65,69],[43,50,59,62,65],[48,55,60,64,71],[45,52,57,60,64],[41,48,57,60,64],[40,47,55,59,62],[50,57,60,65,69],[43,50,59,62,65],[48,55,60,64,67],[43,50,59,62,65]];
const hz=m=>440*2**((m-69)/12),noiseCache=new WeakMap();
function note(ctx,bus,t,midi,duration,volume,kind='bell',active){
 const out=ctx.createGain(),osc=ctx.createOscillator();osc.frequency.value=hz(midi);osc.type=kind==='bass'?'triangle':'sine';
 const upper=kind==='bell'?ctx.createOscillator():null,upperGain=upper?ctx.createGain():null;
 if(upper){upper.frequency.value=hz(midi)*2;upperGain.gain.value=.12;upper.connect(upperGain);upperGain.connect(out);}
 const attack=kind==='pad'?.045:.008;out.gain.setValueAtTime(0,t);out.gain.linearRampToValueAtTime(volume,t+attack);out.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(out);out.connect(bus);osc.start(t);osc.stop(t+duration+.03);if(upper){upper.start(t);upper.stop(t+duration+.03);}
 const voice={stop(){try{osc.stop();upper?.stop();}catch{}}};active?.add(voice);osc.onended=()=>{active?.delete(voice);osc.disconnect();upper?.disconnect();upperGain?.disconnect();out.disconnect();};
}
function drum(ctx,bus,t,type,volume,active){
 if(type==='kick'){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(115,t);o.frequency.exponentialRampToValueAtTime(45,t+.12);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+.16);o.connect(g);g.connect(bus);o.start(t);o.stop(t+.18);const voice={stop(){try{o.stop();}catch{}}};active?.add(voice);o.onended=()=>{active?.delete(voice);o.disconnect();g.disconnect();};return;}
 let buffer=noiseCache.get(ctx);if(!buffer){buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.2),ctx.sampleRate);const d=buffer.getChannelData(0);let s=123456789;for(let i=0;i<d.length;i++){s=(Math.imul(s,1664525)+1013904223)>>>0;d[i]=(s/4294967296*2-1);}noiseCache.set(ctx,buffer);}
 const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();source.buffer=buffer;filter.type='highpass';filter.frequency.value=type==='hat'?6500:1700;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+(type==='hat'?.045:.12));source.connect(filter);filter.connect(g);g.connect(bus);source.start(t);source.stop(t+.15);const voice={stop(){try{source.stop();}catch{}}};active?.add(voice);source.onended=()=>{active?.delete(voice);source.disconnect();filter.disconnect();g.disconnect();};
}
function musicStep(ctx,bus,t,index,active){const step=index%loopSteps,bar=Math.floor(step/8),eighth=step%8,chord=chords[bar],pitch=melody[bar][eighth];t+=eighth%2?.014:0;
 if(pitch)note(ctx,bus,t,pitch,.42,eighth%2?.19:.24,'bell',active);
 if(eighth===0||eighth===4)note(ctx,bus,t,chord[eighth===0?0:1],.44,.24,'bass',active);
 if(eighth===2||eighth===6)chord.slice(2).forEach((m,k)=>note(ctx,bus,t+k*.009,m,.30,.052,'pad',active));
 if(eighth===0||eighth===4)drum(ctx,bus,t,'kick',.10,active);if(eighth===2||eighth===6)drum(ctx,bus,t,'brush',.06,active);if(eighth%2===1)drum(ctx,bus,t,'hat',.035,active);
}
function effectNotes(ctx,bus,t,kind,active){
 if(kind==='mark'){note(ctx,bus,t,72,.065,.14,'bell',active);return;}
 if(kind==='place'){note(ctx,bus,t,84,.16,.27,'bell',active);note(ctx,bus,t+.03,91,.1,.09,'bell',active);return;}
 if(kind==='remove'){note(ctx,bus,t,76,.09,.19,'bell',active);note(ctx,bus,t+.05,69,.12,.15,'bell',active);return;}
 if(kind==='announce'){[72,76,79].forEach((m,i)=>note(ctx,bus,t+i*.08,m,.2,.18,'bell',active));return;}
 if(kind.startsWith('rise')){const offset=Number(kind.at(-1))-1;[60,64,67].forEach((m,i)=>note(ctx,bus,t+i*.065,m+offset*5,.22,.17,'bell',active));drum(ctx,bus,t,'brush',.035,active);return;}
 if(kind==='pose'){[84,91,96].forEach((m,i)=>note(ctx,bus,t+i*.09,m,.38,.16,'bell',active));return;}
 if(kind==='clear'){[60,64,67,72,76,79].forEach((m,i)=>note(ctx,bus,t+i*.145,m,.17,.18+i*.018,'bell',active));drum(ctx,bus,t+.78,'brush',.12,active);return;}
 drum(ctx,bus,t,'kick',.3,active);[48,60,64,67].forEach(m=>note(ctx,bus,t,m,.8,.13,'pad',active));[84,88,91,96,91,96].forEach((m,i)=>note(ctx,bus,t+[0,.12,.24,.42,.60,.78][i],m,.46,.24,'bell',active));[0,.24,.48,.72].forEach(dt=>drum(ctx,bus,t+dt,'brush',.11,active));
}
function mixer(ctx){const music=ctx.createGain(),fx=ctx.createGain(),master=ctx.createGain(),compressor=ctx.createDynamicsCompressor();master.gain.value=.8;compressor.threshold.value=-14;compressor.ratio.value=3;compressor.attack.value=.008;compressor.release.value=.16;music.connect(master);fx.connect(master);const room=ctx.createConvolver(),send=ctx.createGain(),tail=ctx.createBuffer(2,Math.floor(ctx.sampleRate*.42),ctx.sampleRate);let seed=9137;for(let channel=0;channel<2;channel++){const d=tail.getChannelData(channel);for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=(seed/4294967296*2-1)*Math.exp(-i/(ctx.sampleRate*.075))*(i>ctx.sampleRate*.013?1:0);}}room.buffer=tail;send.gain.value=.13;music.connect(room);fx.connect(room);room.connect(send);send.connect(master);master.connect(compressor);compressor.connect(ctx.destination);return {music,fx};}
export function createAudio(storageKey){
 let settings={bgm:0,se:0};try{const v=JSON.parse(localStorage.getItem(storageKey+'-audio-v1'));if(v){settings.bgm=Math.max(0,Math.min(1,Number(v.bgm)||0));settings.se=Math.max(0,Math.min(1,Number(v.se)||0));}else if(JSON.parse(localStorage.getItem(storageKey+'-sound'))===true)settings.se=.4;}catch{}
 let ctx=null,music=null,fx=null,timer=null,desired=true,step=0,next=0,effects=0,last=-1,lastKind='',epoch=0,pending=null,armed=false,feedbackPending=false,status='off',initialGesture=settings.bgm>0||settings.se>0;
 const active=new Set(),celebration=new Set(),listeners=new Set(),enabled=()=>settings.bgm>0||settings.se>0;
 const notify=()=>listeners.forEach(fn=>fn(status));
 function persist(){try{localStorage.setItem(storageKey+'-audio-v1',JSON.stringify(settings));}catch{}}
 function stopVoices(set){for(const v of set)v.stop();set.clear();}function cancelCelebration(){stopVoices(celebration);}
 function stop(){if(timer!==null){clearInterval(timer);timer=null;}stopVoices(active);cancelCelebration();next=ctx?.currentTime||0;}
 function gains(){if(!ctx)return;const t=ctx.currentTime;music.gain.cancelScheduledValues(t);music.gain.setTargetAtTime(armed&&desired?settings.bgm:0,t,.035);fx.gain.setTargetAtTime(armed?settings.se:0,t,.015);}
 function tick(){if(!armed||!ctx||ctx.state!=='running'||document.hidden||!enabled())return;if(next<ctx.currentTime-.2)next=ctx.currentTime+.01;while(next<ctx.currentTime+.14){if(desired&&settings.bgm>0){musicStep(ctx,music,next,step,active);step++;}next+=stepSeconds;}}
 function start(){if(!armed||!enabled()||document.hidden||ctx?.state!=='running')return;gains();if(timer===null){next=ctx.currentTime+.012;timer=setInterval(tick,70);}tick();status='playing';notify();}
 function effect(kind){if(!armed||!ctx||ctx.state!=='running'||document.hidden||settings.se===0)return;const t=ctx.currentTime;if((kind===lastKind&&t-last<.08)||active.size+celebration.size>64)return;last=t;lastKind=kind;effects++;effectNotes(ctx,fx,t+.008,kind,['clear','open','announce','rise1','rise2','rise3','pose'].includes(kind)?celebration:active);}
 function pause(reason='paused'){epoch++;pending=null;feedbackPending=false;armed=false;stop();gains();status=enabled()?reason:'off';notify();ctx?.suspend().catch(()=>{});}
 // resume() is called synchronously in the actual control's gesture handler.
 // No resource fetch, timer or await occurs before it. A generation guard rejects stale completions.
 function activate({feedback=false}={}){
  initialGesture=false;if(!enabled()){pause('off');return Promise.resolve(false);}if(document.hidden)return Promise.resolve(false);
  feedbackPending||=feedback;
  if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A){status='unsupported';notify();return Promise.resolve(false);}ctx=new A();({music,fx}=mixer(ctx));music.gain.value=0;fx.gain.value=0;ctx.addEventListener('statechange',()=>{if(!armed)return;if(ctx.state!=='running'){armed=false;stop();gains();status=enabled()?'paused':'off';notify();}else start();});}
  if(pending)return pending;
  const ticket=++epoch;status='starting';notify();let resumed;
  try{resumed=ctx.resume();}catch{status='blocked';feedbackPending=false;notify();return Promise.resolve(false);}
  const watchdog=setTimeout(()=>{if(ticket!==epoch||!pending)return;epoch++;pending=null;armed=false;feedbackPending=false;stop();gains();status='blocked';notify();ctx.suspend().catch(()=>{});},1500);
  const work=Promise.resolve(resumed).then(()=>{if(ticket!==epoch||!enabled()||document.hidden)return false;if(ctx.state!=='running'){status='blocked';feedbackPending=false;notify();return false;}armed=true;start();if(feedbackPending){feedbackPending=false;effect('place');}return true;},()=>{if(ticket===epoch){armed=false;feedbackPending=false;status='blocked';notify();}return false;}).finally(()=>{clearTimeout(watchdog);if(pending===work)pending=null;});pending=work;return work;
 }
 function set(name,value){settings[name]=Math.max(0,Math.min(1,Number(value)||0));persist();if(!enabled()){pause('off');return;}gains();if(armed)start();}
 const api={settings,set,activate,unlock:activate,effect,cancelCelebration,capsule(){cancelCelebration();effect('clear');},setScene(play){desired=play;gains();if(armed)start();},subscribe(fn){listeners.add(fn);fn(status);return()=>listeners.delete(fn);},inspect:()=>({initialized:!!ctx,state:ctx?.state||'locked',status,resumePending:!!pending,schedulerCount:timer===null?0:1,voices:active.size+celebration.size,effects,desired,settings:{...settings},score:'A seat for me',bpm,loopSeconds:loopSteps*stepSeconds})};
 status=initialGesture?'waiting':'off';
 // Persisted-on settings get one attempt on the first gesture. An explicit failure
 // is retried by the visible resume control, never by unrelated later board taps.
 const firstGesture=()=>{if(initialGesture&&enabled())activate();};document.addEventListener('pointerup',firstGesture,{passive:true});document.addEventListener('keydown',firstGesture);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else if(ctx&&enabled())activate();});window.addEventListener('pagehide',()=>pause());window.addEventListener('pageshow',()=>{if(ctx&&enabled()&&!document.hidden)activate();});engines.push(api);return api;
}

export async function renderAudioPreview(){const ctx=new OfflineAudioContext(2,44100*43,44100),{music,fx}=mixer(ctx);music.gain.value=.55;fx.gain.value=.65;for(let i=0;i<Math.ceil(43/stepSeconds);i++)musicStep(ctx,music,.02+i*stepSeconds,i);effectNotes(ctx,fx,2,'place');effectNotes(ctx,fx,3,'remove');music.gain.setValueAtTime(.55,30);music.gain.linearRampToValueAtTime(0,30.15);effectNotes(ctx,fx,30.1,'clear');effectNotes(ctx,fx,31.15,'open');music.gain.setValueAtTime(0,33);music.gain.linearRampToValueAtTime(.55,33.4);return ctx.startRendering();}
