// Empty: wait briefly for double tap, otherwise exclude. Occupied: erase once,
// swallowing the second tap of the same physical double tap. No timer may survive a drag.
export function tapController({getMark,act,preview=()=>{},clock=()=>performance.now(),schedule=setTimeout,cancel=clearTimeout,delay=300}){
 let pending=null,erased=null;
 function reset(){if(pending){cancel(pending.timer);preview(pending.cell,false);pending=null;}erased=null;}
 function tap(cell){const now=clock();if(erased&&erased.cell===cell&&now-erased.at<delay){erased=null;return;}
  erased=null;
  if(pending){const old=pending;cancel(old.timer);pending=null;preview(old.cell,false);if(old.cell===cell&&now-old.at<=delay){act(cell,'double');return;}act(old.cell,'single');}
  if(getMark(cell)!==0){act(cell,'single');erased={cell,at:now};return;}
  const token={cell,at:now,timer:null};pending=token;preview(cell,true);token.timer=schedule(()=>{if(pending!==token)return;pending=null;preview(cell,false);act(cell,'single');},delay);
 }
 return {tap,reset};
}
