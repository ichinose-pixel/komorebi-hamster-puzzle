import {generateEndless} from './endless.js?v=0755164c70ca2c22';
import {generateStage} from './progression.js?v=0755164c70ca2c22';
self.onmessage=({data})=>{try{self.postMessage({ok:true,...(data.kind==='endless'?generateEndless(data.seed,data.stage,data.catalog.endless,data.history):generateStage(data.seed,data.stage,data.catalog,data.recent))});}catch{self.postMessage({ok:false});}};
