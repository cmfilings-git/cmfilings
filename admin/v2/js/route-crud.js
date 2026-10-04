import { initErpCrud } from './erp-module.js';
export async function init(){
  const moduleName = document.body.dataset.currentModule || window.COREBIQ?.currentRouteModule;
  if(moduleName) await initErpCrud(moduleName);
}
