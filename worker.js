import {generateEndless} from './endless.js?v=09c0f56a41bdf7e7';
import {generateStage} from './progression.js?v=09c0f56a41bdf7e7';
self.onmessage=({data})=>{try{self.postMessage({ok:true,...(data.kind==='endless'?generateEndless(data.seed,data.stage,data.catalog.endless,data.history):generateStage(data.seed,data.stage,data.catalog,data.recent))});}catch{self.postMessage({ok:false});}};
