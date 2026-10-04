import { getCompany, getCompanyLogoUrl, saveCompany, uploadCompanyLogo } from "../../../js/firebase-service.js?v=7";

const fields = [
  "cmp_name","cmp_legal_name","cmp_biz_type","cmp_email","cmp_phone","cmp_phone_country","cmp_alt_phone","cmp_alt_phone_country",
  "cmp_website","cmp_reg_no","cmp_pan","cmp_gstin","cmp_cin","cmp_addr1","cmp_addr2",
  "cmp_city","cmp_district","cmp_state","cmp_pin","cmp_country","cmp_currency","cmp_fy_start",
  "cmp_tax_type","cmp_tax_rate","cmp_inv_prefix","cmp_inv_start","cmp_bank_name","cmp_acc_name",
  "cmp_acc_no","cmp_ifsc","cmp_bank_branch","cmp_upi_id","cmp_payment_gateway","cmp_payment_gateway_url",
  "cmp_logo","cmp_logo_url","cmp_logo_ratio","cmp_inv_logo","cmp_inv_header",
  "cmp_date_format","cmp_timezone","cmp_terms","cmp_notes"
];
const PHONE_PATTERNS = {
  "+91":/^[6-9]\d{9}$/,
  "+971":/^5\d{8}$/,
  "+1":/^[2-9]\d{9}$/,
  "+44":/^7\d{9}$/
};

let original = {};
let editing = false;
let pendingLogoFile = null;
let removeCurrentLogo = false;
let logoObjectUrl = "";
let logoPreviewRequest = 0;

function el(id){ return document.getElementById(id); }

function selectedLogoRatio(){
  return document.querySelector('input[name="companyLogoRatioChoice"]:checked')?.value || "horizontal";
}

function setPhoneValue(inputId,countryId,value,countryCode){
  const input = el(inputId);
  const country = el(countryId);
  let phone = String(value || "").trim();
  const prefix = phone.match(/^\+(?:\d{1,3})/);
  const codes = Object.keys(PHONE_PATTERNS);
  const code = codes.includes(countryCode) ? countryCode : codes.includes(prefix?.[0]) ? prefix[0] : "+91";
  if(prefix?.[0] === code) phone = phone.slice(code.length);
  country.value = code;
  input.value = phone.replace(/\D/g,"");
}

function validatePhone(inputId,countryId){
  const input = el(inputId);
  const digits = input.value.replace(/\D/g,"");
  const pattern = PHONE_PATTERNS[el(countryId).value];
  input.setCustomValidity(!digits || pattern?.test(digits) ? "" : "Enter a valid mobile number for the selected country code.");
}

function validateTaxNumbers(){
  const panInput = el("cmp_pan");
  const gstInput = el("cmp_gstin");
  panInput.value = panInput.value.toUpperCase().replace(/\s/g,"");
  gstInput.value = gstInput.value.toUpperCase().replace(/\s/g,"");
  const pan = panInput.value;
  const gstin = gstInput.value;
  const panValid = !pan || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
  const gstValid = !gstin || (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin) && (!pan || gstin.slice(2,12) === pan));
  panInput.setCustomValidity(panValid ? "" : "Enter a valid 10-character PAN.");
  gstInput.setCustomValidity(gstValid ? "" : "Enter a valid 15-character GSTIN that matches the PAN.");
}

function validateForm(){
  validateTaxNumbers();
  validatePhone("cmp_phone","cmp_phone_country");
  validatePhone("cmp_alt_phone","cmp_alt_phone_country");
  return el("companyForm").reportValidity();
}

function formatPhone(inputId,countryId){
  const digits = el(inputId).value.replace(/\D/g,"");
  return digits ? `${el(countryId).value} ${digits}` : "";
}

function setLogoRatio(value){
  const ratio = value === "square" ? "square" : "horizontal";
  el("cmp_logo_ratio").value = ratio;
  document.querySelectorAll('input[name="companyLogoRatioChoice"]').forEach(input=>{ input.checked = input.value === ratio; });
  el("companyLogoPreview").classList.toggle("is-square",ratio === "square");
  el("companyLogoPreview").classList.toggle("is-horizontal",ratio === "horizontal");
}

function releaseLogoObjectUrl(){
  if(logoObjectUrl){
    URL.revokeObjectURL(logoObjectUrl);
    logoObjectUrl = "";
  }
}

function showLogoPreview(source,filename){
  const image = el("companyLogoImage");
  releaseLogoObjectUrl();
  image.onload = ()=>{
    image.hidden = false;
    el("companyLogoPlaceholder").hidden = true;
  };
  image.onerror = ()=>{
    image.hidden = true;
    el("companyLogoPlaceholder").hidden = false;
    el("companyLogoPlaceholder").textContent = "Logo preview unavailable";
  };
  image.src = source;
  el("companyLogoFilename").textContent = filename || "Company logo";
  el("companyLogoRemove").hidden = !source;
}

function showInvoiceLogoPreview(source){
  const image = el("companyInvoiceLogoImage");
  const placeholder = el("companyInvoiceLogoPlaceholder");
  const url = String(source || "").trim();
  if(!url){
    image.removeAttribute("src");
    image.hidden = true;
    placeholder.hidden = false;
    placeholder.textContent = "No invoice logo URL";
    return;
  }
  image.onload = ()=>{ image.hidden = false; placeholder.hidden = true; };
  image.onerror = ()=>{ image.hidden = true; placeholder.hidden = false; placeholder.textContent = "Could not load image from this URL"; };
  placeholder.hidden = false;
  placeholder.textContent = "Loading invoice logo...";
  image.src = url;
}

async function loadLogoPreview(value){
  const request = ++logoPreviewRequest;
  setLogoRatio(el("cmp_logo_ratio").value);
  el("companyLogoImage").hidden = true;
  el("companyLogoPlaceholder").hidden = false;
  el("companyLogoPlaceholder").textContent = value ? "Loading logo..." : "No company logo selected";
  el("companyLogoFilename").textContent = value || "PNG, JPG, or WebP; max 5 MB";
  el("companyLogoRemove").hidden = !value;
  if(!value){
    releaseLogoObjectUrl();
    el("companyLogoImage").removeAttribute("src");
    return;
  }
  if(/^(https?:|data:|blob:|\/|\.\/|\.\.\/)/i.test(value)){
    showLogoPreview(value,"Saved company logo");
    return;
  }
  try{
    const downloadUrl = await getCompanyLogoUrl(value);
    if(request !== logoPreviewRequest) return;
    showLogoPreview(downloadUrl,"Saved company logo");
  }catch(error){
    if(request !== logoPreviewRequest) return;
    el("companyLogoPlaceholder").textContent = "Could not load saved logo";
  }
}

function setEditing(value){
  editing = value;
  fields.forEach(id=>{ if(el(id)) el(id).disabled = !value; });
  el("companyLogoFile").disabled = !value;
  el("companyLogoChoose").disabled = !value;
  el("companyLogoRemove").disabled = !value;
  document.querySelectorAll('input[name="companyLogoRatioChoice"]').forEach(input=>{ input.disabled = !value; });
  el("companyViewActions").style.display = value ? "none" : "flex";
  el("companyEditActions").style.display = value ? "flex" : "none";
  if(!value){
    pendingLogoFile = null;
    removeCurrentLogo = false;
  }
  if(value) el("cmp_name")?.focus();
}

function populate(data){
  el("cmp_id").value = "master";
  fields.forEach(id=>{
    if(el(id)) el(id).value = data[id] ?? "";
  });
  setPhoneValue("cmp_phone","cmp_phone_country",data.cmp_phone,data.cmp_phone_country);
  setPhoneValue("cmp_alt_phone","cmp_alt_phone_country",data.cmp_alt_phone,data.cmp_alt_phone_country);
  validateTaxNumbers();
  validatePhone("cmp_phone","cmp_phone_country");
  validatePhone("cmp_alt_phone","cmp_alt_phone_country");
  if(!data.cmp_logo_ratio) el("cmp_logo_ratio").value = "horizontal";
  setLogoRatio(data.cmp_logo_ratio);
  pendingLogoFile = null;
  removeCurrentLogo = false;
  void loadLogoPreview(data.cmp_logo_url || data.cmp_logo || "");
  showInvoiceLogoPreview(data.cmp_inv_logo || "");
}

async function load(){
  el("companyLoader").style.display = "grid";
  el("companyForm").style.display = "none";

  let data;
  try{
    data = await getCompany() || {};
  }catch(error){
    el("companyLoader").innerHTML = `<div class="empty"><span class="material-symbols-rounded">cloud_off</span><p>Could not load company profile from Firebase.</p><small>${String(error.message || "Check Firebase configuration and Firestore access rules.")}</small></div>`;
    return;
  }

  original = structuredClone(data);
  populate(data);

  el("companyLoader").style.display = "none";
  el("companyForm").style.display = "block";
  setEditing(false);
}

export async function init(){
  el("companyEdit").addEventListener("click",()=>setEditing(true));
  el("companyRefresh").addEventListener("click",load);
  el("companyLogoChoose").addEventListener("click",()=>el("companyLogoFile").click());
  el("companyLogoFile").addEventListener("change",event=>{
    const file = event.target.files?.[0];
    if(!file) return;
    el("companyLogoStatus").hidden = true;
    if(!["image/png","image/jpeg","image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024){
      el("companyLogoStatus").textContent = "Choose a PNG, JPG, or WebP image no larger than 5 MB.";
      el("companyLogoStatus").hidden = false;
      event.target.value = "";
      return;
    }
    pendingLogoFile = file;
    removeCurrentLogo = false;
    releaseLogoObjectUrl();
    const previewUrl = URL.createObjectURL(file);
    logoObjectUrl = previewUrl;
    const image = el("companyLogoImage");
    image.onload = ()=>{
      image.hidden = false;
      el("companyLogoPlaceholder").hidden = true;
    };
    image.src = previewUrl;
    el("companyLogoFilename").textContent = file.name;
    el("companyLogoRemove").hidden = false;
  });
  el("companyLogoRemove").addEventListener("click",()=>{
    pendingLogoFile = null;
    removeCurrentLogo = true;
    el("companyLogoFile").value = "";
    releaseLogoObjectUrl();
    el("companyLogoImage").removeAttribute("src");
    el("companyLogoImage").hidden = true;
    el("companyLogoPlaceholder").hidden = false;
    el("companyLogoPlaceholder").textContent = "Logo will be removed when saved";
    el("companyLogoFilename").textContent = "No company logo selected";
    el("companyLogoRemove").hidden = true;
  });
  document.querySelectorAll('input[name="companyLogoRatioChoice"]').forEach(input=>{
    input.addEventListener("change",()=>setLogoRatio(selectedLogoRatio()));
  });
  ["cmp_pan","cmp_gstin"].forEach(id=>el(id).addEventListener("input",validateTaxNumbers));
  [["cmp_phone","cmp_phone_country"],["cmp_alt_phone","cmp_alt_phone_country"]].forEach(([inputId,countryId])=>{
    el(inputId).addEventListener("input",()=>validatePhone(inputId,countryId));
    el(countryId).addEventListener("change",()=>validatePhone(inputId,countryId));
  });
  el("cmp_inv_logo").addEventListener("input",event=>showInvoiceLogoPreview(event.target.value));

  el("companyCancel").addEventListener("click",()=>{
    populate(original);
    setEditing(false);
  });

  el("companyForm").addEventListener("submit", async e=>{
    e.preventDefault();
    if(!validateForm()) return;
    const saveButton = el("companySave");
    saveButton.disabled = true;
    saveButton.innerHTML = `<span class="material-symbols-rounded">sync</span> Saving...`;

    const data = {};
    fields.forEach(id=>data[id]=el(id)?.value || "");
    data.cmp_phone = formatPhone("cmp_phone","cmp_phone_country");
    data.cmp_alt_phone = formatPhone("cmp_alt_phone","cmp_alt_phone_country");
    try{
      if(pendingLogoFile){
        data.cmp_logo = await uploadCompanyLogo(pendingLogoFile);
        data.cmp_logo_url = await getCompanyLogoUrl(data.cmp_logo);
      }else if(removeCurrentLogo){
        data.cmp_logo = "";
        data.cmp_logo_url = "";
      }
      data.cmp_logo_ratio = selectedLogoRatio();
      await saveCompany(data);
      original = structuredClone(data);
      populate(data);
      setEditing(false);
      window.showToast?.("Company profile saved.");
    }catch(error){
      el("companyLogoStatus").textContent = error.message || "Could not save company profile.";
      el("companyLogoStatus").hidden = false;
      window.showToast?.(error.message || "Could not save company profile.");
    }finally{
      saveButton.disabled = false;
      saveButton.innerHTML = `<span class="material-symbols-rounded">save</span> Save Company`;
      window.COREBIQ?.renderIcons(saveButton);
    }
  });

  await load();
}
