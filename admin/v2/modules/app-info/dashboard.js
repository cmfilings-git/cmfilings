export async function init(){
  document.getElementById('dashboardRefresh')?.addEventListener('click',()=>window.COREBIQ?.loadModule('dashboard'));
}
