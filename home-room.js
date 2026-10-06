import {ROOMS,SHOP} from './home-catalog.js?v=77f9ea4e4a11669e';
import {furnitureArt} from './art.js?v=77f9ea4e4a11669e';
import {resident} from './resident.js?v=77f9ea4e4a11669e';
export const project=(x,y,z=0)=>[350+.86*(x-y),250+.43*(x+y)-z];
const pt=(x,y,z=0)=>project(x,y,z).map(n=>n.toFixed(2)).join(',');
const poly=(points,fill,stroke='#91745C',width=1.5)=>`<polygon points="${points.map(p=>pt(...p)).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
const line=(a,b,color='#A48463',width=2)=>`<path d="M${pt(...a)}L${pt(...b)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
function box(x,y,w,d,h,z=0,colors=['#E4C397','#C39A70','#AD835E']){return poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],colors[1])+poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],colors[2])+poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],colors[0]);}
function ellipse(x,y,rx,ry,z,fill,stroke='none'){const [px,py]=project(x,y,z);return `<ellipse cx="${px}" cy="${py}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;}
function shadow(x,y,w,d){return poly([[x+8,y+5,0],[x+w+16,y+5,0],[x+w+18,y+d+12,0],[x+10,y+d+12,0]],'#745A4226','none');}
const POS={rug:[130,205],table:[139,151],seat:[25,125],light:[15,86],plant:[295,195],snack:[281,280],guest:[28,242],shelf:[18,20],feature:[209,26],portrait:[0,142],phone:[0,234],flags:[277,0],crown:[61,31]};
const dims=id=>id==='reading-nook'?[109,91]:id==='glow-nest'?[112,109]:id==='garden-bench'?[121,65]:id==='seed-cushion'?[65,58]:id==='tea-tray'?[66,48]:({'legacy-0':[123,100],'legacy-1':[75,59],'legacy-2':[101,72],'legacy-3':[22,22],'legacy-4':[29,29],'legacy-5':[44,39],'legacy-6':[38,34],'legacy-10':[107,31]}[id]||[25,25]);
function chair(x,y,w,d,green=true){const c=green?['#B9D0BC','#8DAE9F','#729486']:['#E1B599','#BF8D73','#A5725E'];return box(x+8,y+8,w-16,d-16,17,0,['#AC8C6A','#9D7C5E','#876950'])+box(x,y,w,12,72,15,c)+box(x+10,y+12,w-20,d-16,13,23,c)+box(x,y+12,13,d-12,34,15,c)+box(x+w-13,y+12,13,d-12,34,15,c);}
function shelf(x,y,w=107){let s=box(x,y,w,6,112,0,['#EAD3AC','#C4A079','#B5906D']);for(const xx of [x,x+w-7])s+=box(xx,y,7,31,112);for(const z of [9,48,86,107])s+=box(x,y,w,31,5,z);for(let i=0;i<8;i++){const color=['#A1BDB1','#CFAB85','#BE9183'][i%3];s+=box(x+13+i*10,y+8,7,18,20+(i%3)*4,54,[color,color,'#8F7F6A']);}for(let i=0;i<4;i++)s+=box(x+16+i*20,y+7,15,19,20,14,['#E8C279','#D7AA66','#AF8756']);return s;}
function wallIcon(id,x,y,z){const [px,py]=project(x,y,z),left=x===0;const content=furnitureArt(Number(id.slice(7))).replace(/^<svg[^>]*>|<\/svg>$/g,'');return `<g transform="translate(${px} ${py}) matrix(.86 ${left?-.43:.43} 0 1 0 0)"><path d="M-24 3h48v45h-48Z" fill="#78634E22" transform="translate(4 4)"/><svg x="-24" y="0" width="48" height="48" viewBox="0 0 120 120">${content}</svg></g>`;}
function furniture(id,x,y){const [w,d]=dims(id);let s=shadow(x,y,w,d);
 if(id==='legacy-0')return poly([[x,y,1],[x+w,y,1],[x+w,y+d,1],[x,y+d,1]],'#D6AAA0','#F6E8D5',5)+poly([[x+8,y+8,1],[x+w-8,y+8,1],[x+w-8,y+d-8,1],[x+8,y+d-8,1]],'#DBB8AE','#B9867E',1);
 if(id==='legacy-2'||id==='legacy-6'||id==='garden-bench')return s+chair(x,y,w,d,id!=='legacy-6');
 if(id==='seed-cushion')return s+box(x,y,w,d,14,0,['#F1D596','#D5B16D','#BF9A5A'])+ellipse(x+w/2,y+d/2,29,14,15,'#F5DDA1','#C8A76A');
 if(id==='legacy-1'||id==='tea-tray'){for(const [xx,yy] of [[x+5,y+5],[x+w-10,y+5],[x+5,y+d-10],[x+w-10,y+d-10]])s+=box(xx,yy,5,5,37);s+=box(x,y,w,d,6,37);s+=ellipse(x+w*.45,y+d*.5,15,7,45,'#F7E7C3','#B58F62');s+=box(x+w*.45,y+d*.45,12,12,10,44,['#DCE6D5','#B4CABC','#94AEA2']);s+=ellipse(x+w*.72,y+d*.35,7,4,45,'#DDA765');return s;}
 if(id==='legacy-10')return s+shelf(x,y,w);
 if(id==='reading-nook')return s+shelf(x,y,w)+chair(x+11,y+36,w-22,55,true);
 if(id==='glow-nest'){s+=box(x,y,w,d,73,0,['#D9AD9C','#B78A7B','#986C63']);s+=poly([[x-5,y-5,78],[x+w/2,y-5,122],[x+w+5,y-5,78],[x+w+5,y+d+5,78],[x+w/2,y+d+5,122],[x-5,y+d+5,78]],'#D8B49B');s+=poly([[x-5,y-5,78],[x+w/2,y-5,122],[x+w/2,y+d+5,122],[x-5,y+d+5,78]],'#ECD0B2');s+=poly([[x+18,y+d+1,0],[x+w-18,y+d+1,0],[x+w-18,y+d+1,57],[x+w/2,y+d+1,69],[x+18,y+d+1,57]],'#77645F');s+=ellipse(x+w/2,y+d*.77,33,14,9,'#D7C1A5');const [lx,ly]=project(x+w/2,y+d+2,62);s+=`<circle cx="${lx}" cy="${ly}" r="22" fill="#FFE8A644"/><circle cx="${lx}" cy="${ly}" r="5" fill="#FFE29A"/>`;return s;}
 if(id==='legacy-3'){s+=ellipse(x+11,y+11,19,8,1,'#A38B6D');s+=line([x+11,y+11,3],[x+11,y+11,94],'#8F795E',4);s+=box(x-7,y-7,36,36,23,85,['#E5D7AA','#CAB992','#B9AA82']);return s;}
 if(id==='legacy-4'){s+=box(x,y,w,d,25,0,['#C4AA86','#AE8C70','#8E7159']);for(let i=0;i<5;i++){const [px,py]=project(x+14+(i-2)*6,y+14+(i%2)*5,28+i*6);s+=`<ellipse cx="${px}" cy="${py}" rx="9" ry="17" transform="rotate(${(i-2)*19} ${px} ${py})" fill="${i%2?'#8FA588':'#ABC09A'}" stroke="#728B71"/>`;}return s;}
 if(id==='legacy-5'){s+=box(x,y,w,d,44,0,['#B5CBC7','#8CA7A5','#72918F']);s+=poly([[x+7,y+d+1,8],[x+w-7,y+d+1,8],[x+w-7,y+d+1,35],[x+7,y+d+1,35]],'#AFBCAD');s+=line([x+23,y+d+2,18],[x+23,y+d+2,28],'#637F7C',3);return s;}
 if(id==='legacy-11'){const [px,py]=project(x,y,120);return `<path d="M${px-12} ${py}l-3-14 10 6 5-10 5 10 10-6-3 14Z" fill="#E4C478" stroke="#AA8B55" stroke-width="1.5"/>`;}
 return s;
}
export function homeScene(world,roomId='main',preview=null){
 const room=ROOMS.find(r=>r.id===roomId)||ROOMS[0],garden=roomId==='garden',placements={...world.placements};if(preview?.kind==='furniture')placements[`${roomId}/${preview.slots[0]}`]=preview.id;
 const furnishings=room.slots.map(slot=>({slot,id:placements[`${roomId}/${slot}`],p:POS[slot]})).filter(f=>f.id&&f.p);
 const active=furnishings.find(f=>f.slot==='feature')||furnishings.find(f=>SHOP.items.some(i=>i.id===f.id&&i.action))||furnishings.find(f=>f.id==='legacy-2')||furnishings.find(f=>f.id==='legacy-1');
 let action=active?(SHOP.items.find(i=>i.id===active.id)?.action||(active.id==='legacy-2'?'sit':'tea')):'idle';
 const ham=world.care?.active?world.care.hams[world.care.active]:null;
 if(world.care&&!ham)action='ghost';else if(world.care?.paused&&world.care.enabled!==false)action='sleep';else if(ham?.state==='sulking')action='sulk';
 const [x,y]=active?.p||[170,200],[w,d]=dims(active?.id||'none');let use=[x+w/2,y+d*.65,active?.id==='reading-nook'?35:active?.id==='glow-nest'?8:['sit','rest','garden'].includes(action)?36:0];
 if(active?.id==='glow-nest')use=[x+w/2,y+d+2,5];
 if(action==='tea')use=[x+w/2,y+d+25,0];if(!active)use=[180,260,0];
 const route={action,item:active?.id||null,start:[180,302,0],approach:[use[0],y+d+25,0],use,preview:!!preview,paused:world.care?.paused&&world.care.enabled!==false,contacts:active&&['sit','read','rest','garden'].includes(action)?[project(x+w*.2,y+d*.75,active.id==='reading-nook'?49:48),project(x+w*.8,y+d*.75,active.id==='reading-nook'?49:48)]:null};
 let walls=poly([[0,0,0],[0,330,0],[0,330,210],[0,0,210]],garden?'#DCE8DA':'#DDC6A5')+poly([[0,0,0],[330,0,0],[330,0,210],[0,0,210]],garden?'#E7EEE0':'#F2E2C4');
 walls+=line([0,330,211],[0,0,211],'#AD9475',7)+line([0,0,211],[330,0,211],'#AD9475',7)+line([0,0,4],[330,0,4],'#B59A78',8)+line([0,0,4],[0,330,4],'#B59A78',8);
 // Window and mounted decorations share the exact wall projection.
 walls+=poly([[140,0,73],[238,0,73],[238,0,177],[140,0,177]],'#C4DCCC','#AC9676',5)+line([189,0,76],[189,0,174],'#FCF3DE',4)+line([142,0,125],[237,0,125],'#FCF3DE',4)+box(135,0,110,12,5,70);
 let floor=poly([[0,0,0],[330,0,0],[330,330,0],[0,330,0]],'#D9BE9B')+poly([[0,330,0],[330,330,0],[330,330,-13],[0,330,-13]],'#B39370')+poly([[330,0,0],[330,330,0],[330,330,-13],[330,0,-13]],'#BFA07B');
 for(let n=30;n<330;n+=30)floor+=line([0,n,1],[330,n,1],'#B79B7855',1);
 for(let row=0;row<11;row++)for(let col=0;col<4;col++){const xx=col*85+(row%2)*42;if(xx<330)floor+=line([xx,row*30,1],[xx,(row+1)*30,1],'#B79B7844',1);}
 let wallItems='',objects=[];
 for(const f of furnishings){const [fx,fy]=f.p;if(['portrait','phone','flags'].includes(f.slot)){wallItems+=wallIcon(f.id,fx,fy,f.slot==='flags'?184:150);continue;}objects.push({...f,depth:f.slot==='rug'?-1:fx+fy+(dims(f.id)[1]),markup:`<g data-furniture="${f.id}" data-slot="${f.slot}" data-depth="${f.slot==='rug'?-1:fx+fy+dims(f.id)[1]}">${furniture(f.id,fx,fy)}</g>`});}
 // Wall items retain the same ownership identifiers as all floor furniture.
 wallItems=furnishings.filter(f=>['portrait','phone','flags'].includes(f.slot)).map(f=>`<g data-furniture="${f.id}" data-slot="${f.slot}">${wallIcon(f.id,...f.p,f.slot==='flags'?184:150)}</g>`).join('');
 const ghost=resident('ghost').replace(/^<svg[^>]*>|<\/svg>$/g,'');const sky=Object.values(world.care?.hams||{}).filter(h=>h.state==='ghost').slice(-5).map((h,i)=>`<svg class="sky-ghost" x="${40+i*48}" y="22" width="43" height="43" viewBox="0 0 120 120">${ghost}</svg>`).join('');
 return `<svg class="home-scene" viewBox="0 0 700 570" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${room.name}。ハムの様子：${action}" data-action="${action}" data-route='${JSON.stringify(route)}'><ellipse cx="350" cy="501" rx="302" ry="57" fill="#62796712"/>${walls}${wallItems}${floor}<g class="room-objects">${objects.sort((a,b)=>a.depth-b.depth).map(o=>o.markup).join('')}<g class="room-actor" data-phase="arrive"></g></g>${sky}</svg>`;
}
