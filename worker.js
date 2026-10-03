import {generateStage} from './progression.js?v=0800796296e5a9c4';
self.onmessage=({data})=>{try{self.postMessage({ok:true,...generateStage(data.seed,data.stage,data.catalog,data.recent)});}catch{self.postMessage({ok:false});}};
