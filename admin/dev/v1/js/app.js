import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth,onAuthStateChanged,signInWithEmailAndPassword,signInWithPopup,GoogleAuthProvider,signOut,sendPasswordResetEmail,setPersistence,browserLocalPersistence,browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore,collection,doc,getDoc,getDocs,setDoc,addDoc,deleteDoc,limit } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { loadCompanyLocale, renderCompanyPage } from '../modules/settings/company.js';
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const state={view:'dashboard',user:null,companyName:'',data:{clients:[],compliance:[],credentials:[],tasks:[],invoices:[],admins:[]},editing:null,filter:'',clientStatusFilter:'all'};
const defs={clients:{title:'Clients',col:'clients',prefix:'C',width:5,fields:[['clientName','Client name','text',1],['personalName','Contact person','text'],['legalName','Legal name','text'],['clientMobile','Mobile','tel'],['clientEmail','Email','email'],['constitution','Constitution','select',['Individual','Proprietorship','Partnership','LLP','Private Limited','Other']],['gstin','GSTIN','text'],['pan','PAN','text'],['adhar','Aadhaar','text'],['branchName','Branch','text'],['documentFolder','Document folder URL','url'],['clientStatus','Status','select',['Active','Inactive','On hold']],['notes','Notes','textarea']]},compliance:{title:'Compliance',col:'compliance',prefix:'T26',width:4,fields:[['clientId','Client ID','text',1],['clientName','Client name','text',1],['complianceName','Compliance name','text',1],['compliancePeriod','Period','text'],['complianceAct','Act / category','text'],['complianceDate','Compliance date','date'],['dueDate','Due date','date'],['filedAt','Filed date','date'],['complianceStatus','Status','select',['Pending','In progress','Filed','Overdue','Not applicable']],['paymentStatus','Payment status','select',['Unpaid','Part paid','Paid','Not applicable']],['priority','Priority','select',['Low','Normal','High','Urgent']],['taskFolderLink','Task folder URL','url'],['Notes','Notes','textarea']]},credentials:{title:'Credentials',col:'credentials',prefix:'CR',width:4,fields:[['clientId','Client ID','text',1],['clientName','Client name','text',1],['PortalName','Portal name','text',1],['PortalDocNo','Portal / document number','text'],['UserName','Username','text'],['Password','Password or secure reference','password'],['_source','Source','text'],['Notes','Notes','textarea']]},tasks:{title:'Tasks & Work',col:'tasks',prefix:'W',width:5,fields:[['taskName','Task name','text',1],['clientId','Client ID','text'],['clientName','Client name','text'],['assignedTo','Assigned to','text'],['dueDate','Due date','date'],['priority','Priority','select',['Low','Normal','High','Urgent']],['status','Status','select',['Open','In progress','Waiting for client','Completed','Cancelled']],['notes','Notes','textarea']]},invoices:{title:'Invoices',col:'invoices',prefix:'INV',width:5,fields:[['invoiceNo','Invoice number','text',1],['clientId','Client ID','text'],['clientName','Client name','text',1],['invoiceDate','Invoice date','date'],['dueDate','Due date','date'],['amount','Amount (INR)','number',1],['paymentStatus','Payment status','select',['Unpaid','Part paid','Paid','Overdue']],['notes','Notes','textarea']]},admins:{title:'Admin users',col:'admins',fields:[['uid','Firebase Auth UID','text',1],['displayName','Display name','text'],['email','Email','email'],['role','Role','select',['admin','owner']],['active','Active','select',['true','false']] ]}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function safeExternalUrl(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:''}catch{return ''}}function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>$('#toast').classList.remove('show'),2600)}function theme(d){document.body.classList.toggle('dark',d);localStorage.setItem('cmfilings-theme',d?'dark':'light')}if(localStorage.getItem('cmfilings-theme')==='dark')theme(true);$('#theme').onclick=()=>theme(!document.body.classList.contains('dark'));
function menu(v){document.body.classList.toggle('menu-open',v);$('#menuBtn').setAttribute('aria-expanded',String(v))}$('#menuBtn').onclick=()=>menu(!document.body.classList.contains('menu-open'));$('#backdrop').onclick=()=>menu(false);document.addEventListener('keydown',e=>{if(e.key==='Escape')menu(false)});let sx=0,sy=0,tracking=false;document.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;sx=e.touches[0].clientX;sy=e.touches[0].clientY;tracking=(!document.body.classList.contains('menu-open')&&sx<30)||document.body.classList.contains('menu-open')},{passive:true});document.addEventListener('touchend',e=>{if(!tracking||!e.changedTouches.length)return;let dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dy)<80&&Math.abs(dx)>60){if(dx>0&&sx<30)menu(true);if(dx<0&&document.body.classList.contains('menu-open'))menu(false)}tracking=false},{passive:true});
const rememberedEmail=localStorage.getItem('cmfilings-login-email')||'';
$('#email').value=rememberedEmail;
$('#rememberMe').checked=!!rememberedEmail;
$('#email').oninput=()=>{if($('#rememberMe').checked)localStorage.setItem('cmfilings-login-email',$('#email').value.trim())};
$('#rememberMe').onchange=()=>{if($('#rememberMe').checked){if($('#email').value.trim())localStorage.setItem('cmfilings-login-email',$('#email').value.trim())}else localStorage.removeItem('cmfilings-login-email')};
$('#togglePassword').onclick=()=>{const input=$('#password'),visible=input.type==='password';input.type=visible?'text':'password';const button=$('#togglePassword');button.setAttribute('aria-label',visible?'Hide password':'Show password');button.setAttribute('aria-pressed',String(visible));button.innerHTML=`<i data-lucide="${visible?'eye-off':'eye'}"></i>`;lucide.createIcons()};
$('#loginForm').onsubmit=async e=>{e.preventDefault();const email=$('#email').value.trim();if($('#rememberMe').checked)localStorage.setItem('cmfilings-login-email',email);else localStorage.removeItem('cmfilings-login-email');$('#loginMsg').textContent='Signing in…';try{await setPersistence(auth,$('#rememberMe').checked?browserLocalPersistence:browserSessionPersistence);await signInWithEmailAndPassword(auth,email,$('#password').value)}catch(err){$('#loginMsg').textContent=authError(err)}};
$('#forgotPassword').onclick=async()=>{const email=$('#email').value.trim();if(!email){$('#loginMsg').textContent='Enter your email address first to reset your password.';$('#email').focus();return}$('#loginMsg').textContent='Sending password reset email…';try{await sendPasswordResetEmail(auth,email);$('#loginMsg').textContent='If an account exists for this email, a password reset link has been sent.'}catch(err){$('#loginMsg').textContent=authError(err)}};
$('#google').onclick=async()=>{try{await setPersistence(auth,$('#rememberMe').checked?browserLocalPersistence:browserSessionPersistence);await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){$('#loginMsg').textContent=authError(e)}};
function authError(e){return ({'auth/invalid-credential':'Email or password is incorrect.','auth/unauthorized-domain':'Add this domain to Firebase Auth authorized domains.','auth/popup-closed-by-user':'Google sign-in cancelled.','auth/invalid-email':'Enter a valid email address.','auth/user-not-found':'If an account exists for this email, a password reset link has been sent.','auth/too-many-requests':'Too many attempts. Please wait and try again.','auth/network-request-failed':'Network error. Check your connection and try again.'})[e.code]||e.message}
lucide.createIcons();
syncSidebarFolders();
onAuthStateChanged(auth,async user=>{state.user=user;if(!user){$('#login').classList.remove('hidden');$('#app').classList.add('hidden');return}try{const admin=await getDoc(doc(db,'admins',user.uid));if(!admin.exists()){await signOut(auth);$('#login').classList.remove('hidden');$('#app').classList.add('hidden');$('#loginMsg').textContent='This account is not approved as an admin. Add admins/'+user.uid+' in Firestore.';return}$('#login').classList.add('hidden');$('#app').classList.remove('hidden');const displayName=admin.data().displayName||user.displayName||'Admin';$('#adminName').textContent=displayName;$('#adminEmail').textContent=user.email||'';$('#headerAdminName').textContent=displayName;$('#headerAdminEmail').textContent=user.email||'';state.companyName=await loadCompanyLocale(db,toast)||'';await refresh();updateNotifications();renderDashboard()}catch(e){await signOut(auth);$('#loginMsg').textContent='Admin verification failed. Check Firestore rules and admins UID document.'}});
$('#logout').onclick=$('#headerLogout').onclick=()=>signOut(auth);
$$('.navitem').forEach(b=>b.onclick=()=>go(b.dataset.view));
$('#supportButton').onclick=()=>toast('For app access or data support, contact your CM Filings administrator.');
$('.side-head .wordmark').onclick=e=>{e.preventDefault();go('dashboard')};
const searchToggle=$('#searchToggle'),globalSearchForm=$('#globalSearchForm'),globalSearch=$('#globalSearch');
function closeGlobalSearch(){globalSearchForm.hidden=true;searchToggle.setAttribute('aria-expanded','false');searchToggle.setAttribute('aria-label','Open search')}
searchToggle.onclick=()=>{const opening=globalSearchForm.hidden;if(!opening){closeGlobalSearch();return}globalSearchForm.hidden=false;searchToggle.setAttribute('aria-expanded','true');searchToggle.setAttribute('aria-label','Close search');const trigger=searchToggle.getBoundingClientRect(),form=globalSearchForm.getBoundingClientRect(),topbar=document.querySelector('.topbar').getBoundingClientRect();globalSearchForm.style.top=`${topbar.bottom+6}px`;globalSearchForm.style.left=`${Math.max(12,Math.min(trigger.right-form.width,window.innerWidth-form.width-12))}px`;globalSearch.focus()};
document.addEventListener('pointerdown',e=>{if(!globalSearchForm.hidden&&!globalSearchForm.contains(e.target)&&!searchToggle.contains(e.target))closeGlobalSearch()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!globalSearchForm.hidden){closeGlobalSearch();searchToggle.focus()}});
$('#globalSearchForm').onsubmit=e=>{e.preventDefault();state.filter=globalSearch.value.trim();go('clients');state.filter=globalSearch.value.trim();globalSearch.value=state.filter;renderTable('clients');closeGlobalSearch()};
globalSearch.oninput=e=>{if(state.view==='clients'){state.filter=e.target.value;renderTable('clients')}};
[['notificationButton','notificationMenu'],['profileButton','profileMenu']].forEach(([buttonId,popoverId])=>{
  const button=$(`#${buttonId}`);
  button.addEventListener('click',()=>requestAnimationFrame(()=>{
    const popover=$(`#${popoverId}`);
    if(!popover.matches(':popover-open'))return;
    const trigger=button.getBoundingClientRect(),menu=popover.getBoundingClientRect();
    const mobile=window.matchMedia('(max-width: 760px)').matches;
    const topbar=document.querySelector('.topbar').getBoundingClientRect();
    const preferredTop=mobile?topbar.bottom+6:trigger.bottom+6;
    const top=preferredTop+menu.height>window.innerHeight-8?Math.max(8,window.innerHeight-menu.height-8):preferredTop;
    popover.style.top=`${Math.max(8,top)}px`;
    popover.style.left=`${Math.max(8,Math.min(trigger.right-menu.width,window.innerWidth-menu.width-8))}px`;
  }));
});
async function read(col){try{return(await getDocs(collection(db,col))).docs.slice(0,500).map(d=>({id:d.id,...d.data()}))}catch(e){console.error(e);toast('Load failed: check Firestore rules');return[]}}
async function refresh(){for(const k of Object.keys(state.data))state.data[k]=await read(k);updateNotifications()}
function go(v){state.view=v;state.filter='';$('#globalSearch').value='';state.clientStatusFilter='all';menu(false);$$('.navitem').forEach(b=>b.classList.toggle('active',b.dataset.view===v));v==='dashboard'?renderDashboard():v==='settings'?renderSettings():v==='company'?renderCompanyPage($('#main'),toast,()=>state.view==='company'):renderTable(v)}
function updateNotifications(){
  const today=new Date().toISOString().slice(0,10);
  const alerts=[
    ...state.data.compliance.filter(r=>['Overdue','Pending'].includes(r.complianceStatus)).map(r=>({view:'compliance',title:r.complianceName||'Compliance filing',detail:`${r.clientName||r.clientId||'Client'} · ${r.complianceStatus==='Overdue'?'Overdue':'Pending'}`,priority:r.complianceStatus==='Overdue'?0:1})),
    ...state.data.tasks.filter(r=>r.dueDate&&r.dueDate<=today&&!['Completed','Cancelled'].includes(r.status)).map(r=>({view:'tasks',title:r.taskName||'Task due',detail:`${r.clientName||'Task'} · Due ${r.dueDate}`,priority:0}))
  ].sort((a,b)=>a.priority-b.priority).slice(0,8);
  const count=alerts.length;
  $('#notificationCount').textContent=count>9?'9+':String(count);
  $('#notificationCount').classList.toggle('hidden',count===0);
  $('#notificationSummary').textContent=count?`${count} item${count===1?'':'s'} need attention`:'You’re all caught up';
  $('#notificationList').innerHTML=count?alerts.map((alert,index)=>`<button type="button" class="notification-item" data-notification-index="${index}"><i data-lucide="${alert.view==='tasks'?'list-checks':'file-warning'}"></i><span><strong>${esc(alert.title)}</strong><small>${esc(alert.detail)}</small></span><i data-lucide="chevron-right"></i></button>`).join(''):'<p class="notification-empty">No pending filings or due tasks.</p>';
  $('#notificationList').querySelectorAll('[data-notification-index]').forEach((button,index)=>button.onclick=()=>{$('#notificationMenu').hidePopover();go(alerts[index].view)});
  lucide.createIcons();
}
async function syncSidebarFolders(){
  const folderLabels=$$('[data-nav-folder]');
  await Promise.all(folderLabels.map(async label=>{
    const folder=label.dataset.navFolder;
    const links=$$('[data-module-folder]').filter(link=>link.dataset.moduleFolder===folder);
    const results=await Promise.all(links.map(async link=>{
      try{
        let response=await fetch(link.href,{method:'HEAD',cache:'no-store'});
        if(response.status===405)response=await fetch(link.href,{cache:'no-store'});
        if([404,410].includes(response.status))link.hidden=true;
      }catch(error){
        console.warn(`Could not verify sidebar module in ${folder}`,error);
      }
      return !link.hidden;
    }));
    label.hidden=!results.some(Boolean);
  }));
}
function dashboard(){
  const c=state.data.clients,co=state.data.compliance,t=state.data.tasks,cr=state.data.credentials;
  const companyName=state.companyName||'your workspace';
  $('#main').innerHTML=`
    <div class="pagehead"><div><div class="eyebrow">CM FILINGS · ADMIN</div><h1><i data-lucide="sparkles"></i><span>Welcome back, <span class="dashboard-company-name">${esc(companyName)}.</span></span></h1><p>Manage clients, tax filings and compliance in one workspace.</p></div></div>
    <div class="stats">
      <div class="stat"><small>Total clients</small><strong>${c.length}</strong><em>Client master records</em></div>
      <div class="stat"><small>Compliance</small><strong>${co.length}</strong><em>Tracked items</em></div>
      <div class="stat"><small>Open tasks</small><strong>${t.filter(x=>!['Completed','Cancelled'].includes(x.status)).length}</strong><em>Follow-up work</em></div>
      <div class="stat"><small>Credentials</small><strong>${cr.length}</strong><em>Restricted records</em></div>
    </div>
    <div class="card">
      <div class="cardhead"><div><h2>Quick actions</h2><p>Jump to a common task</p></div></div>
      <div class="quickgrid">
        <button class="quick" data-go="clients"><span class="quick-icon"><i data-lucide="user-round-plus"></i></span><b>Add a client</b><small>Client profile and documents</small></button>
        <button class="quick" data-go="compliance"><span class="quick-icon"><i data-lucide="file-check-2"></i></span><b>Track compliance</b><small>Due dates and filing status</small></button>
        <button class="quick" data-go="credentials"><span class="quick-icon"><i data-lucide="key-round"></i></span><b>Portal credentials</b><small>Restricted client records</small></button>
        <button class="quick" data-go="tasks"><span class="quick-icon"><i data-lucide="list-checks"></i></span><b>Create a task</b><small>Assign and prioritise work</small></button>
        <button class="quick" data-go="invoices"><span class="quick-icon"><i data-lucide="indian-rupee"></i></span><b>Invoices</b><small>Amounts and payment status</small></button>
        <button class="quick" data-go="admins"><span class="quick-icon"><i data-lucide="users-round"></i></span><b>Admin users</b><small>Review admin profiles</small></button>
      </div>
    </div>
    <div class="card"><div class="cardhead"><div><h2>Recent compliance</h2><p>Latest records</p></div><button class="secondary" id="allCompliance">View all</button></div>${co.length?`<div class="tablewrap"><table><thead><tr><th>Compliance</th><th>Client</th><th>Due date</th><th>Status</th></tr></thead><tbody>${co.slice(0,5).map(r=>`<tr><td>${esc(r.complianceName||r.id)}</td><td>${esc(r.clientName||r.clientId||'—')}</td><td>${esc(r.dueDate||'—')}</td><td><span class="badge">${esc(r.complianceStatus||'Pending')}</span></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No compliance records yet.</div>'}</div>`;
  lucide.createIcons();
  $('#allCompliance').onclick=()=>go('compliance');
  $$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go))
}
function renderDashboard(){dashboard()}
function renderTable(view){
  const d=defs[view];
  if(!d)return renderSettings();
  const allRows=state.data[view]||[];
  const rows=allRows.filter(r=>JSON.stringify(r).toLowerCase().includes(state.filter.toLowerCase())&&(view!=='clients'||state.clientStatusFilter==='all'||(r.clientStatus||'Active')===state.clientStatusFilter));
  const columns={clients:[['clientName','Client'],['clientId','Client ID'],['clientMobile','Mobile'],['clientEmail','Email'],['gstin','GSTIN'],['clientStatus','Status']],compliance:[['complianceName','Compliance'],['clientName','Client'],['compliancePeriod','Period'],['dueDate','Due date'],['complianceStatus','Status'],['paymentStatus','Payment']],credentials:[['PortalName','Portal'],['clientName','Client'],['clientId','Client ID'],['UserName','Username'],['PortalDocNo','Portal / Doc No']],tasks:[['taskName','Task'],['clientName','Client'],['assignedTo','Assigned to'],['dueDate','Due date'],['priority','Priority'],['status','Status']],invoices:[['invoiceNo','Invoice'],['clientName','Client'],['invoiceDate','Date'],['amount','Amount'],['dueDate','Due date'],['paymentStatus','Payment']],admins:[['displayName','Name'],['email','Email'],['role','Role'],['active','Active']]};
  const cols=columns[view]||[];
  const statusClass=value=>({
    'Filed':'filed',
    'Pending':'pending',
    'In progress':'in-progress',
    'Overdue':'overdue',
    'Not applicable':'not-applicable',
    'Paid':'paid',
    'Part paid':'part-paid',
    'Unpaid':'unpaid',
    'Active':'filed',
    'Inactive':'not-applicable',
    'On hold':'pending'
  }[value]||'unknown');
  const statusCell=value=>{const label=value||'Pending';return `<span class="badge status-badge status-${statusClass(label)}">${esc(label)}</span>`};
  const actionCell=r=>{
    if(view!=='compliance'&&view!=='clients')return `<div class="actions"><button class="smallbtn" data-edit="${esc(r.id)}">Edit</button><button class="smallbtn danger" data-delete="${esc(r.id)}">Delete</button></div>`;
    const popoverId=`${view}-actions-${encodeURIComponent(r.id)}`;
    const viewAction=view==='clients'?`<button type="button" data-client-view="${esc(r.id)}"><i data-lucide="eye"></i><span>View details</span></button>`:'';
    return `<button type="button" class="row-action-trigger" aria-label="Open ${view} actions" title="Actions" data-action-popover="${esc(popoverId)}" popovertarget="${esc(popoverId)}"><i data-lucide="ellipsis"></i></button><div id="${esc(popoverId)}" class="row-action-popover" popover="auto">${viewAction}<button type="button" class="row-action-edit" data-edit="${esc(r.id)}"><i data-lucide="pencil"></i><span>Edit</span></button><button type="button" class="row-action-delete" data-delete="${esc(r.id)}"><i data-lucide="trash-2"></i><span>Delete</span></button></div>`;
  };
  const isClients=view==='clients';
  const clientCell=r=>`<div class="client-identity"><span class="client-avatar" aria-hidden="true">${esc((r.clientName||'C').trim().slice(0,1).toUpperCase())}</span><span><strong>${esc(r.clientName||'Unnamed client')}</strong><small>${esc(r.clientId||r.id)}</small></span></div>`;
  const cell=(r,[k])=>isClients&&k==='clientName'?clientCell(r):view==='compliance'&&(k==='complianceStatus'||k==='paymentStatus')?statusCell(r[k]):isClients&&k==='clientStatus'?statusCell(r[k]||'Active'):k==='amount'?'₹'+Number(r[k]||0).toLocaleString('en-IN'):esc(r[k]||'—');
  const clientSummary=isClients?`<section class="client-summary" aria-label="Client totals"><div><i data-lucide="users-round"></i><span><strong>${allRows.length}</strong><small>All clients</small></span></div><div><i data-lucide="user-round-check"></i><span><strong>${allRows.filter(r=>(r.clientStatus||'Active')==='Active').length}</strong><small>Active</small></span></div><div><i data-lucide="user-round-clock"></i><span><strong>${allRows.filter(r=>r.clientStatus==='On hold').length}</strong><small>On hold</small></span></div><div><i data-lucide="user-round-x"></i><span><strong>${allRows.filter(r=>r.clientStatus==='Inactive').length}</strong><small>Inactive</small></span></div></section>`:'';
  const clientFilters=isClients?`<label class="client-filter"><i data-lucide="list-filter"></i><span class="sr-only">Filter clients by status</span><select id="clientStatusFilter"><option value="all" ${state.clientStatusFilter==='all'?'selected':''}>All statuses</option><option value="Active" ${state.clientStatusFilter==='Active'?'selected':''}>Active</option><option value="Inactive" ${state.clientStatusFilter==='Inactive'?'selected':''}>Inactive</option><option value="On hold" ${state.clientStatusFilter==='On hold'?'selected':''}>On hold</option></select></label>`:'';
  $('#main').innerHTML=`<div class="pagehead ${isClients?'client-pagehead':''}"><div><div class="eyebrow">${isClients?'CLIENT RELATIONSHIPS':'ADMIN WORKSPACE'}</div><h1>${isClients?'<i data-lucide="contact-round" aria-hidden="true"></i>':''}${d.title}</h1><p>${d.title==='Credentials'?'Restricted portal records. Do not store plaintext passwords if avoidable.':isClients?'Manage client profiles, contact details and registrations.':d.title+' management and records.'}</p></div><button class="primary" id="addRecord"><i data-lucide="${isClients?'user-round-plus':'plus'}"></i><span>${isClients?'New client':'Add'}</span></button></div>${clientSummary}<div class="toolbar ${isClients?'client-toolbar':''}"><label class="client-search"><i data-lucide="search"></i><span class="sr-only">Search ${d.title.toLowerCase()}</span><input id="recordSearch" placeholder="Search ${d.title.toLowerCase()}…" value="${esc(state.filter)}"></label>${clientFilters}<button class="secondary icon-button" id="refreshBtn" aria-label="Refresh records" title="Refresh"><i data-lucide="refresh-cw"></i><span>Refresh</span></button><span class="record-count">${rows.length} ${isClients?'shown':'records'}</span></div><div class="tablewrap ${isClients?'client-tablewrap':''}">${rows.length?`<table><thead><tr>${cols.map(c=>`<th>${c[1]}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${cell(r,c)}</td>`).join('')}<td class="action-cell">${actionCell(r)}</td></tr>`).join('')}</tbody></table>`:`<div class="empty client-empty"><i data-lucide="${isClients?'users-round':'inbox'}"></i><strong>${isClients?'No clients found':'No records found'}</strong><span>${state.filter||state.clientStatusFilter!=='all'?'Try changing your search or filters.':`Add your first ${isClients?'client':d.title.toLowerCase().replace(/s$/,'')} to get started.`}</span>${isClients?'<button class="primary" id="emptyAdd"><i data-lucide="user-round-plus"></i><span>Add client</span></button>':''}</div>`}</div>`;
  lucide.createIcons();
  $('#addRecord').onclick=()=>openEditor(view);
  $('#emptyAdd')?.addEventListener('click',()=>openEditor('clients'));
  $('#refreshBtn').onclick=async()=>{state.data[view]=await read(d.col);updateNotifications();renderTable(view);toast('Records refreshed')};
  $('#recordSearch').oninput=e=>{state.filter=e.target.value;renderTable(view);const i=$('#recordSearch');i.focus();i.setSelectionRange(i.value.length,i.value.length)};
  $('#clientStatusFilter')?.addEventListener('change',e=>{state.clientStatusFilter=e.target.value;renderTable(view)});
  $$('[data-action-popover]').forEach(button=>button.addEventListener('click',()=>requestAnimationFrame(()=>{
    const popover=document.getElementById(button.dataset.actionPopover);
    if(!popover?.matches(':popover-open'))return;
    const trigger=button.getBoundingClientRect();
    const menu=popover.getBoundingClientRect();
    const top=trigger.bottom+menu.height+8>window.innerHeight?trigger.top-menu.height-6:trigger.bottom+6;
    popover.style.top=`${Math.max(8,top)}px`;
    popover.style.left=`${Math.max(8,Math.min(trigger.right-menu.width,window.innerWidth-menu.width-8))}px`
  })));
  $$('[data-edit]').forEach(b=>b.onclick=()=>openEditor(view,b.dataset.edit));
  $$('[data-delete]').forEach(b=>b.onclick=()=>removeRecord(view,b.dataset.delete))
  $$('[data-client-view]').forEach(b=>b.onclick=()=>showClientDetails(b.dataset.clientView));
}
function showClientDetails(id){
  const client=state.data.clients.find(r=>r.id===id);
  if(!client)return;
  const fields=[['Contact person',client.personalName,'user-round'],['Email',client.clientEmail,'mail'],['Mobile',client.clientMobile,'phone'],['Legal name',client.legalName,'building-2'],['Constitution',client.constitution,'landmark'],['GSTIN',client.gstin,'file-check-2'],['PAN',client.pan,'id-card'],['Aadhaar',client.adhar,'credit-card'],['Branch',client.branchName,'map-pin']];
  $('#clientDetailsTitle').textContent=client.clientName||'Client details';
  const folderUrl=safeExternalUrl(client.documentFolder);
  $('#clientDetailsBody').innerHTML=`<div class="client-detail-hero"><span class="client-avatar">${esc((client.clientName||'C').trim().slice(0,1).toUpperCase())}</span><div><strong>${esc(client.clientName||'Unnamed client')}</strong><small>${esc(client.clientId||client.id)}</small></div><span class="badge status-badge status-${statusClassForClient(client.clientStatus||'Active')}">${esc(client.clientStatus||'Active')}</span></div><div class="client-detail-grid">${fields.map(([label,value,icon])=>`<div class="client-detail-item"><i data-lucide="${icon}" aria-hidden="true"></i><span><small>${label}</small><strong>${esc(value||'—')}</strong></span></div>`).join('')}${folderUrl?`<a class="client-detail-item client-folder-link" href="${esc(folderUrl)}" target="_blank" rel="noopener noreferrer"><i data-lucide="folder-open" aria-hidden="true"></i><span><small>Document folder</small><strong>Open folder</strong></span><i data-lucide="external-link" aria-hidden="true"></i></a>`:''}${client.notes?`<div class="client-detail-notes"><small>Notes</small><p>${esc(client.notes)}</p></div>`:''}</div><div class="client-detail-actions"><button type="button" class="secondary" id="clientDetailClose"><i data-lucide="x"></i><span>Close</span></button><button type="button" class="primary" id="clientDetailEdit"><i data-lucide="pencil"></i><span>Edit client</span></button></div>`;
  lucide.createIcons();
  $('#xClientDetails').onclick=()=>$('#clientDetails').close();
  $('#clientDetails').showModal();
  $('#clientDetailClose').onclick=()=>$('#clientDetails').close();
  $('#clientDetailEdit').onclick=()=>{$('#clientDetails').close();openEditor('clients',id)};
}
function statusClassForClient(value){return ({Active:'filed',Inactive:'not-applicable','On hold':'pending'})[value]||'unknown'}
function renderSettings(){$('#main').innerHTML=`<div class="pagehead"><div><div class="eyebrow">ADMINISTRATION</div><h1>Settings & security</h1><p>Firebase access and data protection guidance.</p></div></div><div class="card"><h2>Admin access</h2><div class="securitynote">Only authenticated users with a Firestore document at <b>admins/{uid}</b> are approved. Firestore Rules enforce access to protected collections.</div><p class="settingscopy">To add an administrator, create the account in Firebase Authentication, copy its UID, then create <b>admins/{uid}</b> with fields displayName, email, role: "admin", active: true. Create the first admin manually in Firebase Console.</p></div><div class="card"><h2>Sensitive credentials</h2><div class="securitynote">Password input fields are masked on screen, but Firestore does not encrypt your values automatically. Prefer saving a secure secret reference, not portal passwords. Avoid storing Aadhaar/PAN unless required and appropriately protected.</div></div><div class="card"><h2>Firebase project</h2><p class="settingscopy">Project ID: <b>cmb-40001</b><br>Enable Email/Password or Google in Authentication and add your deployed domain to Authorized domains.</p></div>`}
function openEditor(view,id=null){
  if(!defs[view])return;
  const d=defs[view],rec=id?(state.data[view]||[]).find(r=>r.id===id):null;
  state.editing={view,id,rec};
  $('#dialogType').textContent=view==='clients'?'CLIENT PROFILE':d.col.toUpperCase();
  $('#dialogTitle').textContent=(rec?'Edit ':'New ')+(view==='clients'?'client':d.title.replace(/s$/,''));
  const fieldMarkup=([k,label,type,req,opts])=>{
    let val=rec?.[k]??'';
    if(k==='Password'&&val)val='';
    const required=req===1?'required':'';
    const input=type==='select'
      ?`<select id="f_${k}" ${required}>${opts.map(o=>`<option value="${esc(o)}" ${String(val)===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`
      :type==='textarea'
        ?`<textarea id="f_${k}" ${required}>${esc(val)}</textarea>`
        :`<input id="f_${k}" type="${type}" value="${esc(val)}" ${required} ${k==='Password'?'autocomplete="new-password"':''} placeholder="${esc(label)}">`;
    return `<div class="field ${type==='textarea'||type==='url'?'wide':''}"><label for="f_${k}">${esc(label)}${req===1?' *':''}</label>${input}</div>`;
  };
  if(view==='clients'){
    const sections=[
      {title:'Client identity',icon:'contact-round',keys:['clientName','legalName','constitution']},
      {title:'Contact details',icon:'contact',keys:['personalName','clientMobile','clientEmail','branchName']},
      {title:'Registrations & documents',icon:'files',keys:['gstin','pan','adhar','documentFolder','clientStatus','notes']}
    ];
    $('#fields').innerHTML=sections.map(section=>`<section class="client-form-section wide"><h3><i data-lucide="${section.icon}" aria-hidden="true"></i>${section.title}</h3><div class="client-form-grid">${d.fields.filter(([key])=>section.keys.includes(key)).map(fieldMarkup).join('')}</div></section>`).join('');
  }else{
    $('#fields').innerHTML=d.fields.map(fieldMarkup).join('')+(view==='credentials'?'<div class="securitynote wide">Security note: avoid storing raw passwords. Leave Password blank when editing to keep the current value.</div>':'');
  }
  lucide.createIcons();
  $('#editor').showModal();
}
$('#xDialog').onclick=$('#cancel').onclick=()=>$('#editor').close();$('#editForm').onsubmit=async e=>{e.preventDefault();const ctx=state.editing,d=defs[ctx.view],data={...(ctx.rec||{})};for(const [k] of d.fields){const el=$('#f_'+k);if(!el)continue;if(k==='Password'&&!el.value)continue;data[k]=el.value.trim()}data.updatedAt=new Date().toISOString();if(!ctx.rec)data.createdAt=new Date().toISOString();if(ctx.view==='clients'&&!data.clientId)data.clientId=await makeId('clients','C',5);if(ctx.view==='compliance'&&!data.complianceId)data.complianceId=await makeId('compliance','T26',4);if(ctx.view==='credentials'&&!data.credentialId)data.credentialId=await makeId('credentials','CR',4);if(ctx.view==='tasks'&&!data.taskId)data.taskId=await makeId('tasks','W',5);if(ctx.view==='invoices'&&!data.invoiceNo)data.invoiceNo=await makeId('invoices','INV',5);try{const id=ctx.id||(ctx.view==='clients'?data.clientId:ctx.view==='compliance'?data.complianceId:ctx.view==='credentials'?data.credentialId:ctx.view==='tasks'?data.taskId:ctx.view==='invoices'?data.invoiceNo:ctx.view==='admins'?data.uid:null);if(ctx.id||id)await setDoc(doc(db,d.col,id||ctx.id),data,{merge:true});else await addDoc(collection(db,d.col),data);$('#editor').close();state.data[ctx.view]=await read(d.col);updateNotifications();ctx.view==='dashboard'?renderDashboard():renderTable(ctx.view);toast(ctx.id?'Record updated':'Record created')}catch(err){console.error(err);toast('Save failed: '+(err.code||err.message))}};
async function makeId(col,prefix,width){let max=0;for(const r of state.data[col]||[]){for(const x of [r.id,r.clientId,r.complianceId,r.credentialId,r.taskId,r.invoiceNo]){const m=String(x||'').match(new RegExp('^'+prefix+'(\\d+)$'));if(m)max=Math.max(max,+m[1])}}return prefix+String(max+1).padStart(width,'0')}
async function removeRecord(view,id){const d=defs[view];if(!confirm('Delete this record? This cannot be undone.'))return;try{await deleteDoc(doc(db,d.col,id));state.data[view]=await read(d.col);updateNotifications();renderTable(view);toast('Record deleted')}catch(e){toast('Delete failed: '+(e.code||e.message))}}
