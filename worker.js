import {generateStage} from './progression.js?v=c86e97018b9ae3d6';
self.onmessage=({data})=>{try{self.postMessage({ok:true,...generateStage(data.seed,data.stage,data.catalog,data.recent)});}catch{self.postMessage({ok:false});}};
