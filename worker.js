import {generateStage} from './progression.js?v=7c127fabbb404fea';
self.onmessage=({data})=>{try{self.postMessage({ok:true,...generateStage(data.seed,data.stage,data.catalog,data.recent)});}catch{self.postMessage({ok:false});}};
