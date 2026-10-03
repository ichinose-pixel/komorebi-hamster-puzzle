// Finite furniture, unlimited free celebrations; migration never removes earned furniture.
export const milestones=[1,5,10,15,20,25,30,36,42,48,54,60];
export function roomCount(collection){const earned=milestones.filter(s=>s<=collection.completed.length).length;return Math.max(collection.legacyFurniture||0,earned);}
export function migrateCollection(old){const completed=Array.isArray(old?.completed)?old.completed.filter(x=>typeof x==='string').slice(-10000):[];return {version:2,completed,legacyFurniture:old?.version===2?Math.min(12,Math.max(0,Number(old.legacyFurniture)||0)):Math.min(12,completed.length),revealed:old?.revealed||''};}
export function rewardFor(count){const variant=count%4===0?2:count%3===0?1:0;return {variant,title:['きみ、なかなかやるね。','拍手、もうひと声。','本日の主役、ぼく。'][variant],quote:['解いたのはきみ。どや顔はぼく。','うんうん。その拍手、受け取った。','王冠は一個？ じゃあ、ぼくが。'][variant]};}
