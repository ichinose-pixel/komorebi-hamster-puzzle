import {WORLD_KEY,migrateWorld,parseWorld,validateWorld} from './economy.js?v=be6f9a6a74417ecf';
// A whole world snapshot is committed once. Callers never publish a balance before save succeeds.
// Web Locks serialize tabs. A host without Web Locks must enforce a single active writer.
export function createWorldStore(storage,{lock=globalThis.navigator?.locks,key=WORLD_KEY}={}){
 let tail=Promise.resolve();
 async function run(update){
  const raw=storage.getItem(key);const before=raw===null?migrateWorld(JSON.parse(storage.getItem('komorebi-v1-collection-v3')||'null')):parseWorld(raw);
  const after=await update(before);validateWorld(after);
  if(raw!==null&&after===before)return after;
  if(storage.getItem(key)!==raw)throw Error('CONCURRENT_WORLD_CHANGE');
  if(storage.setItemAtomic)await storage.setItemAtomic(key,JSON.stringify(after));
  else {if(storage.flush)throw Error('NATIVE_ATOMIC_STORAGE_REQUIRED');storage.setItem(key,JSON.stringify(after));}return after;
 }
 return {transact(update){const work=()=>lock?lock.request(key,()=>run(update)):run(update);const result=tail.then(work);tail=result.catch(()=>{});return result;},flush(){return tail;},read(){const raw=storage.getItem(key);return raw===null?null:parseWorld(raw);}};
}
