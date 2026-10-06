import {generateEndless} from './endless.js?v=77f9ea4e4a11669e';
import {generateStage} from './progression.js?v=77f9ea4e4a11669e';
self.onmessage=({data})=>{try{self.postMessage({ok:true,...(data.kind==='endless'?generateEndless(data.seed,data.stage,data.catalog.endless,data.history):generateStage(data.seed,data.stage,data.catalog,data.recent))});}catch{self.postMessage({ok:false});}};
