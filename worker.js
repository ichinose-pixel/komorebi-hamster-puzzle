import {generateEndless} from './endless.js?v=be6f9a6a74417ecf';
import {generateStage} from './progression.js?v=be6f9a6a74417ecf';
self.onmessage=({data})=>{try{self.postMessage({ok:true,...(data.kind==='endless'?generateEndless(data.seed,data.stage,data.catalog.endless,data.history):generateStage(data.seed,data.stage,data.catalog,data.recent))});}catch{self.postMessage({ok:false});}};
