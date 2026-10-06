import {cheekHam} from './character.js?v=09c0f56a41bdf7e7';import {project} from './home-room.js?v=09c0f56a41bdf7e7';
const inner=s=>s.replace(/^<svg[^>]*>|<\/svg>$/g,'');
export function animateHome(scene){if(!scene)return()=>{};const route=JSON.parse(scene.dataset.route),actor=scene.querySelector('.room-actor'),layer=scene.querySelector('.room-objects'),reduce=matchMedia('(prefers-reduced-motion: reduce)'),start=performance.now();let frame,lastPose='';
 const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),ease=t=>t*t*(3-2*t);
 function draw(now){if(!scene.isConnected)return;const seconds=(now-start)/1000,cycle=seconds%15;let at=route.use,phase='use',pose=route.action;
  if(route.action==='ghost'){actor.innerHTML='';return;}
  if(!reduce.matches&&!route.preview&&!route.paused&&route.action!=='sulk'){
   const corner=[route.approach[0]>200?250:120,270,0];
   if(cycle<1.8){at=mix(route.start,corner,cycle/1.8);pose='walk';phase='walk';}
   else if(cycle<3.8){at=mix(corner,route.approach,(cycle-1.8)/2);pose='walk';phase='approach';}
   else if(cycle<4.5){at=mix(route.approach,route.use,ease((cycle-3.8)/.7));pose='sit';phase='settle';}
   else if(cycle>12){at=mix(route.use,route.start,(cycle-12)/3);pose='walk';phase='return';}
  }
  const mapped=pose==='tea'?'eat':['read','garden','rest'].includes(pose)?'sit':pose==='sulk'?'idle':pose;
  if(pose!==lastPose){const prop=pose==='read'?'<path d="M82 168q25-13 48 0q24-13 48 0v39q-24-12-48 0q-25-12-48 0Z" fill="#9DBAAF" stroke="#668B7C" stroke-width="3"/><path d="M130 168v39" stroke="#F4E9C9" stroke-width="3"/>':'';actor.innerHTML=`<svg class="room-ham cheek-ham act-${mapped}" x="${mapped==='sleep'?-30:-40}" y="${mapped==='sleep'?-58:-77}" width="${mapped==='sleep'?60:80}" height="${mapped==='sleep'?62:83}" viewBox="0 0 260 270">${inner(cheekHam(mapped,'room'))}${prop}</svg>`;lastPose=pose;}
  const [px,py]=project(...at);actor.setAttribute('transform',`translate(${px},${py})`);actor.querySelector('.room-contact')?.remove();
  if(phase==='use'&&route.contacts&&mapped==='sit'){
   actor.querySelectorAll('.rig-hand').forEach(e=>e.setAttribute('visibility','hidden'));
   actor.insertAdjacentHTML('beforeend','<g class="room-contact">'+route.contacts.map(([hx,hy],i)=>'<path d="M'+(i?12:-12)+' -25 Q'+(hx-px)+' -20 '+(hx-px)+' '+(hy-py)+'" fill="none" stroke="#F8E8C6" stroke-width="5"/><ellipse cx="'+(hx-px)+'" cy="'+(hy-py)+'" rx="5" ry="2.5" fill="#EFC7AF" stroke="#95785D" stroke-width=".8"/>').join('')+'</g>');
  }
  actor.dataset.phase=phase;actor.dataset.action=pose;scene.dataset.phase=phase;
  const depth=at[0]+at[1]+16;const after=[...layer.children].find(e=>e!==actor&&Number(e.dataset.depth)>depth);if(after){if(actor.nextElementSibling!==after)layer.insertBefore(actor,after);}else if(layer.lastElementChild!==actor)layer.append(actor);
  if(reduce.matches||route.preview||route.paused||route.action==='sulk')return;
  frame=requestAnimationFrame(draw);
 }
 frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
}
