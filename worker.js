import {generateStage} from './progression.js?v=6f2c880a7f5a5064';
self.onmessage=({data})=>{try{self.postMessage({ok:true,...generateStage(data.seed,data.stage,data.catalog,data.recent)});}catch{self.postMessage({ok:false});}};
