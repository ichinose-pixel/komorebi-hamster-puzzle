import {generateEndless} from './endless.js?v=843e60a0f442c23e';
import {generateStage} from './progression.js?v=843e60a0f442c23e';
self.onmessage=({data})=>{try{self.postMessage({ok:true,...(data.kind==='endless'?generateEndless(data.seed,data.stage,data.catalog.endless,data.history):generateStage(data.seed,data.stage,data.catalog,data.recent))});}catch{self.postMessage({ok:false});}};
