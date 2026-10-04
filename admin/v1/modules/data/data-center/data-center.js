import { createRecord, listRecords } from "../../../js/firebase-service.js?v=7";

const COLLECTIONS = [
  ["branches","Branches"],["clients","Client Data"],["contacts","Quick Contacts"],["tasks","Tasks"],["staff","Employees"],
  ["products","Products"],["services","Services"],["sales","Sales"],
  ["purchases","Purchases"],["invoices","Invoices"],["expenses","Expenses"],
  ["transactions","Transactions"],["payments","Payments"],["qr","QR codes"],
  ["reports","Reports"],["settings","Settings"]
];
const GENERATED_FIELDS = new Set(["id","documentno","createdat","updatedat"]);

function parseCsv(text){
  const source = String(text).replace(/^\uFEFF/,"");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for(let index=0;index<source.length;index++){
    const character = source[index];
    if(quoted){
      if(character === '"' && source[index+1] === '"'){
        cell += '"';
        index++;
      }else if(character === '"'){
        quoted = false;
      }else{
        cell += character;
      }
    }else if(character === '"' && cell === ""){
      quoted = true;
    }else if(character === ","){
      row.push(cell);
      cell = "";
    }else if(character === "\n" || character === "\r"){
      if(character === "\r" && source[index+1] === "\n") index++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    }else{
      cell += character;
    }
  }
  if(quoted) throw new Error("The CSV has an unclosed quoted value.");
  if(cell !== "" || row.length){
    row.push(cell);
    rows.push(row);
  }
  return rows.filter(values=>values.some(value=>value.trim() !== ""));
}

function parseValue(value){
  const source = value.trim();
  if(!source) return "";
  try{return JSON.parse(source);}
  catch{return value;}
}

function csvCell(value){
  let normalized = value;
  if(value?.toDate) normalized = value.toDate().toISOString();
  const serialized = JSON.stringify(normalized ?? "");
  return `"${serialized.replace(/"/g,'""')}"`;
}

function showStatus(element,message,isError=false){
  element.textContent = message;
  element.classList.toggle("is-error",isError);
}

export async function init(){
  const exportCollection = document.getElementById("dataExportCollection");
  const importCollection = document.getElementById("dataImportCollection");
  const fileInput = document.getElementById("dataImportFile");
  const importButton = document.getElementById("dataImportButton");
  const exportFeedback = document.getElementById("dataExportFeedback");
  const importFeedback = document.getElementById("dataImportFeedback");
  let parsedRows = null;
  let parsedHeaders = null;

  const options = COLLECTIONS.map(([value,label])=>`<option value="${value}">${label}</option>`).join("");
  exportCollection.innerHTML = options;
  importCollection.innerHTML = options;

  document.getElementById("dataExportButton").addEventListener("click",async event=>{
    const button = event.currentTarget;
    button.disabled = true;
    showStatus(exportFeedback,"Loading records...");
    try{
      const collectionName = exportCollection.value;
      const records = await listRecords(collectionName);
      if(!records.length){
        showStatus(exportFeedback,"No records found in this collection.");
        return;
      }
      const headers = [...new Set(records.flatMap(record=>Object.keys(record)))];
      const csv = [headers.map(csvCell).join(","),...records.map(record=>headers.map(header=>csvCell(record[header])).join(","))].join("\r\n");
      const url = URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${collectionName}-${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showStatus(exportFeedback,`Exported ${records.length} records.`);
    }catch(error){
      showStatus(exportFeedback,error.message || "Could not export records.",true);
    }finally{
      button.disabled = false;
    }
  });

  document.getElementById("dataChooseFile").addEventListener("click",()=>fileInput.click());
  fileInput.addEventListener("change",async()=>{
    parsedRows = null;
    parsedHeaders = null;
    importButton.disabled = true;
    showStatus(importFeedback,"");
    const file = fileInput.files?.[0];
    document.getElementById("dataFileName").textContent = file?.name || "No file selected";
    if(!file) return;
    if(file.size > 10 * 1024 * 1024){
      showStatus(importFeedback,"CSV files must be 10 MB or smaller.",true);
      return;
    }
    try{
      const [headerRow,...dataRows] = parseCsv(await file.text());
      if(!headerRow?.length) throw new Error("The CSV has no header row.");
      parsedHeaders = headerRow.map(header=>header.trim());
      if(parsedHeaders.some(header=>!header) || new Set(parsedHeaders).size !== parsedHeaders.length){
        throw new Error("Column headers must be non-empty and unique.");
      }
      if(!parsedHeaders.some(header=>!GENERATED_FIELDS.has(header.toLowerCase()))){
        throw new Error("The CSV needs at least one data column besides generated IDs and timestamps.");
      }
      parsedRows = dataRows.filter(values=>values.some(value=>value.trim() !== ""));
      if(parsedRows.some(values=>values.length !== parsedHeaders.length)){
        throw new Error("Every row must have the same number of columns as the header.");
      }
      document.getElementById("dataImportPreview").textContent = `${parsedRows.length} record${parsedRows.length === 1 ? "" : "s"} ready to import. Existing records will not be changed.`;
      importButton.disabled = parsedRows.length === 0;
    }catch(error){
      document.getElementById("dataImportPreview").textContent = "CSV preview unavailable.";
      showStatus(importFeedback,error.message || "Could not read this CSV file.",true);
    }
  });

  importButton.addEventListener("click",async()=>{
    if(!parsedRows?.length || !parsedHeaders) return;
    if(!window.confirm(`Add ${parsedRows.length} new ${importCollection.options[importCollection.selectedIndex].text} records?`)) return;
    importButton.disabled = true;
    const collectionName = importCollection.value;
    let imported = 0;
    try{
      for(const values of parsedRows){
        const record = {};
        parsedHeaders.forEach((header,index)=>{
          if(!GENERATED_FIELDS.has(header.toLowerCase())) record[header] = parseValue(values[index]);
        });
        await createRecord(collectionName,record);
        imported++;
        showStatus(importFeedback,`Imported ${imported} of ${parsedRows.length} records...`);
      }
      showStatus(importFeedback,`Imported ${imported} records. Firebase assigned new IDs and document numbers.`);
      parsedRows = null;
      parsedHeaders = null;
      fileInput.value = "";
      document.getElementById("dataFileName").textContent = "No file selected";
      document.getElementById("dataImportPreview").textContent = "Choose a CSV file to preview its rows.";
    }catch(error){
      showStatus(importFeedback,`Imported ${imported} of ${parsedRows.length} records before stopping: ${error.message || "Import failed."}`,true);
    }finally{
      importButton.disabled = !parsedRows?.length;
    }
  });
}