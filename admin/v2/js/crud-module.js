import { createRecord, deleteRecord, getCompany, getCompanyLogoBlob, listRecords, updateRecord } from "./firebase-service.js?v=7";

const MODULE_CONFIG = {
  branches:{title:"Branches",singular:"Branch",icon:"account_tree",description:"Manage business locations.",headerSorting:true,iconOnlyActions:true,compactToolbar:true,hideDownload:true,deleteInEditor:true,fields:[{key:"name",label:"Branch name",required:true},{key:"branchCode",label:"Branch code"},{key:"manager",label:"Manager"},{key:"email",label:"Email",type:"email"},{key:"phone",label:"Phone"},{key:"addressLine1",label:"Address line 1",tableHidden:true},{key:"addressLine2",label:"Address line 2",tableHidden:true},{key:"city",label:"City"},{key:"district",label:"District",tableHidden:true},{key:"state",label:"State"},{key:"pinCode",label:"PIN Code",tableHidden:true},{key:"country",label:"Country",defaultValue:"India",tableHidden:true},{key:"status",label:"Status",type:"select",options:["Active","Inactive"]}]},
  clients:{title:"Client Data",singular:"Client",icon:"group",description:"Manage customer and client records.",headerSorting:true,iconOnlyActions:true,compactToolbar:true,hideDownload:true,contactPicker:true,fields:[{key:"name",label:"Client name",required:true},{key:"contactPerson",label:"Contact person"},{key:"email",label:"Email",type:"email"},{key:"phone",label:"Mobile number",type:"tel"},{key:"whatsapp",label:"WhatsApp number",type:"tel"},{key:"gstin",label:"GSTIN"},{key:"city",label:"City"},{key:"status",label:"Status",type:"select",options:["Active","Inactive"]}]},
  contacts:{title:"Quick Contacts",singular:"Contact",icon:"contact-round",description:"Keep frequently used business contacts close at hand.",headerSorting:true,iconOnlyActions:true,compactToolbar:true,hideDownload:true,contactPicker:true,fields:[{key:"name",label:"Contact name",required:true},{key:"label",label:"Contact label",type:"select",defaultValue:"Client",options:["Client","Lead","Supplier","Partner","Personal","Work","Other"]},{key:"company",label:"Company",tableHidden:true},{key:"designation",label:"Role / designation",tableHidden:true},{key:"phoneLabel",label:"Mobile label",type:"select",defaultValue:"Mobile",options:["Mobile","Work","Home","Other"],tableHidden:true},{key:"phone",label:"Mobile number",type:"tel"},{key:"whatsapp",label:"WhatsApp number",type:"tel"},{key:"emailLabel",label:"Email label",type:"select",defaultValue:"Work",options:["Work","Home","Other"],tableHidden:true},{key:"email",label:"Email",type:"email"},{key:"notes",label:"Notes",type:"textarea",tableHidden:true}]},
  tasks:{title:"Tasks",singular:"Task",icon:"list-checks",description:"Track follow-ups and work related to clients and branches.",headerSorting:true,iconOnlyActions:true,compactToolbar:true,hideDownload:true,fields:[{key:"title",label:"Task title",required:true},{key:"description",label:"Description",type:"textarea"},{key:"dueDate",label:"Due date",type:"date"},{key:"priority",label:"Priority",type:"select",options:["Low","Normal","High"]},{key:"status",label:"Status",type:"select",options:["Open","In Progress","Completed"]},{key:"clientId",label:"Client",type:"reference",lookup:"clients"},{key:"branchId",label:"Branch",type:"reference",lookup:"branches"}]},
  staff:{title:"Staff",icon:"badge",description:"Manage employees and staff details.",fields:[{key:"name",label:"Staff name",required:true},{key:"role",label:"Role"},{key:"email",label:"Email",type:"email"},{key:"phone",label:"Phone"},{key:"branch",label:"Branch"},{key:"status",label:"Status",type:"select",options:["Active","Inactive"]}]},
  products:{title:"Products",icon:"inventory_2",description:"Manage products, pricing and stock.",fields:[{key:"name",label:"Product name",required:true},{key:"sku",label:"SKU"},{key:"category",label:"Category"},{key:"price",label:"Price",type:"number"},{key:"stock",label:"Stock quantity",type:"number"},{key:"unit",label:"Unit"},{key:"status",label:"Status",type:"select",options:["Active","Inactive"]}]},
  services:{title:"Services",icon:"design_services",description:"Manage services and pricing.",fields:[{key:"name",label:"Service name",required:true},{key:"serviceCode",label:"Service code"},{key:"category",label:"Category"},{key:"price",label:"Price",type:"number"},{key:"duration",label:"Duration"},{key:"status",label:"Status",type:"select",options:["Active","Inactive"]}]},
  sales:{title:"Sales",icon:"point_of_sale",description:"Track sales and customer payments.",fields:[{key:"customer",label:"Customer",required:true},{key:"reference",label:"Sale reference"},{key:"date",label:"Date",type:"date"},{key:"amount",label:"Amount",type:"number",required:true},{key:"paymentStatus",label:"Payment status",type:"select",options:["Pending","Paid","Partially paid"]},{key:"notes",label:"Notes",type:"textarea"}]},
  purchases:{title:"Purchases",icon:"shopping_cart",description:"Track purchases and supplier payments.",fields:[{key:"supplier",label:"Supplier",required:true},{key:"reference",label:"Purchase reference"},{key:"date",label:"Date",type:"date"},{key:"amount",label:"Amount",type:"number",required:true},{key:"paymentStatus",label:"Payment status",type:"select",options:["Pending","Paid","Partially paid"]},{key:"notes",label:"Notes",type:"textarea"}]},
  invoices:{title:"Invoices",icon:"receipt_long",description:"Manage invoices and outstanding balances.",fields:[{key:"customer",label:"Customer",required:true},{key:"invoiceNumber",label:"Invoice number"},{key:"date",label:"Invoice date",type:"date"},{key:"dueDate",label:"Due date",type:"date"},{key:"amount",label:"Amount",type:"number",required:true},{key:"paymentStatus",label:"Payment status",type:"select",options:["Unpaid","Partially paid","Paid","Overdue"]}]},
  expenses:{title:"Expenses",icon:"payments",description:"Record and review business expenses.",fields:[{key:"category",label:"Category",required:true},{key:"description",label:"Description"},{key:"date",label:"Date",type:"date"},{key:"amount",label:"Amount",type:"number",required:true},{key:"paymentMethod",label:"Payment method"},{key:"notes",label:"Notes",type:"textarea"}]},
  transactions:{title:"Transactions",icon:"account_balance",description:"Track business account transactions.",fields:[{key:"type",label:"Transaction type",required:true},{key:"reference",label:"Reference"},{key:"date",label:"Date",type:"date"},{key:"amount",label:"Amount",type:"number",required:true},{key:"account",label:"Account"},{key:"notes",label:"Notes",type:"textarea"}]},
  payments:{title:"Payments",icon:"currency_rupee",description:"Manage incoming and outgoing payments.",fields:[{key:"party",label:"Customer or supplier",required:true},{key:"reference",label:"Payment reference"},{key:"date",label:"Date",type:"date"},{key:"amount",label:"Amount",type:"number",required:true},{key:"method",label:"Payment method"},{key:"status",label:"Status",type:"select",options:["Pending","Completed","Failed"]}]},
  qr:{title:"QR Codes",icon:"qr_code_2",description:"Store and manage QR code destinations.",fields:[{key:"name",label:"QR label",required:true},{key:"value",label:"QR value or URL",required:true},{key:"purpose",label:"Purpose"},{key:"status",label:"Status",type:"select",options:["Active","Inactive"]}]},
  reports:{title:"Reports",icon:"bar_chart",description:"Save report definitions for your team.",fields:[{key:"name",label:"Report name",required:true},{key:"reportType",label:"Report type"},{key:"period",label:"Period"},{key:"notes",label:"Notes",type:"textarea"}]},
  settings:{title:"Settings",icon:"settings",description:"Manage workspace settings.",fields:[{key:"name",label:"Setting name",required:true},{key:"value",label:"Value",type:"textarea"},{key:"description",label:"Description",type:"textarea"}]},
  ledger:{title:"Ledger",singular:"Ledger",icon:"account_balance_wallet",description:"Manage preset ledger accounts and opening balances.",fields:[{key:"name",label:"Ledger name",required:true},{key:"category",label:"Category",type:"select",required:true,options:["Assets","Liabilities","Equity / Capital","Income / Revenue","Direct Expenses / Cost of Sales","Indirect Expenses","Sales Adjustments","Tax / GST","Other / Adjustment","Equity","Income","Expenses"]},{key:"accountGroup",label:"Category under"},{key:"accountType",label:"Account type",type:"select",options:["Other","Cash","Bank"],defaultValue:"Other"},{key:"openingBalance",label:"Opening balance",type:"number",required:true,defaultValue:"0"},{key:"balanceType",label:"Balance type",type:"select",required:true,options:["Debit","Credit","Debit / Credit"],defaultValue:"Debit"},{key:"bankName",label:"Bank name",bankOnly:true},{key:"accountHolderName",label:"Account holder",bankOnly:true},{key:"accountNumber",label:"Account number",bankOnly:true},{key:"ifsc",label:"IFSC code",bankOnly:true},{key:"bankBranch",label:"Bank branch",bankOnly:true},{key:"notes",label:"Notes",type:"textarea"}]}
};

// Extended COREBIQ ERP module configurations. These keep the existing CRUD engine
// while giving every sidebar sub-module its own collection and title.
const ERP_EXTRA_CONFIG = {
  'all-vouchers': {title:'All Vouchers',singular:'Voucher',icon:'receipt-text',description:'All accounting vouchers in one place.',fields:[{key:'voucherNo',label:'Voucher number',required:true},{key:'date',label:'Date',type:'date',required:true},{key:'party',label:'Party / account',required:true},{key:'amount',label:'Amount',type:'number',required:true},{key:'narration',label:'Narration',type:'textarea'}]},
  'contra-voucher': {title:'Contra Voucher',singular:'Contra Voucher',icon:'arrow-left-right',description:'Cash and bank transfer entries.',fields:[{key:'voucherNo',label:'Voucher number',required:true},{key:'date',label:'Date',type:'date',required:true},{key:'fromAccount',label:'From account',required:true},{key:'toAccount',label:'To account',required:true},{key:'amount',label:'Amount',type:'number',required:true},{key:'narration',label:'Narration',type:'textarea'}]},
  'payment-voucher': {title:'Payment Voucher',singular:'Payment Voucher',icon:'wallet',description:'Record payments made to parties and expenses.',fields:[{key:'voucherNo',label:'Voucher number',required:true},{key:'date',label:'Date',type:'date',required:true},{key:'payee',label:'Payee / account',required:true},{key:'amount',label:'Amount',type:'number',required:true},{key:'mode',label:'Payment mode'},{key:'narration',label:'Narration',type:'textarea'}]},
  'receipt-voucher': {title:'Receipt Voucher',singular:'Receipt Voucher',icon:'hand-coins',description:'Record money received from customers and other sources.',fields:[{key:'voucherNo',label:'Voucher number',required:true},{key:'date',label:'Date',type:'date',required:true},{key:'receivedFrom',label:'Received from',required:true},{key:'amount',label:'Amount',type:'number',required:true},{key:'mode',label:'Receipt mode'},{key:'narration',label:'Narration',type:'textarea'}]},
  'journal-voucher': {title:'Journal Voucher',singular:'Journal Voucher',icon:'book-open',description:'Record adjustment and journal entries.',fields:[{key:'voucherNo',label:'Voucher number',required:true},{key:'date',label:'Date',type:'date',required:true},{key:'debitAccount',label:'Debit account',required:true},{key:'creditAccount',label:'Credit account',required:true},{key:'amount',label:'Amount',type:'number',required:true},{key:'narration',label:'Narration',type:'textarea'}]},
  'sales-voucher': {title:'Sales Voucher',singular:'Sales Voucher',icon:'shopping-bag',description:'Record accounting sales vouchers.',fields:[{key:'voucherNo',label:'Voucher number',required:true},{key:'date',label:'Date',type:'date',required:true},{key:'customer',label:'Customer',required:true},{key:'amount',label:'Amount',type:'number',required:true},{key:'tax',label:'Tax',type:'number'},{key:'narration',label:'Narration',type:'textarea'}]},
  'sales-return-voucher': {title:'Sales Return',singular:'Sales Return',icon:'undo-2',description:'Record customer sales returns.',fields:[{key:'voucherNo',label:'Voucher number',required:true},{key:'date',label:'Date',type:'date',required:true},{key:'customer',label:'Customer',required:true},{key:'amount',label:'Amount',type:'number',required:true},{key:'reason',label:'Reason',type:'textarea'}]},
  'purchase-voucher': {title:'Purchase Voucher',singular:'Purchase Voucher',icon:'shopping-cart',description:'Record accounting purchase vouchers.',fields:[{key:'voucherNo',label:'Voucher number',required:true},{key:'date',label:'Date',type:'date',required:true},{key:'supplier',label:'Supplier',required:true},{key:'amount',label:'Amount',type:'number',required:true},{key:'tax',label:'Tax',type:'number'},{key:'narration',label:'Narration',type:'textarea'}]},
  'purchase-return-voucher': {title:'Purchase Return',singular:'Purchase Return',icon:'undo-2',description:'Record supplier purchase returns.',fields:[{key:'voucherNo',label:'Voucher number',required:true},{key:'date',label:'Date',type:'date',required:true},{key:'supplier',label:'Supplier',required:true},{key:'amount',label:'Amount',type:'number',required:true},{key:'reason',label:'Reason',type:'textarea'}]},
  'estimate-voucher': {title:'Estimate',singular:'Estimate',icon:'file-text',description:'Create and track estimates and quotations.',fields:[{key:'estimateNo',label:'Estimate number',required:true},{key:'date',label:'Date',type:'date',required:true},{key:'customer',label:'Customer',required:true},{key:'validUntil',label:'Valid until',type:'date'},{key:'amount',label:'Amount',type:'number',required:true},{key:'status',label:'Status',type:'select',options:['Draft','Sent','Accepted','Rejected','Expired']} ]},
  cheques: {title:'Cheque Register',singular:'Cheque',icon:'landmark',description:'Track issued and received cheques.',fields:[{key:'chequeNo',label:'Cheque number',required:true},{key:'date',label:'Cheque date',type:'date',required:true},{key:'party',label:'Party / account',required:true},{key:'amount',label:'Amount',type:'number',required:true},{key:'type',label:'Type',type:'select',options:['Issued','Received']},{key:'status',label:'Status',type:'select',options:['Pending','Cleared','Bounced','Cancelled']} ]},
  data: {title:'Data Center',singular:'Data Record',icon:'database',description:'Central workspace for imports, exports and operational data.',fields:[{key:'name',label:'Data set name',required:true},{key:'type',label:'Data type'},{key:'source',label:'Source'},{key:'status',label:'Status',type:'select',options:['Active','Archived']},{key:'notes',label:'Notes',type:'textarea'}]},
  'payment-gateway': {title:'Payment Gateway',singular:'Gateway',icon:'credit-card',description:'Configure online payment gateway connections.',fields:[{key:'provider',label:'Provider',required:true},{key:'merchantId',label:'Merchant ID'},{key:'apiKey',label:'API key'},{key:'status',label:'Status',type:'select',options:['Active','Inactive']},{key:'notes',label:'Notes',type:'textarea'}]},
  'payment-reminders': {title:'Payment Reminders',singular:'Payment Reminder',icon:'bell-ring',description:'Schedule and manage payment follow-ups.',fields:[{key:'party',label:'Customer / supplier',required:true},{key:'dueDate',label:'Due date',type:'date',required:true},{key:'amount',label:'Amount',type:'number',required:true},{key:'channel',label:'Channel',type:'select',options:['WhatsApp','Email','SMS','All']},{key:'status',label:'Status',type:'select',options:['Pending','Sent','Completed']} ]},
  'compliance-reminders': {title:'Compliance Reminders',singular:'Compliance Reminder',icon:'calendar-clock',description:'Track statutory deadlines and reminders.',fields:[{key:'title',label:'Compliance item',required:true},{key:'dueDate',label:'Due date',type:'date',required:true},{key:'frequency',label:'Frequency'},{key:'assignedTo',label:'Assigned to'},{key:'status',label:'Status',type:'select',options:['Upcoming','Due','Completed','Overdue']} ]},
  'ack-communications': {title:'ACK / Communications',singular:'Communication',icon:'send',description:'Track acknowledgements, notices and client communications.',fields:[{key:'party',label:'Client / recipient',required:true},{key:'reference',label:'Reference'},{key:'date',label:'Date',type:'date'},{key:'channel',label:'Channel',type:'select',options:['Email','WhatsApp','SMS','Portal']},{key:'status',label:'Status',type:'select',options:['Draft','Sent','Acknowledged']},{key:'notes',label:'Notes',type:'textarea'}]},
  'ai-insights': {title:'AI Insights',singular:'Insight',icon:'sparkles',description:'Store business insights and action points generated by COREBIQ.',fields:[{key:'title',label:'Insight title',required:true},{key:'category',label:'Category'},{key:'priority',label:'Priority',type:'select',options:['Low','Medium','High']},{key:'action',label:'Recommended action',type:'textarea'},{key:'status',label:'Status',type:'select',options:['New','Reviewed','Actioned']} ]},
  'invoice-templates': {title:'Invoice Templates',singular:'Invoice Template',icon:'layout-template',description:'Manage reusable invoice layouts.',fields:[{key:'name',label:'Template name',required:true},{key:'paperSize',label:'Paper size',type:'select',options:['A4','A5','Thermal']},{key:'header',label:'Header details',type:'textarea'},{key:'footer',label:'Footer details',type:'textarea'},{key:'status',label:'Status',type:'select',options:['Active','Inactive']} ]},
  'document-templates': {title:'Document Templates',singular:'Document Template',icon:'file-text',description:'Manage reusable business document templates.',fields:[{key:'name',label:'Template name',required:true},{key:'documentType',label:'Document type'},{key:'content',label:'Template content',type:'textarea'},{key:'status',label:'Status',type:'select',options:['Active','Inactive']} ]},
  integrations: {title:'Integrations',singular:'Integration',icon:'plug',description:'Manage external services connected to COREBIQ.',fields:[{key:'name',label:'Integration name',required:true},{key:'provider',label:'Provider'},{key:'purpose',label:'Purpose'},{key:'status',label:'Status',type:'select',options:['Connected','Disconnected']}]},
  'audit-log': {title:'Audit Log',singular:'Audit Entry',icon:'history',description:'Review important workspace activities.',fields:[{key:'action',label:'Action',required:true},{key:'user',label:'User'},{key:'date',label:'Date',type:'date'},{key:'module',label:'Module'},{key:'details',label:'Details',type:'textarea'}]},
  help: {title:'Help & Support',singular:'Support Item',icon:'circle-help',description:'Keep support notes and frequently used resources.',fields:[{key:'title',label:'Title',required:true},{key:'category',label:'Category'},{key:'content',label:'Content',type:'textarea'},{key:'status',label:'Status',type:'select',options:['Active','Archived']}]},
};

ERP_EXTRA_CONFIG.attendance={title:'Attendance',singular:'Attendance Entry',icon:'calendar-check',description:'Track employee attendance and working days.',fields:[{key:'employee',label:'Employee',required:true},{key:'date',label:'Date',type:'date',required:true},{key:'status',label:'Status',type:'select',options:['Present','Absent','Half Day','Leave']},{key:'checkIn',label:'Check in'},{key:'checkOut',label:'Check out'},{key:'notes',label:'Notes',type:'textarea'}]};
ERP_EXTRA_CONFIG.payroll={title:'Payroll',singular:'Payroll Entry',icon:'banknote',description:'Manage payroll periods and salary payments.',fields:[{key:'employee',label:'Employee',required:true},{key:'period',label:'Payroll period',required:true},{key:'gross',label:'Gross salary',type:'number'},{key:'deductions',label:'Deductions',type:'number'},{key:'net',label:'Net salary',type:'number',required:true},{key:'status',label:'Status',type:'select',options:['Draft','Processed','Paid']}]};
ERP_EXTRA_CONFIG.leave={title:'Leave',singular:'Leave Request',icon:'calendar-days',description:'Track employee leave requests.',fields:[{key:'employee',label:'Employee',required:true},{key:'fromDate',label:'From date',type:'date',required:true},{key:'toDate',label:'To date',type:'date',required:true},{key:'leaveType',label:'Leave type'},{key:'status',label:'Status',type:'select',options:['Pending','Approved','Rejected']},{key:'reason',label:'Reason',type:'textarea'}]};
ERP_EXTRA_CONFIG['data-import']={title:'Import',singular:'Import Job',icon:'upload',description:'Track imported datasets and source files.',fields:[{key:'name',label:'Import name',required:true},{key:'source',label:'Source file / system'},{key:'module',label:'Target module'},{key:'date',label:'Import date',type:'date'},{key:'status',label:'Status',type:'select',options:['Queued','Processing','Completed','Failed']}]};
ERP_EXTRA_CONFIG['data-export']={title:'Export',singular:'Export Job',icon:'download',description:'Track exported business datasets.',fields:[{key:'name',label:'Export name',required:true},{key:'module',label:'Module'},{key:'format',label:'Format',type:'select',options:['CSV','Excel','PDF','JSON']},{key:'date',label:'Export date',type:'date'},{key:'status',label:'Status',type:'select',options:['Queued','Completed','Failed']}]};
ERP_EXTRA_CONFIG.backup={title:'Backup',singular:'Backup Job',icon:'cloud-upload',description:'Track workspace backups and restore points.',fields:[{key:'name',label:'Backup name',required:true},{key:'type',label:'Backup type',type:'select',options:['Full','Incremental']},{key:'date',label:'Backup date',type:'date'},{key:'location',label:'Storage location'},{key:'status',label:'Status',type:'select',options:['Scheduled','Completed','Failed']}]};
for(const [key,title,description,icon] of [
 ['financial-reports','Financial','Profit, loss, balance sheet and trial balance.','account-balance'],
 ['gst-reports','GST','GST sales, purchases, tax and return summaries.','receipt-text'],
 ['sales-reports','Sales','Sales performance, invoices and receivables.','chart-no-axes-column'],
 ['tax-reports','Tax','Tax summaries and tax-ready reports.','percent'],
 ['compliance-reports','Compliance','Compliance due dates and completion reports.','calendar-clock']
]) ERP_EXTRA_CONFIG[key]={title,singular:'Report',icon,description,fields:[{key:'name',label:'Report name',required:true},{key:'period',label:'Period'},{key:'date',label:'Run date',type:'date'},{key:'status',label:'Status',type:'select',options:['Draft','Ready','Reviewed']},{key:'notes',label:'Notes',type:'textarea'}]};

ERP_EXTRA_CONFIG.categories={title:'Categories',singular:'Category',icon:'layers-3',description:'Manage product and service categories.',fields:[{key:'name',label:'Category name',required:true},{key:'code',label:'Category code'},{key:'parent',label:'Parent category'},{key:'status',label:'Status',type:'select',options:['Active','Inactive']}]};
ERP_EXTRA_CONFIG.units={title:'Units',singular:'Unit',icon:'ruler',description:'Manage inventory measurement units.',fields:[{key:'name',label:'Unit name',required:true},{key:'symbol',label:'Symbol',required:true},{key:'status',label:'Status',type:'select',options:['Active','Inactive']}]};
ERP_EXTRA_CONFIG['stock-adjustments']={title:'Stock Adjustments',singular:'Stock Adjustment',icon:'package-plus',description:'Record stock corrections and adjustments.',fields:[{key:'item',label:'Product',required:true},{key:'date',label:'Date',type:'date',required:true},{key:'quantity',label:'Quantity',type:'number',required:true},{key:'reason',label:'Reason',required:true},{key:'type',label:'Adjustment type',type:'select',options:['Increase','Decrease']}]};
ERP_EXTRA_CONFIG['chart-of-accounts']={title:'Chart of Accounts',singular:'Account',icon:'list-tree',description:'Manage account groups and ledgers.',fields:[{key:'code',label:'Account code'},{key:'name',label:'Account name',required:true},{key:'group',label:'Account group',required:true},{key:'openingBalance',label:'Opening balance',type:'number'},{key:'status',label:'Status',type:'select',options:['Active','Inactive']}]};
ERP_EXTRA_CONFIG.outstanding={title:'Outstanding',singular:'Outstanding Entry',icon:'circle-dollar-sign',description:'Review receivables and payables.',fields:[{key:'party',label:'Party',required:true},{key:'reference',label:'Reference'},{key:'dueDate',label:'Due date',type:'date'},{key:'amount',label:'Amount',type:'number',required:true},{key:'type',label:'Type',type:'select',options:['Receivable','Payable']},{key:'status',label:'Status',type:'select',options:['Open','Partially Paid','Paid','Overdue']}]};
ERP_EXTRA_CONFIG['bank-reconciliation']={title:'Bank Reconciliation',singular:'Reconciliation Entry',icon:'landmark',description:'Match bank statements with accounting transactions.',fields:[{key:'account',label:'Bank account',required:true},{key:'statementDate',label:'Statement date',type:'date',required:true},{key:'reference',label:'Reference'},{key:'amount',label:'Amount',type:'number',required:true},{key:'status',label:'Status',type:'select',options:['Matched','Unmatched','Reviewed']},{key:'notes',label:'Notes',type:'textarea'}]};
Object.assign(MODULE_CONFIG, ERP_EXTRA_CONFIG);

MODULE_CONFIG.branches.formSections = [
  {title:"Branch Details",icon:"building-2",fields:["name","branchCode","status"]},
  {title:"Contact Information",icon:"user-round",fields:["manager","email","phone"]},
  {title:"Branch Address",icon:"map-pin",fields:["addressLine1","addressLine2","city","district","state","pinCode","country"]}
];
MODULE_CONFIG.clients.formSections = [
  {title:"Client Details",icon:"building-2",fields:["name","gstin","status"]},
  {title:"Contact Information",icon:"user-round",fields:["contactPerson","email","phone","whatsapp"]},
  {title:"Location",icon:"map-pin",fields:["city"]}
];
MODULE_CONFIG.contacts.formSections = [
  {title:"Contact Details",icon:"user-round",fields:["name","label"]},
  {title:"Organization",icon:"building-2",fields:["company","designation"]},
  {title:"Phone Numbers",icon:"phone",fields:["phoneLabel","phone","whatsapp"]},
  {title:"Email Address",icon:"mail",fields:["emailLabel","email"]},
  {title:"Notes",icon:"sticky-note",fields:["notes"]}
];
MODULE_CONFIG.tasks.formSections = [
  {title:"Task Details",icon:"list-checks",fields:["title","priority","status"]},
  {title:"Schedule",icon:"calendar-days",fields:["dueDate"]},
  {title:"Related Records",icon:"link",fields:["clientId","branchId"]},
  {title:"Description",icon:"align-left",fields:["description"]}
];

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[character]));
}

function renderInput(field,lookups){
  const required = field.required ? " required" : "";
  if(field.type === "reference"){
    const options = lookups[field.lookup].map(record=>`<option value="${escapeHtml(record.id)}">${escapeHtml(record.name || record.title || record.id)}</option>`).join("");
    return `<select class="form-control" name="${field.key}"${required}><option value="">Select ${escapeHtml(field.label.toLowerCase())}</option>${options}</select>`;
  }
  if(field.type === "select"){
    return `<select class="form-control" name="${field.key}"${required}><option value="">Select</option>${field.options.map(option=>`<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("")}</select>`;
  }
  if(field.type === "textarea") return `<textarea class="form-control" name="${field.key}" rows="3"${required}></textarea>`;
  return `<input class="form-control" name="${field.key}" type="${field.type || "text"}" value="${escapeHtml(field.defaultValue ?? "")}"${field.type === "number" ? ' step="any"' : ""}${required}>`;
}

function arrangeFormSections(form,config,documentNumberField){
  if(!config.formSections) return;
  const formGrid = form.querySelector(".form-grid");
  const fieldGroups = new Map(config.fields.map(field=>[field.key,form.elements[field.key]?.closest(".form-group")]));
  const sections = config.formSections.map((section,index)=>{
    const sectionElement = document.createElement("section");
    sectionElement.className = "crud-form-section";
    const title = document.createElement("h3");
    title.className = "crud-form-section-title";
    const icon = document.createElement("i");
    icon.dataset.lucide = section.icon;
    const text = document.createElement("span");
    text.textContent = section.title;
    title.append(icon,text);
    const fieldGrid = document.createElement("div");
    fieldGrid.className = "crud-form-section-grid";
    if(index === 0) fieldGrid.append(documentNumberField);
    section.fields.forEach(key=>{
      const fieldGroup = fieldGroups.get(key);
      if(fieldGroup) fieldGrid.append(fieldGroup);
    });
    sectionElement.append(title,fieldGrid);
    return sectionElement;
  });
  formGrid.replaceChildren(...sections);
}

function renderPage(config,lookups){
  const singular = config.singular || config.title.replace(/s$/,"");
  const filterField = config.fields.find(field=>field.type === "select") || config.fields[0];
  config.tableFields = config.fields.filter(field=>!field.bankOnly && !field.tableHidden);
  const fields = config.fields.map(field=>`<div class="form-group${field.bankOnly ? " crud-bank-field" : ""}"${field.bankOnly ? " hidden" : ""}><label>${escapeHtml(field.label)}${field.required ? ' <span class="req">*</span>' : ""}</label>${renderInput(field,lookups)}</div>`).join("");
  const headers = config.tableFields.map(field=>`<th>${escapeHtml(field.label)}</th>`).join("");
  return `<div class="module-page crud-page">
    <div class="page-header"><div class="page-title"><div class="page-title-icon"><span class="material-symbols-rounded">${config.icon}</span></div><div><h1>${config.title}</h1><p>${config.description}</p></div></div><div class="actions"><button class="btn btn-outline" id="crudRefresh" type="button" title="Refresh"><span class="material-symbols-rounded">refresh</span><span>Refresh</span></button><button class="btn btn-primary" id="crudCreate" type="button"><span class="material-symbols-rounded">add</span><span>Add ${singular}</span></button></div></div>
    <div class="card card-pad"><div class="crud-toolbar"><input class="input-search" id="crudSearch" type="search" placeholder="Search ${config.title.toLowerCase()}..." aria-label="Search ${config.title}"><select class="form-control crud-select" id="crudFilter" aria-label="Filter by ${escapeHtml(filterField.label)}"><option value="">All ${escapeHtml(config.title.toLowerCase())}</option></select><select class="form-control crud-select" id="crudSort" aria-label="Sort records"><option value="updated-desc">Recent</option><option value="updated-asc">Oldest</option><option value="field-asc">${escapeHtml(filterField.label)} A-Z</option><option value="field-desc">${escapeHtml(filterField.label)} Z-A</option></select><button class="btn btn-outline crud-toolbar-icon" id="crudImport" type="button" title="Import records from CSV" aria-label="Import records from CSV"><span class="material-symbols-rounded">upload</span><span class="crud-control-label">Import CSV</span></button><button class="btn btn-outline crud-toolbar-icon" id="crudPdf" type="button" title="Download filtered data as PDF" aria-label="Download filtered data as PDF"><span class="material-symbols-rounded">picture_as_pdf</span><span class="crud-control-label">PDF</span></button><button class="btn btn-outline crud-toolbar-icon" id="crudPdfImport" type="button" title="Attach a PDF" aria-label="Attach a PDF"><span class="material-symbols-rounded">attach_file</span><span class="crud-control-label">Import PDF</span></button></div><input id="crudCsvFile" type="file" accept=".csv,text/csv" hidden><input id="crudPdfFile" type="file" accept=".pdf,application/pdf" hidden><p class="crud-feedback" id="crudFeedback" role="status" hidden></p><div class="table-wrap"><table class="data-table"><thead><tr>${headers}<th>Updated</th><th>Actions</th></tr></thead><tbody id="crudRows"><tr><td colspan="${config.fields.length+2}"><div class="loader"><span class="material-symbols-rounded">sync</span></div></td></tr></tbody></table></div><section class="crud-pdf-documents"><h2>PDF attachments</h2><div id="crudPdfRows"><p class="crud-pdf-empty">Loading attachments...</p></div></section></div>
    <dialog class="crud-dialog" id="crudDialog"><form id="crudForm"><div class="crud-dialog-header"><h2 id="crudDialogTitle">Add ${config.title.replace(/s$/,"")}</h2><button class="icon-button" type="button" id="crudClose" aria-label="Close"><span class="material-symbols-rounded">close</span></button></div><input type="hidden" name="recordId"><div class="form-grid">${fields}</div><div class="form-actions"><button class="btn btn-outline" type="button" id="crudCancel">Cancel</button><button class="btn btn-primary" id="crudSave" type="submit"><span class="material-symbols-rounded">save</span><span>Save</span></button></div></form></dialog>
  </div>`;
}

function formatDate(value){
  if(!value) return "--";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "--" : new Intl.DateTimeFormat(undefined,{dateStyle:"medium"}).format(date);
}

function getFieldValue(record,field,lookups){
  let value = record[field.key];
  if(value === undefined && field.lookup === "clients") value = record.customer;
  if(value === undefined && field.lookup === "branches") value = record.branch;
  if(field.lookup && value){
    const match = lookups[field.lookup].find(item=>item.id === value || item.name === value);
    if(match) return match.name || match.title || match.id;
  }
  return value ?? "";
}

function getRecordDate(record){
  const value = record.date || record.createdAt || record.updatedAt;
  if(!value) return "";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0,10);
}

function getDisplayValue(record,field,lookups){
  const value = field.type === "date" ? formatDate(record[field.key]) : getFieldValue(record,field,lookups);
  return value === null || value === undefined || value === "" ? "--" : value;
}

function blobToDataUrl(blob){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>resolve(String(reader.result||""));
    reader.onerror = ()=>reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function initCrudModule(moduleName){
  const sourceConfig = MODULE_CONFIG[moduleName];
  const config = sourceConfig && {...sourceConfig,fields:sourceConfig.fields.map(field=>({...field}))};
  const container = document.getElementById("moduleContainer");
  if(!config || !container) return;

  if(!["clients","contacts","tasks","branches","ledger","data","payment-gateway","payment-reminders","compliance-reminders","ack-communications","ai-insights","invoice-templates","document-templates","integrations","audit-log","help","cheques","all-vouchers","contra-voucher","payment-voucher","receipt-voucher","journal-voucher","sales-voucher","sales-return-voucher","purchase-voucher","purchase-return-voucher","estimate-voucher","categories","units","stock-adjustments","chart-of-accounts","outstanding","bank-reconciliation","reports","settings","qr","attendance","payroll","leave","data-import","data-export","backup","financial-reports","gst-reports","sales-reports","tax-reports","compliance-reports"].includes(moduleName)){
    let clientField = config.fields.find(field=>field.key === "customer" || field.key === "clientId");
    if(clientField){
      clientField.key = "clientId";
      clientField.label = "Client";
      clientField.lookup = "clients";
      clientField.type = "reference";
      clientField.required = true;
    }else{
      config.fields.unshift({key:"clientId",label:"Client",type:"reference",lookup:"clients",required:true});
    }
    let branchField = config.fields.find(field=>field.key === "branch" || field.key === "branchId");
    if(branchField){
      branchField.key = "branchId";
      branchField.label = "Branch";
      branchField.lookup = "branches";
      branchField.type = "reference";
      branchField.required = true;
    }else{
      config.fields.splice(1,0,{key:"branchId",label:"Branch",type:"reference",lookup:"branches",required:true});
    }
  }
  const lookups = {clients:[],branches:[]};
  container.innerHTML = renderPage(config,lookups);
  if(config.compactToolbar) container.querySelector(".crud-page")?.classList.add("crud-page-compact");
  if(moduleName === "branches") container.querySelector(".crud-page")?.classList.add("crud-page-branches");
  if(config.iconOnlyActions){
    [["crudRefresh","refresh",`Refresh ${config.title.toLowerCase()}`],["crudCreate","add",`Add ${config.singular.toLowerCase()}`]].forEach(([id,icon,label])=>{
      const button = document.getElementById(id);
      button.setAttribute("aria-label",label);
      button.title = label;
      button.classList.add("crud-icon-only-action");
      button.innerHTML = `<span class="material-symbols-rounded">${icon}</span>`;
    });
    window.COREBIQ?.renderIcons(container);
  }
  container.querySelectorAll(".loader .material-symbols-rounded").forEach(icon=>{
    icon.className="loading-ring";
    icon.textContent="";
    icon.setAttribute("aria-hidden","true");
  });
  const toolbar = container.querySelector(".crud-toolbar");
  ["crudImport","crudPdfImport"].forEach(id=>document.getElementById(id)?.remove());
  ["crudCsvFile","crudPdfFile"].forEach(id=>document.getElementById(id)?.remove());
  container.querySelector(".crud-pdf-documents")?.remove();
  const dateFilter = document.createElement("div");
  dateFilter.className = "crud-date-filter";
  if(config.compactToolbar){
    dateFilter.classList.add("crud-date-filter-icons");
    dateFilter.innerHTML = `<div class="crud-date-control"><input class="crud-date-display" type="text" inputmode="numeric" maxlength="10" placeholder="DD-MM-YYYY" aria-label="From date, DD-MM-YYYY" data-date-target="crudDateFrom"><button class="crud-date-icon" type="button" data-date-target="crudDateFrom" aria-label="Choose from date" title="Choose from date"><i data-lucide="calendar"></i></button><input class="crud-date-value" id="crudDateFrom" type="date" aria-label="From date picker"></div><div class="crud-date-control"><input class="crud-date-display" type="text" inputmode="numeric" maxlength="10" placeholder="DD-MM-YYYY" aria-label="To date, DD-MM-YYYY" data-date-target="crudDateTo"><button class="crud-date-icon" type="button" data-date-target="crudDateTo" aria-label="Choose to date" title="Choose to date"><i data-lucide="calendar"></i></button><input class="crud-date-value" id="crudDateTo" type="date" aria-label="To date picker"></div>`;
  }else{
    dateFilter.innerHTML = `<label>From<input class="form-control" id="crudDateFrom" type="date" aria-label="Filter from date"></label><label>To<input class="form-control" id="crudDateTo" type="date" aria-label="Filter to date"></label>`;
  }
  toolbar.append(dateFilter);
  if(config.compactToolbar){
    dateFilter.querySelectorAll(".crud-date-icon").forEach(button=>button.addEventListener("click",()=>{
      const input = document.getElementById(button.dataset.dateTarget);
      if(typeof input.showPicker === "function") input.showPicker();
      else input.click();
    }));
    dateFilter.querySelectorAll(".crud-date-display").forEach(textInput=>{
      const dateInput = document.getElementById(textInput.dataset.dateTarget);
      const button = dateFilter.querySelector(`.crud-date-icon[data-date-target="${dateInput.id}"]`);
      textInput.addEventListener("input",()=>{
        const digits = textInput.value.replace(/\D/g,"").slice(0,8);
        const day = digits.slice(0,2);
        const month = digits.slice(2,4);
        const year = digits.slice(4,8);
        textInput.value = digits.length > 4 ? `${day}-${month}-${year}` : digits.length > 2 ? `${day}-${month}` : day;
        let isoDate = "";
        let validationMessage = "";
        if(digits.length > 0 && digits.length < 8) validationMessage = "Enter the full date as DD-MM-YYYY.";
        if(digits.length === 8){
          const parsedDay = Number(day);
          const parsedMonth = Number(month);
          const parsedYear = Number(year);
          const date = new Date(Date.UTC(parsedYear,parsedMonth-1,parsedDay));
          const isValid = parsedYear >= 1000 && date.getUTCFullYear() === parsedYear && date.getUTCMonth() === parsedMonth-1 && date.getUTCDate() === parsedDay;
          if(isValid) isoDate = `${year}-${month}-${day}`;
          else validationMessage = "Enter a valid date as DD-MM-YYYY.";
        }
        textInput.setCustomValidity(validationMessage);
        dateInput.value = isoDate;
        button.classList.toggle("has-value",Boolean(isoDate));
        button.title = `${textInput.dataset.dateTarget === "crudDateFrom" ? "From" : "To"} date${isoDate ? `: ${textInput.value}` : ""}`;
        renderRows();
      });
      dateInput.addEventListener("change",()=>{
        textInput.value = dateInput.value ? `${dateInput.value.slice(8,10)}-${dateInput.value.slice(5,7)}-${dateInput.value.slice(0,4)}` : "";
        textInput.setCustomValidity("");
        button.classList.toggle("has-value",Boolean(dateInput.value));
        button.title = `${textInput.dataset.dateTarget === "crudDateFrom" ? "From" : "To"} date${textInput.value ? `: ${textInput.value}` : ""}`;
      });
    });
    window.COREBIQ?.renderIcons(dateFilter);
  }
  const sortControl = document.getElementById("crudSort");
  sortControl.insertAdjacentHTML("beforeend",'<option value="date-asc">Date: oldest</option><option value="date-desc">Date: newest</option>');
  const rows = document.getElementById("crudRows");
  const feedback = document.getElementById("crudFeedback");
  const dialog = document.getElementById("crudDialog");
  const form = document.getElementById("crudForm");
  let contactPickerButton = null;
  if(config.contactPicker){
    contactPickerButton = document.createElement("button");
    contactPickerButton.className = "btn btn-outline contact-picker-button";
    contactPickerButton.type = "button";
    contactPickerButton.hidden = typeof navigator.contacts?.select !== "function";
    contactPickerButton.setAttribute("aria-label","Choose a contact from this device");
    contactPickerButton.title = "Choose a contact from this device";
    contactPickerButton.innerHTML = '<span class="material-symbols-rounded">contacts</span><span>From phone</span>';
    form.querySelector(".crud-dialog-header").insertBefore(contactPickerButton,form.querySelector("#crudClose"));
    window.COREBIQ?.renderIcons(contactPickerButton);
    contactPickerButton.addEventListener("click",async()=>{
      try{
        const [contact] = await navigator.contacts.select(["name","email","tel"],{multiple:false});
        if(!contact) return;
        const name = Array.isArray(contact.name) ? contact.name.join(" ").trim() : "";
        const email = contact.email?.[0] || "";
        const phone = contact.tel?.[0] || "";
        if(form.elements.name) form.elements.name.value = name;
        if(form.elements.contactPerson) form.elements.contactPerson.value = name;
        if(form.elements.email) form.elements.email.value = email;
        if(form.elements.phone) form.elements.phone.value = phone;
        if(form.elements.whatsapp) form.elements.whatsapp.value = phone;
        if(form.elements.phoneLabel && phone) form.elements.phoneLabel.value = "Mobile";
      }catch(error){
        if(error.name !== "AbortError") window.showToast?.(error.message || "Could not read a contact from this device.");
      }
    });
  }
  let deleteEditorButton = null;
  if(config.deleteInEditor){
    deleteEditorButton = document.createElement("button");
    deleteEditorButton.className = "btn btn-danger crud-delete-editor";
    deleteEditorButton.id = "crudDeleteEditor";
    deleteEditorButton.type = "button";
    deleteEditorButton.hidden = true;
    deleteEditorButton.innerHTML = '<span class="material-symbols-rounded">delete</span><span>Delete Branch</span>';
    form.querySelector(".form-actions").prepend(deleteEditorButton);
  }
  const documentNumberField = document.createElement("div");
  documentNumberField.className = "form-group span-2 crud-document-number";
  documentNumberField.innerHTML = `<label for="displayDocumentNo">${moduleName === "branches" ? "Branch ID" : "Document No."}</label><input class="form-control" id="displayDocumentNo" name="displayDocumentNo" type="text" value="Assigned on save" readonly>`;
  form.elements.recordId.after(documentNumberField);
  arrangeFormSections(form,config,documentNumberField);
  const headerRow = container.querySelector(".data-table thead tr");
  const dateField = config.fields.find(field=>field.type === "date");
  const documentHeader = document.createElement("th");
  documentHeader.textContent = moduleName === "branches" ? "Branch ID" : "Document No.";
  headerRow.insertBefore(documentHeader,headerRow.firstChild);
  headerRow.children[headerRow.children.length-2].textContent = dateField ? "Updated" : "Date";
  if(config.headerSorting){
    [...headerRow.children].slice(0,-1).forEach((header,index)=>{
      const label = header.textContent.trim();
      const key = index === 0 ? "documentNo" : index === headerRow.children.length-2 ? "recordDate" : config.tableFields[index-1].key;
      const heading = document.createElement("div");
      heading.className = "crud-sort-heading";
      const text = document.createElement("span");
      text.textContent = label;
      const controls = document.createElement("span");
      controls.className = "crud-sort-buttons";
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.headerSort = key;
      button.dataset.sortLabel = label;
      button.setAttribute("aria-label",`Sort ${label} A to Z or Z to A`);
      button.title = `Sort ${label}`;
      button.setAttribute("aria-pressed","false");
      button.innerHTML = '<i data-lucide="arrow-up-down"></i>';
      controls.append(button);
      heading.append(text,controls);
      header.replaceChildren(heading);
    });
    window.COREBIQ?.renderIcons(headerRow);
  }
  const exportButton = document.getElementById("crudPdf");
  const downloadMenu = document.createElement("details");
  downloadMenu.className = "crud-download-menu";
  downloadMenu.innerHTML = `<summary class="btn btn-outline crud-toolbar-icon"><span class="material-symbols-rounded">download</span><span>Download</span></summary><div class="crud-download-options"><button type="button" id="crudExportCsv">CSV (.csv)</button><button type="button" id="crudExportPdf">PDF (.pdf)</button></div>`;
  if(config.hideDownload) exportButton.remove();
  else exportButton.replaceWith(downloadMenu);
  const printHeading = document.createElement("div");
  printHeading.className = "crud-print-heading";
  printHeading.innerHTML = `<div><p>COREBIQ CRM + ERP</p><h2>${escapeHtml(config.title)} report</h2></div><div><strong id="crudPrintCount"></strong><time id="crudPrintDate"></time></div>`;
  document.querySelector(".crud-page .table-wrap").before(printHeading);
  const printFooter = document.createElement("footer");
  printFooter.className = "crud-print-footer";
  printFooter.innerHTML = `<img class="crud-print-logo" src="assets/logo-app.svg" alt=""><img class="crud-print-wordmark" src="assets/name.svg" alt="COREBIQ CRM ERP">`;
  document.querySelector(".crud-page").append(printFooter);
  const filterField = config.fields.find(field=>field.type === "select") || config.fields[0];
  let records = [];
  let headerSort = null;
  let invoiceProfile = {};
  let invoiceBanks = [];

  async function refreshInvoiceContext(){
    const [companyResult,ledgerResult] = await Promise.allSettled([getCompany(),listRecords("ledger")]);
    invoiceProfile = companyResult.status === "fulfilled" ? companyResult.value || {} : {};
    invoiceBanks = ledgerResult.status === "fulfilled"
      ? ledgerResult.value.filter(ledger=>ledger.accountType === "Bank" || ledger.systemDefaultKey === "bank")
      : [];
  }

  function getClientForSale(record){
    return lookups.clients.find(client=>client.id === record.clientId) || lookups.clients.find(client=>client.name === record.customer) || null;
  }

  async function getSaleMessage(record,client){
    const {invoiceMessage} = await import("../modules/invoice-document.js");
    return invoiceMessage({sale:record,customer:client,company:invoiceProfile});
  }

  async function openSaleInvoice(record,client,popup){
    const {companyLogoSource,createInvoiceHtml} = await import("../modules/invoice-document.js");
    const template=invoiceProfile.invoiceTemplate||{};
    const selectedBank=invoiceBanks.find(bank=>bank.id===template.billingBankId)||(invoiceBanks.length===1?invoiceBanks[0]:null);
    if(template.showBankDetails!==false&&invoiceBanks.length>1&&!selectedBank){
      popup?.close();
      window.showToast?.("Select the billing bank in Invoice Template first.");
      return;
    }
    let logoDataUrl=companyLogoSource(invoiceProfile);
    if(invoiceProfile.cmp_logo&&!logoDataUrl){
      try{logoDataUrl=await blobToDataUrl(await getCompanyLogoBlob(invoiceProfile.cmp_logo));}
      catch{window.showToast?.("Could not load the company logo; opening bill without it.");}
    }
    const html=createInvoiceHtml({sale:record,customer:client,company:invoiceProfile,bank:selectedBank,template,logoDataUrl,autoPrint:true});
    if(!popup){
      window.showToast?.("Allow pop-ups to open or save the bill PDF.");
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  }

  async function refreshLookups(){
    const collections = [...new Set(config.fields.filter(field=>field.lookup).map(field=>field.lookup))];
    const results = await Promise.allSettled(collections.map(collectionName=>listRecords(collectionName)));
    const errors = [];
    results.forEach((result,index)=>{
      const collectionName = collections[index];
      if(result.status === "fulfilled") lookups[collectionName] = result.value;
      else errors.push(collectionName);
      const options = lookups[collectionName].map(record=>`<option value="${escapeHtml(record.id)}">${escapeHtml(record.name || record.title || record.id)}</option>`).join("");
      config.fields.filter(field=>field.lookup === collectionName).forEach(field=>{
        const select = form.elements[field.key];
        select.innerHTML = `<option value="">Select ${escapeHtml(field.label.toLowerCase())}</option>${options}`;
      });
    });
    renderFilterOptions();
    renderRows();
    if(errors.length){
      feedback.textContent = `Could not load ${errors.join(" and ")} for the required dropdowns.`;
      feedback.hidden = false;
    }
  }

  function renderFilterOptions(){
    const filter = document.getElementById("crudFilter");
    const selected = filter.value;
    const values = [...new Set(records.map(record=>String(record[filterField.key] ?? "").trim()).filter(Boolean))].sort((left,right)=>left.localeCompare(right));
    filter.innerHTML = `<option value="">All ${escapeHtml(config.title.toLowerCase())}</option>${values.map(value=>`<option value="${escapeHtml(value)}">${escapeHtml(getFieldValue({[filterField.key]:value},filterField,lookups))}</option>`).join("")}`;
    filter.value = values.includes(selected) ? selected : "";
  }

  function renderRows(){
    const query = document.getElementById("crudSearch").value.trim().toLowerCase();
    const filterValue = document.getElementById("crudFilter").value;
    const sortOrder = document.getElementById("crudSort").value;
    const dateFrom = document.getElementById("crudDateFrom").value;
    const dateTo = document.getElementById("crudDateTo").value;
    const visible = records.filter(record=>
      (!filterValue || String(record[filterField.key] ?? "") === filterValue) &&
      (!dateFrom || getRecordDate(record) >= dateFrom) &&
      (!dateTo || getRecordDate(record) <= dateTo) &&
      (String(record.documentNo || "").toLowerCase().includes(query) || config.fields.some(field=>String(getFieldValue(record,field,lookups)).toLowerCase().includes(query)))
    );
    visible.sort((left,right)=>{
      if(headerSort){
        const getValue=record=>headerSort.key === "documentNo" ? record.documentNo : headerSort.key === "recordDate" ? getRecordDate(record) : record[headerSort.key];
        const comparison=String(getValue(left) ?? "").localeCompare(String(getValue(right) ?? ""),undefined,{numeric:true,sensitivity:"base"});
        return headerSort.direction === "asc" ? comparison : -comparison;
      }
      if(sortOrder.startsWith("date-")){
        const comparison = getRecordDate(left).localeCompare(getRecordDate(right));
        return sortOrder === "date-asc" ? comparison : -comparison;
      }
      if(sortOrder.startsWith("field-")){
        const comparison = String(left[filterField.key] ?? "").localeCompare(String(right[filterField.key] ?? ""));
        return sortOrder === "field-asc" ? comparison : -comparison;
      }
      const getTime = record=>{
        const value = record.date || record.updatedAt || record.createdAt;
        if(value?.toMillis) return value.toMillis();
        const time = value ? new Date(value).getTime() : 0;
        return Number.isNaN(time) ? 0 : time;
      };
      const leftTime = getTime(left);
      const rightTime = getTime(right);
      return sortOrder === "updated-asc" ? leftTime-rightTime : rightTime-leftTime;
    });
    if(!visible.length){
      rows.innerHTML = `<tr><td colspan="${config.tableFields.length+3}"><div class="empty"><span class="material-symbols-rounded">${records.length ? "search_off" : "inbox"}</span><p>${records.length ? "No matching records." : `No ${config.title.toLowerCase()} found.`}</p></div></td></tr>`;
      window.COREBIQ?.renderIcons(rows);
      return;
    }
    rows.innerHTML = visible.map(record=>`<tr><td>${escapeHtml(record.documentNo || "--")}</td>${config.tableFields.map(field=>`<td>${escapeHtml(getDisplayValue(record,field,lookups))}</td>`).join("")}<td>${formatDate(dateField ? record.updatedAt || record.createdAt : record.date || record.createdAt || record.updatedAt)}</td><td><div class="crud-row-actions"><button class="icon-button" type="button" data-action="edit" data-id="${escapeHtml(record.id)}" aria-label="Edit record"><span class="material-symbols-rounded">edit</span></button>${moduleName === "sales" ? `<button class="icon-button" type="button" data-action="invoice-email" data-id="${escapeHtml(record.id)}" aria-label="Email bill" title="Email bill"><span class="material-symbols-rounded">email</span></button><button class="icon-button" type="button" data-action="invoice-whatsapp" data-id="${escapeHtml(record.id)}" aria-label="Send bill with WhatsApp" title="Send bill with WhatsApp"><span class="material-symbols-rounded">chat</span></button><button class="icon-button" type="button" data-action="invoice-pdf" data-id="${escapeHtml(record.id)}" aria-label="Download bill PDF" title="Download bill PDF"><span class="material-symbols-rounded">picture_as_pdf</span></button>` : ""}${record.systemDefault ? "" : `<button class="icon-button crud-delete" type="button" data-action="delete" data-id="${escapeHtml(record.id)}" aria-label="Delete record"><span class="material-symbols-rounded">delete</span></button>`}</div></td></tr>`).join("");
    if(moduleName === "contacts"){
      rows.querySelectorAll("tr").forEach((row,index)=>{
        const record = visible[index];
        const actions = row.querySelector(".crud-row-actions");
        if(!record || !actions) return;
        const phone = String(record.phone || "").trim().replace(/[^\d+*#]/g,"");
        const whatsappNumber = String(record.whatsapp || record.phone || "").replace(/\D/g,"");
        const email = String(record.email || "").trim();
        const links = [];
        if(phone){
          links.push(`<a class="icon-button crud-contact-action" href="tel:${phone}" aria-label="Call ${escapeHtml(record.name || "contact")}" title="Call"><span class="material-symbols-rounded">call</span></a>`);
          links.push(`<a class="icon-button crud-contact-action" href="sms:${phone}" aria-label="Text ${escapeHtml(record.name || "contact")}" title="Text"><span class="material-symbols-rounded">chat</span></a>`);
        }
        if(whatsappNumber) links.push(`<a class="icon-button crud-contact-action" href="https://wa.me/${whatsappNumber}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp ${escapeHtml(record.name || "contact")}" title="WhatsApp"><span class="material-symbols-rounded">chat</span></a>`);
        if(email) links.push(`<a class="icon-button crud-contact-action" href="mailto:${encodeURIComponent(email)}" aria-label="Email ${escapeHtml(record.name || "contact")}" title="Email"><span class="material-symbols-rounded">email</span></a>`);
        actions.insertAdjacentHTML("afterbegin",links.join(""));
      });
    }
    if(moduleName === "branches"){
      const statusColumn = config.tableFields.findIndex(field=>field.key === "status")+1;
      rows.querySelectorAll("tr").forEach((row,index)=>{
        const cell = row.children[statusColumn];
        if(!cell) return;
        const status = String(visible[index].status || "Inactive");
        const statusClass = status.toLowerCase() === "active" ? "is-active" : "is-inactive";
        cell.innerHTML = `<span class="crud-status-badge ${statusClass}">${escapeHtml(status)}</span>`;
      });
    }
    if(config.deleteInEditor) rows.querySelectorAll(".crud-delete").forEach(button=>button.remove());
    window.COREBIQ?.renderIcons(rows);
  }

  async function refresh(){
    feedback.hidden = true;
    rows.innerHTML = `<tr><td colspan="${config.tableFields.length+3}"><div class="loader" role="status" aria-label="Loading"><span class="loading-ring" aria-hidden="true"></span></div></td></tr>`;
    try{
      records = await listRecords(moduleName);
      renderFilterOptions();
      renderRows();
    }catch(error){
      records = [];
      rows.innerHTML = `<tr><td colspan="${config.tableFields.length+3}"><div class="empty"><span class="material-symbols-rounded">cloud_off</span><p>Could not load ${config.title.toLowerCase()} from Firebase.</p></div></td></tr>`;
      window.COREBIQ?.renderIcons(rows);
      feedback.textContent = error.message || "Check your Firebase configuration and Firestore access rules.";
      feedback.hidden = false;
    }
  }

  function openEditor(record){
    form.reset();
    form.elements.recordId.value = record?.id || "";
    form.elements.displayDocumentNo.value = record?.documentNo || "Assigned on save";
    const protectedLedger = moduleName === "ledger" && record?.systemDefault === true;
    const editablePresetFields = record?.systemDefaultKey === "bank"
      ? new Set(["openingBalance","bankName","accountHolderName","accountNumber","ifsc","bankBranch"])
      : new Set(["openingBalance"]);
    config.fields.forEach(field=>{
      const input = form.elements[field.key];
      const legacyValue = field.lookup === "clients" ? record?.customer : field.lookup === "branches" ? record?.branch : "";
      const rawValue = record?.[field.key] ?? (field.lookup ? legacyValue : field.defaultValue) ?? "";
      const match = field.lookup && lookups[field.lookup].find(item=>item.id === rawValue || item.name === rawValue);
      const value = match?.id ?? rawValue;
      if(field.lookup && value && !lookups[field.lookup].some(item=>item.id === value)){
        const option = document.createElement("option");
        option.value = value;
        option.textContent = `${rawValue} (existing value)`;
        input.append(option);
      }
      input.value = value;
      input.disabled = protectedLedger && !editablePresetFields.has(field.key);
      const fieldGroup = input.closest(".form-group");
      if(field.bankOnly){
        fieldGroup.hidden = form.elements.accountType?.value !== "Bank";
      }else{
        fieldGroup.hidden = protectedLedger && !editablePresetFields.has(field.key) && !["name","category","accountGroup"].includes(field.key);
      }
    });
    if(deleteEditorButton){
      deleteEditorButton.hidden = !record || Boolean(record.systemDefault);
      deleteEditorButton.dataset.id = record?.id || "";
    }
    document.getElementById("crudDialogTitle").textContent = `${record ? "Edit" : "Add"} ${config.singular || config.title.replace(/s$/,"")}`;
    dialog.showModal();
  }

  document.getElementById("crudCreate").addEventListener("click",()=>openEditor(null));
  deleteEditorButton?.addEventListener("click",async()=>{
    const record = records.find(item=>item.id === deleteEditorButton.dataset.id);
    if(!record || !window.confirm("Delete this branch?")) return;
    deleteEditorButton.disabled = true;
    try{
      await deleteRecord(moduleName,record.id);
      dialog.close();
      records = records.filter(item=>item.id !== record.id);
      renderRows();
      window.showToast?.("Branch deleted.");
    }catch(error){
      feedback.textContent = error.message || "Delete failed.";
      feedback.hidden = false;
    }finally{
      deleteEditorButton.disabled = false;
    }
  });
  if(moduleName === "ledger"){
    const syncBankFields=()=>{
      const showBankDetails = form.elements.accountType.value === "Bank";
      form.querySelectorAll(".crud-bank-field").forEach(field=>{ field.hidden = !showBankDetails; });
    };
    form.elements.accountType.addEventListener("change",syncBankFields);
    syncBankFields();
  }
  document.getElementById("crudRefresh").addEventListener("click",refresh);
  document.getElementById("crudSearch").addEventListener("input",renderRows);
  document.getElementById("crudFilter").addEventListener("change",renderRows);
  container.querySelectorAll("[data-header-sort]").forEach(button=>button.addEventListener("click",()=>{
    const direction = button.dataset.sortDirection === "asc" ? "desc" : "asc";
    headerSort = {key:button.dataset.headerSort,direction};
    container.querySelectorAll("[data-header-sort]").forEach(control=>{
      const active = control === button;
      control.setAttribute("aria-pressed",String(active));
      control.dataset.sortDirection = active ? direction : "";
      control.title = active ? direction === "asc" ? "Sorted A to Z" : "Sorted Z to A" : `Sort ${control.dataset.sortLabel}`;
      control.setAttribute("aria-label",active ? `Sorted ${control.dataset.sortLabel} ${direction === "asc" ? "A to Z" : "Z to A"}` : `Sort ${control.dataset.sortLabel} A to Z or Z to A`);
      control.innerHTML = `<i data-lucide="${active ? direction === "asc" ? "arrow-up" : "arrow-down" : "arrow-up-down"}"></i>`;
    });
    window.lucide?.createIcons();
    renderRows();
  }));
  document.getElementById("crudSort").addEventListener("change",()=>{
    headerSort = null;
    container.querySelectorAll("[data-header-sort]").forEach(button=>{
      button.setAttribute("aria-pressed","false");
      button.dataset.sortDirection = "";
      button.title = `Sort ${button.dataset.sortLabel}`;
      button.setAttribute("aria-label",`Sort ${button.dataset.sortLabel} A to Z or Z to A`);
      button.innerHTML = '<i data-lucide="arrow-up-down"></i>';
    });
    window.lucide?.createIcons();
    renderRows();
  });
  document.getElementById("crudDateFrom").addEventListener("change",renderRows);
  document.getElementById("crudDateTo").addEventListener("change",renderRows);
  document.getElementById("crudExportCsv")?.addEventListener("click",()=>{
    const csvEscape = value=>{
      const safeValue = /^[=+\-@]/.test(String(value)) ? `'${value}` : String(value);
      return /[",\r\n]/.test(safeValue) ? `"${safeValue.replace(/"/g,'""')}"` : safeValue;
    };
    const visibleRecords = [...rows.querySelectorAll('[data-action="edit"]')].map(button=>records.find(record=>record.id === button.dataset.id)).filter(Boolean);
    const csv = [["Document No.",...config.fields.map(field=>field.label)],...visibleRecords.map(record=>[record.documentNo,...config.fields.map(field=>getFieldValue(record,field,lookups))])].map(row=>row.map(csvEscape).join(",")).join("\r\n");
    const blobUrl = URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));
    const download = document.createElement("a");
    download.href = blobUrl;
    download.download = `${moduleName}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.append(download);
    download.click();
    download.remove();
    window.setTimeout(()=>URL.revokeObjectURL(blobUrl),1000);
    downloadMenu.open = false;
  });
  document.getElementById("crudExportPdf")?.addEventListener("click",()=>{
    const visibleRecords = [...rows.querySelectorAll('[data-action="edit"]')];
    document.getElementById("crudPrintCount").textContent = `${visibleRecords.length} records`;
    document.getElementById("crudPrintDate").textContent = `Generated ${new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date())}`;
    downloadMenu.open = false;
    window.print();
  });
  document.getElementById("crudCancel").addEventListener("click",()=>dialog.close());
  document.getElementById("crudClose").addEventListener("click",()=>dialog.close());
  rows.addEventListener("click",async event=>{
    const button = event.target.closest("[data-action]");
    if(!button) return;
    const record = records.find(item=>item.id === button.dataset.id);
    if(!record) return;
    if(["invoice-email","invoice-whatsapp","invoice-pdf"].includes(button.dataset.action)){
      const client=getClientForSale(record);
      const message=await getSaleMessage(record,client);
      if(button.dataset.action === "invoice-email"){
        if(!client?.email){window.showToast?.("Add an email address to this client before emailing the bill.");return;}
        const subject=`Bill ${record.documentNo||record.reference||""} from ${invoiceProfile.cmp_name||"COREBIQ"}`;
        window.open(`mailto:${encodeURIComponent(client.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,"_blank","noopener,noreferrer");
        return;
      }
      if(button.dataset.action === "invoice-whatsapp"){
        const digits=String(client?.phone||"").replace(/\D/g,"").replace(/^0/,"");
        if(!digits){window.showToast?.("Add a phone number to this client before using WhatsApp.");return;}
        const phone=digits.length===10?`91${digits}`:digits;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`,"_blank","noopener,noreferrer");
        return;
      }
      const popup=window.open("about:blank","_blank");
      await openSaleInvoice(record,client,popup);
      return;
    }
    if(button.dataset.action === "delete" && record.systemDefault){
      window.showToast?.("Preset ledgers cannot be deleted.");
      return;
    }
    if(button.dataset.action === "edit"){
      openEditor(record);
      return;
    }
    if(!window.confirm(`Delete this ${(config.singular || config.title.replace(/s$/,"")).toLowerCase()} record?`)) return;
    button.disabled = true;
    try{
      await deleteRecord(moduleName,record.id);
      records = records.filter(item=>item.id !== record.id);
      renderRows();
      window.showToast?.("Record deleted.");
    }catch(error){
      button.disabled = false;
      window.showToast?.(error.message || "Delete failed.");
    }
  });

  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const saveButton = document.getElementById("crudSave");
    const recordId = form.elements.recordId.value;
    const data = {};
    config.fields.forEach(field=>{
      const value = form.elements[field.key].value.trim();
      data[field.key] = field.type === "number" && value !== "" ? Number(value) : value;
    });
    saveButton.disabled = true;
    try{
      if(moduleName === "ledger" && !recordId && records.some(record=>record.systemDefault && record.name.trim().toLowerCase() === data.name.trim().toLowerCase() && record.category === data.category && record.accountGroup === data.accountGroup)){
        throw new Error("This is a preset ledger. Edit the existing account instead.");
      }
      if(recordId){
        await updateRecord(moduleName,recordId,data);
        window.showToast?.("Record updated.");
      }else{
        await createRecord(moduleName,data);
        window.showToast?.("Record created.");
      }
      dialog.close();
      await refresh();
    }catch(error){
      feedback.textContent = error.message || "Save failed. Check Firestore access rules.";
      feedback.hidden = false;
    }finally{
      saveButton.disabled = false;
    }
  });

  await Promise.all([refresh(),refreshLookups(),...(moduleName === "sales"?[refreshInvoiceContext()]:[])]);
}
