import {LEGACY_SLOTS} from './economy.js?v=843e60a0f442c23e';
export const SLOT_LABELS={rug:'まんなかの床',table:'お茶の場所',seat:'くつろぎ席',light:'窓辺の灯り',plant:'緑の場所',snack:'おやつ置き場',guest:'お友だち席',portrait:'壁の飾り',phone:'小さな棚',flags:'上の壁',shelf:'奥の棚',crown:'とっておきの棚',feature:'特等席'};
export const ROOMS=[{id:'main',name:'はじまりのリビング',slots:[...LEGACY_SLOTS,'feature']},{id:'annex',name:'静かな離れ',slots:['rug','seat','light','plant','feature']},{id:'garden',name:'ガラス屋根の庭',slots:['rug','table','plant','feature']}];
export const SHOP={rooms:ROOMS,items:[
 {id:'seed-cushion',name:'ひまわりのクッション',kind:'furniture',price:30,slots:['seat','guest'],action:'rest',description:'ころん、と一休み。小さな特等席。'},
 {id:'tea-tray',name:'ほっとひと息のティーセット',kind:'furniture',price:90,slots:['table','snack'],action:'tea',description:'湯気のそばで、おやつをひと口。'},
 {id:'reading-nook',name:'本の森の読書席',kind:'furniture',price:270,slots:['feature'],action:'read',description:'木の本棚とゆったりした椅子。ハムが本を開きます。'},
 {id:'glow-nest',name:'月あかりの寝床',kind:'furniture',price:360,slots:['feature'],action:'sleep',description:'灯りのともる小さな屋根の下で、すやすや。'},
 {id:'garden-bench',name:'花と風のベンチ',kind:'furniture',price:420,slots:['feature'],requires:['garden'],action:'garden',description:'庭に置く特別な席。葉っぱを眺めてひと休み。'},
 {id:'annex-expansion',name:'静かな離れ',kind:'expansion',price:900,roomId:'annex',description:'つながる部屋がひとつ増え、5か所に飾れます。家具は別売り。'},
 {id:'garden-expansion',name:'ガラス屋根の庭',kind:'expansion',price:1200,roomId:'garden',description:'光の差す庭が増え、4か所に飾れます。家具は別売り。'}
]};
