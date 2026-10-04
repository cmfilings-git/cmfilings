import { initCrudModule } from "../../../js/crud-module.js?v=6";

export async function init(){
	await initCrudModule("branches");
	document.querySelector(".crud-page")?.insertAdjacentHTML("afterbegin",`
		<div class="page-header company-branch-header company-module-header">
			<div class="page-title"><div><h1>Company</h1><p>Company settings and branches.</p></div></div>
			<nav class="actions company-module-tabs" aria-label="Company modules">
				<button class="btn btn-outline" type="button" data-module="company">Company Settings</button>
				<button class="btn btn-primary" type="button" data-module="branches" aria-current="page">Branches</button>
			</nav>
		</div>`);
}
