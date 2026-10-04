import { initCrudModule } from "../../js/crud-module.js?v=7";

const CRM_MODULES = [
  ["clients","Client Data"],
  ["contacts","Quick Contacts"],
  ["tasks","Tasks"]
];

export function renderCrmTabs(moduleName,page=document.querySelector(".crud-page")){
  if(!page) return;
  const tabs = CRM_MODULES.map(([key,label])=>`<button class="btn ${key === moduleName ? "btn-primary" : "btn-outline"}" type="button" data-module="${key}"${key === moduleName ? ' aria-current="page"' : ""}>${label}</button>`).join("");
  page.insertAdjacentHTML("afterbegin",`
    <div class="page-header crm-module-header">
      <div class="page-title"><div><h1>CRM</h1><p>Clients, contacts, and follow-up tasks.</p></div></div>
      <nav class="actions crm-module-tabs" aria-label="CRM modules">${tabs}</nav>
    </div>`);
  window.COREBIQ?.renderIcons(page.querySelector(".crm-module-header"));
}

export async function initCrmModule(moduleName){
  await initCrudModule(moduleName);
  renderCrmTabs(moduleName);
}