import { listRecords } from "../../../js/firebase-service.js?v=7";
import { renderCrmTabs } from "../crm-tabs.js";

function escapeHtml(value){
	return String(value ?? "").replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[character]));
}

function contactActions(record){
	const clientName = escapeHtml(record.name || record.contactPerson || "client");
	const phone = String(record.phone || "").trim().replace(/[^\d+*#]/g,"");
	const whatsapp = String(record.whatsapp || record.phone || "").replace(/\D/g,"");
	const email = String(record.email || "").trim();
	const actions = [];
	if(phone) actions.push(`<a class="quick-contact-action" href="tel:${phone}" aria-label="Call ${clientName}" title="Call"><span class="material-symbols-rounded">call</span><span>Call</span></a>`);
	if(whatsapp) actions.push(`<a class="quick-contact-action" href="https://wa.me/${whatsapp}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp ${clientName}" title="WhatsApp"><span class="material-symbols-rounded">chat</span><span>WhatsApp</span></a>`);
	if(email) actions.push(`<a class="quick-contact-action" href="mailto:${encodeURIComponent(email)}" aria-label="Email ${clientName}" title="Email"><span class="material-symbols-rounded">email</span><span>Email</span></a>`);
	return actions.length ? actions.join("") : '<span class="quick-contact-empty">No contact methods saved</span>';
}

export async function init(){
	const page = document.querySelector(".quick-contact-directory");
	const search = document.getElementById("quickContactSearch");
	const rows = document.getElementById("quickContactRows");
	const count = document.getElementById("quickContactCount");
	const feedback = document.getElementById("quickContactFeedback");
	let clients = [];

	renderCrmTabs("contacts",page.closest(".module-page"));

	function render(){
		const query = search.value.trim().toLowerCase();
		const visible = clients.filter(client=>[
			client.documentNo,client.id,client.name,client.contactPerson,client.phone,client.whatsapp,client.email
		].some(value=>String(value || "").toLowerCase().includes(query)));
		count.textContent = `${visible.length} of ${clients.length} clients`;
		if(!visible.length){
			rows.innerHTML = `<tr><td colspan="3"><div class="empty"><span class="material-symbols-rounded">${clients.length ? "search_off" : "inbox"}</span><p>${clients.length ? "No matching clients." : "No client records found."}</p></div></td></tr>`;
			window.COREBIQ?.renderIcons(rows);
			return;
		}
		rows.innerHTML = visible.map(client=>`<tr><td>${escapeHtml(client.documentNo || client.id)}</td><td>${escapeHtml(client.name || client.contactPerson || "Unnamed client")}</td><td><div class="quick-contact-actions">${contactActions(client)}</div></td></tr>`).join("");
		window.COREBIQ?.renderIcons(rows);
	}

	search.addEventListener("input",render);
	try{
		clients = await listRecords("clients");
		render();
	}catch(error){
		count.textContent = "";
		feedback.textContent = error.message || "Could not load client contacts.";
		feedback.hidden = false;
		rows.innerHTML = '<tr><td colspan="3"><div class="empty"><span class="material-symbols-rounded">cloud_off</span><p>Could not load client data.</p></div></td></tr>';
		window.COREBIQ?.renderIcons(rows);
	}
}