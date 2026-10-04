import { initCrudModule } from './crud-module.js?v=8';

const GROUPS = {
  company: [['company','Company Settings'],['branches','Branches']],
  crm: [['clients','Client Data'],['contacts','Quick Contacts'],['tasks','Tasks']],
  inventory: [['products','Products'],['services','Services'],['categories','Categories'],['units','Units'],['stock-adjustments','Stock Adjustments'],['sales','Sales'],['purchases','Purchases'],['invoices','Invoices'],['expenses','Expenses']],
  accounts: [['transactions','Transactions'],['all-vouchers','All Vouchers'],['contra-voucher','Contra'],['payment-voucher','Payment'],['receipt-voucher','Receipt'],['journal-voucher','Journal'],['sales-voucher','Sales Voucher'],['sales-return-voucher','Sales Return'],['purchase-voucher','Purchase Voucher'],['purchase-return-voucher','Purchase Return'],['estimate-voucher','Estimate'],['ledger','Ledger'],['cheques','Cheque Register'],['payments','Payments'],['chart-of-accounts','Chart of Accounts'],['outstanding','Outstanding'],['bank-reconciliation','Bank Reconciliation']],
  employees: [['staff','Staff'],['attendance','Attendance'],['payroll','Payroll'],['leave','Leave']],
  data: [['data','Data Center'],['data-import','Import'],['data-export','Export'],['backup','Backup']],
  reports: [['reports','Overview'],['financial-reports','Financial'],['gst-reports','GST'],['sales-reports','Sales'],['tax-reports','Tax'],['compliance-reports','Compliance']],
  tools: [['settings','Settings'],['payment-gateway','Payment Gateway'],['payment-reminders','Payment Reminders'],['compliance-reminders','Compliance Reminders'],['ack-communications','ACK / Communications']],
  assistant: [['assistant','AI Assistant'],['ai-insights','AI Insights']],
  templates: [['invoice-templates','Invoice Templates'],['document-templates','Document Templates']],
  more: [['qr','QR Codes'],['integrations','Integrations'],['audit-log','Audit Log'],['help','Help & Support']]
};

export const TITLES = {
  company:['Company','Company profile, branches and business defaults.'],
  crm:['CRM','Clients, contacts, tasks and relationship management.'],
  inventory:['Inventory','Products, services, sales, purchases and expenses.'],
  accounts:['Accounts','Vouchers, ledgers, payments and accounting transactions.'],
  employees:['Employees','Employee and staff management.'],
  data:['Data','Data centre, imports, exports and workspace records.'],
  reports:['Report','Management reports and financial summaries.'],
  tools:['Tools','Business automation, reminders and integrations.'],
  assistant:['AI-Assistant','COREBIQ intelligence, insights and business copilot.'],
  templates:['Templates','Reusable invoice and document templates.'],
  more:['More','Utilities, QR codes, integrations and support.']
};

export function getGroupForModule(moduleName){
  return Object.entries(GROUPS).find(([,tabs])=>tabs.some(([key])=>key===moduleName))?.[0] || moduleName;
}

export function renderModuleHeader(group, active){
  const [title, description] = TITLES[group] || [active, 'COREBIQ business management module.'];
  const tabs = (GROUPS[group] || [[active, active]]).map(([key,label])=>
    `<button class="btn ${key===active?'btn-primary':'btn-outline'}" type="button" data-module="${key}"${key===active?' aria-current="page"':''}>${label}</button>`
  ).join('');
  return `<div class="page-header erp-module-header"><div class="page-title"><div><h1>${title}</h1><p>${description}</p></div></div><nav class="actions erp-module-tabs" aria-label="${title} modules">${tabs}</nav></div>`;
}

export function renderCrudModule(moduleName, title, description, icon='list'){
  return `<div class="module-page"><div id="erpModuleHeader">${renderModuleHeader(getGroupForModule(moduleName),moduleName)}</div><div class="erp-module-body" id="erpModuleBody"></div></div>`;
}

export async function initErpCrud(moduleName){
  const group=getGroupForModule(moduleName);
  const root=document.querySelector('.module-page');
  if(!root) return;
  const header=root.querySelector('#erpModuleHeader');
  if(header) header.innerHTML=renderModuleHeader(group,moduleName);
  await initCrudModule(moduleName);
  // initCrudModule replaces moduleContainer, so restore the universal header on top.
  const page=document.querySelector('.crud-page');
  if(page){
    page.classList.add('erp-crud-page');
    page.insertAdjacentHTML('afterbegin',`<div id="erpModuleHeader" class="erp-crud-header">${renderModuleHeader(group,moduleName)}</div>`);
  }
  window.COREBIQ?.renderIcons(document.getElementById('moduleContainer'));
}

export function renderInfoPage(moduleName, cards=[]){
  const group=getGroupForModule(moduleName);
  const [title,description]=TITLES[group] || [moduleName,moduleName];
  return `<div class="module-page"><div class="page-header erp-module-header"><div class="page-title"><div><h1>${title}</h1><p>${description}</p></div></div><nav class="actions erp-module-tabs" aria-label="${title} modules">${(GROUPS[group]||[]).map(([key,label])=>`<button class="btn ${key===moduleName?'btn-primary':'btn-outline'}" data-module="${key}" type="button"${key===moduleName?' aria-current="page"':''}>${label}</button>`).join('')}</nav></div><div class="erp-info-grid">${cards.map(c=>`<div class="card erp-info-card"><div class="page-title-icon"><span class="material-symbols-rounded">${c[0]}</span></div><div><h3>${c[1]}</h3><p>${c[2]}</p></div><button class="btn btn-tonal" type="button" data-module="${c[3]||moduleName}">Open</button></div>`).join('')}</div></div>`;
}
