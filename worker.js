import {generateStage} from './progression.js?v=c3900dbc6a2c3c88';
self.onmessage=({data})=>{try{self.postMessage({ok:true,...generateStage(data.seed,data.stage,data.catalog,data.recent)});}catch{self.postMessage({ok:false});}};
