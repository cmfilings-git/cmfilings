// Initialize Lucide Icons
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

// --- GLOBAL STATE (Supports all 17 Sheets) ---
let gstData = {
    b2b: [], b2cl: [], b2cs: [], cdnr: [], cdnur: [], exp: [], 
    at: [], atadj: [],
    nil: { inv: [] }, 
    hsn: { hsn_b2b: [], hsn_b2c: [] }, 
    doc_issue: { doc_det: [] }, 
    supeco: { paytx: [] },
    ecob2b: [], ecob2c: [], ecourp2b: [], ecourp2c: []
};

// --- LIVE DATE TIME ---
function updateDateTime(){
    const dtElement = document.getElementById("datetime");
    if(dtElement) {
        let now = new Date();
        dtElement.innerText = now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    }
}

// --- DARK MODE ---
const themeBtn = document.getElementById('themeToggle');
if(themeBtn) {
    themeBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
    });
}

// --- TABS ---
function switchTab(tab) {
    document.getElementById('tab-upload').classList.toggle('hidden', tab !== 'upload');
    document.getElementById('tab-paste').classList.toggle('hidden', tab !== 'paste');
    
    const btnUp = document.getElementById('btn-tab-upload');
    const btnPa = document.getElementById('btn-tab-paste');
    
    if(tab === 'upload') {
        btnUp.classList.add('border-cmRed', 'text-cmRed');
        btnUp.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
        btnPa.classList.remove('border-cmRed', 'text-cmRed');
        btnPa.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
    } else {
        btnPa.classList.add('border-cmRed', 'text-cmRed');
        btnPa.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
        btnUp.classList.remove('border-cmRed', 'text-cmRed');
        btnUp.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
    }
}

// --- UTILITIES ---
const cleanStr = (s) => (s !== undefined && s !== null) ? String(s).trim() : "";
const cleanNum = (n) => { const val = parseFloat(n); return isNaN(val) ? 0 : val; };
const extractStateCode = (pos) => cleanStr(pos).split("-")[0].trim();

// SMART COLUMN FINDER
const findKey = (obj, keyword) => {
    let keys = Object.keys(obj);
    let lowerKeyword = keyword.toLowerCase();
    let exact = keys.find(k => k.toLowerCase() === lowerKeyword);
    if (exact) return exact;
    let partial = keys.find(k => k.toLowerCase().includes(lowerKeyword) && !k.toLowerCase().includes("applicable"));
    if (partial) return partial;
    return keys.find(k => k.toLowerCase().includes(lowerKeyword));
};

function formatExcelDate(excelVal) {
    if (!excelVal) return "";
    let dateStr = String(excelVal).trim();
    if (!isNaN(dateStr) && !dateStr.includes('-') && !dateStr.includes('/')) {
        const date = new Date(Math.round((parseFloat(dateStr) - 25569) * 86400 * 1000));
        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr; 
    const months = {jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06', jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12'};
    const parts = dateStr.replace(/\//g, '-').split('-');
    if(parts.length === 3) {
        let d = parts[0].padStart(2, '0');
        let m = isNaN(parts[1]) ? months[parts[1].toLowerCase()] : parts[1].padStart(2, '0');
        let y = parts[2].length === 2 ? "20" + parts[2] : parts[2];
        if(d && m && y) return `${d}-${m}-${y}`;
    }
    return dateStr;
}

function normalizeRows(rows) {
    return rows.map(row => {
        let normalized = {};
        for (let k in row) normalized[k.toLowerCase().trim()] = row[k];
        return normalized;
    }).filter(row => Object.keys(row).length > 0);
}

function tsvToObjects(tsvText) {
    const rows = tsvText.trim().split('\n');
    if (rows.length < 2) return []; 
    const headers = rows[0].split('\t').map(h => cleanStr(h).toLowerCase());
    const data = [];
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split('\t');
        if (values.join('').trim() === '') continue; 
        let obj = {};
        headers.forEach((header, index) => { obj[header] = values[index]; });
        data.push(obj);
    }
    return data;
}

// --- CORE PARSER ENGINE ---
function parseSectionData(section, rows, userStateCode) {
    if (!rows || rows.length === 0) return;

    try {
        if (section === 'b2cs') {
            let arr = [];
            rows.forEach(row => {
                let posRaw = row[findKey(row, "place of supply")] || row[findKey(row, "place")];
                let pos = extractStateCode(posRaw);
                let rtRaw = row[findKey(row, "rate")];
                let rt = rtRaw !== undefined && rtRaw !== "" ? cleanNum(rtRaw) : 0; 
                let txval = cleanNum(row[findKey(row, "taxable value")] || row[findKey(row, "taxable")]);
                if (!pos || txval === 0) return;

                let typRaw = cleanStr(row[findKey(row, "type")]);
                let typ = typRaw.toLowerCase().includes("e-commerce") ? "E" : "OE";
                let csamt = cleanNum(row[findKey(row, "cess")]);
                let sply_ty = (pos === userStateCode) ? "INTRA" : "INTER";

                let b2csObj = { sply_ty: sply_ty, rt: rt, typ: typ, pos: pos, txval: txval };

                let taxAmt = Number((txval * rt / 100).toFixed(2));
                if (sply_ty === "INTRA") {
                    b2csObj.iamt = 0;
                    b2csObj.camt = Number((taxAmt / 2).toFixed(2));
                    b2csObj.samt = Number((taxAmt / 2).toFixed(2));
                } else {
                    b2csObj.iamt = taxAmt;
                    b2csObj.camt = 0;
                    b2csObj.samt = 0;
                }
                b2csObj.csamt = csamt;

                let existing = arr.find(item => item.pos === pos && item.rt === rt && item.typ === typ);
                if (existing) {
                    existing.txval = Number((existing.txval + b2csObj.txval).toFixed(2));
                    if (sply_ty === "INTRA") {
                        existing.camt = Number((existing.camt + b2csObj.camt).toFixed(2));
                        existing.samt = Number((existing.samt + b2csObj.samt).toFixed(2));
                    } else {
                        existing.iamt = Number((existing.iamt + b2csObj.iamt).toFixed(2));
                    }
                    existing.csamt = Number((existing.csamt + b2csObj.csamt).toFixed(2));
                } else {
                    arr.push(b2csObj);
                }
            });
            gstData.b2cs = arr;
        }
        else if (section === 'b2b') {
            let map = {};
            rows.forEach(row => {
                let ctin = cleanStr(row[findKey(row, "gstin")]);
                let inum = cleanStr(row[findKey(row, "invoice number")]);
                if (!ctin || !inum) return;

                let idt = formatExcelDate(row[findKey(row, "invoice date")]);
                let val = cleanNum(row[findKey(row, "invoice value")]);
                let pos = extractStateCode(row[findKey(row, "place of supply")]);
                let rchrg = cleanStr(row[findKey(row, "reverse charge")]) || "N";
                let inv_typ = cleanStr(row[findKey(row, "invoice type")]) || "R";
                if (inv_typ.toLowerCase().includes("regular")) inv_typ = "R";
                
                let rt = cleanNum(row[findKey(row, "rate")]);
                let txval = cleanNum(row[findKey(row, "taxable value")]);
                let csamt = cleanNum(row[findKey(row, "cess")]);

                if (!map[ctin]) map[ctin] = { ctin, inv: [] };
                let invObj = map[ctin].inv.find(i => i.inum === inum);
                if (!invObj) {
                    invObj = { inum, idt, val, pos, rchrg, inv_typ, itms: [] };
                    map[ctin].inv.push(invObj);
                }

                let taxAmt = Number((txval * rt / 100).toFixed(2));
                let itm_det = { txval, rt, csamt };
                if (pos === userStateCode) {
                    itm_det.camt = Number((taxAmt / 2).toFixed(2));
                    itm_det.samt = Number((taxAmt / 2).toFixed(2));
                } else {
                    itm_det.iamt = taxAmt;
                }
                invObj.itms.push({ num: invObj.itms.length + 1, itm_det });
            });
            gstData.b2b = Object.values(map);
        }
        else if (section === 'b2cl') {
            let map = {};
            rows.forEach(row => {
                let inum = cleanStr(row[findKey(row, "invoice number")]);
                if (!inum) return;

                let pos = extractStateCode(row[findKey(row, "place of supply")]);
                let idt = formatExcelDate(row[findKey(row, "invoice date")]);
                let val = cleanNum(row[findKey(row, "invoice value")]);
                let rt = cleanNum(row[findKey(row, "rate")]);
                let txval = cleanNum(row[findKey(row, "taxable value")]);
                let csamt = cleanNum(row[findKey(row, "cess")]);

                if (!map[pos]) map[pos] = { pos, inv: [] };
                let invObj = map[pos].inv.find(i => i.inum === inum);
                if (!invObj) {
                    invObj = { inum, idt, val, itms: [] };
                    map[pos].inv.push(invObj);
                }
                let itm_det = { txval, rt, iamt: Number((txval * rt / 100).toFixed(2)), csamt };
                invObj.itms.push({ num: invObj.itms.length + 1, itm_det });
            });
            gstData.b2cl = Object.values(map);
        }
        else if (section === 'cdnr') {
            let map = {};
            rows.forEach(row => {
                let ctin = cleanStr(row[findKey(row, "gstin")]);
                let nt_num = cleanStr(row[findKey(row, "note number")]);
                if (!ctin || !nt_num) return;
                let nt_dt = formatExcelDate(row[findKey(row, "note date")]);
                let ntty = cleanStr(row[findKey(row, "note type")]).charAt(0).toUpperCase();
                let val = cleanNum(row[findKey(row, "note value")]);
                let pos = extractStateCode(row[findKey(row, "place of supply")]);
                let rt = cleanNum(row[findKey(row, "rate")]);
                let txval = cleanNum(row[findKey(row, "taxable value")]);
                
                if (!map[ctin]) map[ctin] = { ctin, nt: [] };
                let ntObj = map[ctin].nt.find(n => n.nt_num === nt_num);
                if (!ntObj) { ntObj = { nt_num, nt_dt, ntty, val, pos, rchrg: "N", inv_typ: "R", itms: [] }; map[ctin].nt.push(ntObj); }
                
                let taxAmt = Number((txval * rt / 100).toFixed(2));
                let itm_det = { txval, rt, csamt: 0 };
                if(pos === userStateCode) { 
                    itm_det.camt = Number((taxAmt/2).toFixed(2)); 
                    itm_det.samt = Number((taxAmt/2).toFixed(2)); 
                    itm_det.iamt = 0;
                } else { 
                    itm_det.iamt = taxAmt; 
                }
                ntObj.itms.push({ num: ntObj.itms.length + 1, itm_det });
            });
            gstData.cdnr = Object.values(map);
        }
        else if (section === 'cdnur') {
            let arr = [];
            rows.forEach(row => {
                let nt_num = cleanStr(row[findKey(row, "note number")]);
                if (!nt_num) return;

                let typRaw = cleanStr(row[findKey(row, "ur type")]).toUpperCase();
                let typ = typRaw.includes("B2CL") ? "B2CL" : "EXPWP";
                let nt_dt = formatExcelDate(row[findKey(row, "note date")]);
                let ntty = cleanStr(row[findKey(row, "note type")]).charAt(0).toUpperCase();
                let val = cleanNum(row[findKey(row, "note value")]);
                let pos = extractStateCode(row[findKey(row, "place of supply")]);
                let rt = cleanNum(row[findKey(row, "rate")]);
                let txval = cleanNum(row[findKey(row, "taxable value")]);
                let csamt = cleanNum(row[findKey(row, "cess")]);

                let taxAmt = Number((txval * rt / 100).toFixed(2));
                let itm_det = { txval, rt, csamt };
                if(pos === userStateCode) { 
                    itm_det.camt = Number((taxAmt/2).toFixed(2)); 
                    itm_det.samt = Number((taxAmt/2).toFixed(2)); 
                } else { 
                    itm_det.iamt = taxAmt; 
                }
                
                arr.push({ typ, nt: [{ nt_num, nt_dt, ntty, val, pos, itms: [{ num: 1, itm_det }] }] });
            });
            gstData.cdnur = arr;
        }
        else if (section === 'exp') {
            let map = {};
            rows.forEach(row => {
                let exp_typRaw = cleanStr(row[findKey(row, "export type")]);
                let inum = cleanStr(row[findKey(row, "invoice number")]);
                if (!exp_typRaw || !inum) return;

                let exp_typ = exp_typRaw.includes("Without") ? "WOPAY" : "WPAY";
                let idt = formatExcelDate(row[findKey(row, "invoice date")]);
                let val = cleanNum(row[findKey(row, "invoice value")]);
                let rt = cleanNum(row[findKey(row, "rate")]);
                let txval = cleanNum(row[findKey(row, "taxable value")]);
                let csamt = cleanNum(row[findKey(row, "cess")]);

                if (!map[exp_typ]) map[exp_typ] = { exp_typ, inv: [] };
                let invObj = map[exp_typ].inv.find(i => i.inum === inum);
                if (!invObj) {
                    invObj = { inum, idt, val, itms: [] };
                    map[exp_typ].inv.push(invObj);
                }
                let itm_det = { txval, rt, csamt: csamt, iamt: (exp_typ === "WPAY") ? Number((txval * rt / 100).toFixed(2)) : 0 };
                invObj.itms.push(itm_det);
            });
            gstData.exp = Object.values(map);
        }
        else if (section === 'at' || section === 'atadj') {
            let map = {};
            rows.forEach(row => {
                let pos = extractStateCode(row[findKey(row, "place of supply")]);
                if (!pos) return;
                let rt = cleanNum(row[findKey(row, "rate")]);
                let amt = cleanNum(row[findKey(row, "gross advance")] || row[findKey(row, "adjusted")]);
                let csamt = cleanNum(row[findKey(row, "cess")]);
                let sply_ty = pos === userStateCode ? "INTRA" : "INTER";
                
                let key = `${pos}_${sply_ty}`;
                if (!map[key]) map[key] = { pos, sply_ty, itms: [] };
                
                let taxAmt = Number((amt * rt / 100).toFixed(2));
                let itm = { rt, csamt };
                if (section === 'at') itm.ad_amt = amt;
                else itm.ad_adj_amt = amt;
                
                if(pos === userStateCode) {
                    itm.camt = Number((taxAmt/2).toFixed(2));
                    itm.samt = Number((taxAmt/2).toFixed(2));
                } else {
                    itm.iamt = taxAmt;
                }
                map[key].itms.push(itm);
            });
            gstData[section] = Object.values(map);
        }
        else if (section === 'exemp' || section === 'nil') {
            let invArray = [];
            rows.forEach(row => {
                let sply_raw = cleanStr(row[findKey(row, "supply type")] || row[findKey(row, "description")] || row[findKey(row, "type")]);
                if(!sply_raw) return;
                
                let code = "INTRB2B";
                let rawLow = sply_raw.toLowerCase();
                if(rawLow.includes("inter") && rawLow.includes("unregistered")) code = "INTRB2C";
                else if(rawLow.includes("intra") && rawLow.includes("unregistered")) code = "INTRAB2C";
                else if(rawLow.includes("inter") && rawLow.includes("registered")) code = "INTRB2B";
                else if(rawLow.includes("intra") && rawLow.includes("registered")) code = "INTRAB2B";

                invArray.push({
                    sply_ty: code,
                    expt_amt: cleanNum(row[findKey(row, "exempted")]),
                    nil_amt: cleanNum(row[findKey(row, "nil")]),
                    ngsup_amt: cleanNum(row[findKey(row, "non-gst")] || row[findKey(row, "non gst")])
                });
            });
            gstData.nil.inv = invArray;
        }
        else if (section === 'hsn_b2b' || section === 'hsn_b2c') {
            let arr = [];
            let count = 1;
            rows.forEach(row => {
                let hsn_sc = cleanStr(row[findKey(row, "hsn")]);
                if(!hsn_sc) return;

                arr.push({
                    num: count++,
                    hsn_sc: hsn_sc,
                    desc: cleanStr(row[findKey(row, "description")]),
                    uqc: cleanStr(row[findKey(row, "uqc")]),
                    qty: cleanNum(row[findKey(row, "quantity")]),
                    rt: cleanNum(row[findKey(row, "rate")]),
                    txval: cleanNum(row[findKey(row, "taxable value")]),
                    iamt: cleanNum(row[findKey(row, "integrated")]),
                    camt: cleanNum(row[findKey(row, "central")]),
                    samt: cleanNum(row[findKey(row, "state")]),
                    csamt: cleanNum(row[findKey(row, "cess")])
                });
            });
            if (section === 'hsn_b2b') gstData.hsn.hsn_b2b = arr;
            else gstData.hsn.hsn_b2c = arr;
        }
        else if (section === 'eco' || section === 'supeco') {
            let arr = [];
            rows.forEach(row => {
                let etin = cleanStr(row[findKey(row, "ecommerce")] || row[findKey(row, "etin")] || row[findKey(row, "gstin")]);
                if(!etin) return;
                arr.push({
                    etin: etin,
                    suppval: cleanNum(row[findKey(row, "value")] || row[findKey(row, "suppval")]),
                    igst: cleanNum(row[findKey(row, "integrated")] || row[findKey(row, "igst")]),
                    cgst: cleanNum(row[findKey(row, "central")] || row[findKey(row, "cgst")]),
                    sgst: cleanNum(row[findKey(row, "state")] || row[findKey(row, "sgst")]),
                    cess: cleanNum(row[findKey(row, "cess")])
                });
            });
            gstData.supeco.paytx = arr;
        }
        else if (['ecob2b', 'ecob2c', 'ecourp2b', 'ecourp2c'].includes(section)) {
            // Parses the new Table 15 generic JSON arrays directly mapping column headers to avoid drops
            let arr = [];
            rows.forEach(row => {
                let obj = {};
                Object.keys(row).forEach(k => {
                   if(k !== '__rowNum__') obj[k.toLowerCase().replace(/ /g, '_')] = row[k];
                });
                if (Object.keys(obj).length > 0) arr.push(obj);
            });
            gstData[section] = arr;
        }
        else if (section === 'docs') {
            let map = {};
            rows.forEach(row => {
                let doc_typRaw = row[findKey(row, "nature of document")] || row[findKey(row, "nature")];
                let doc_typ = cleanStr(doc_typRaw);
                if(!doc_typ) return;

                const docTypes = [
                    "Invoices for outward supply", "Invoices for inward supply from unregistered person", 
                    "Revised Invoice", "Debit Note", "Credit Note", "Receipt Voucher", 
                    "Payment Voucher", "Refund Voucher", "Delivery Challan for job work", 
                    "Delivery Challan for supply on approval", "Delivery Challan in case of liquid gas", 
                    "Delivery Challan in cases other than by way of supply"
                ];
                let doc_num = docTypes.indexOf(doc_typ) + 1;
                if(doc_num === 0) doc_num = 1;

                if(!map[doc_typ]) map[doc_typ] = { doc_num, doc_typ, docs: [] };

                let fromVal = cleanStr(row[findKey(row, "from")]);
                let toVal = cleanStr(row[findKey(row, "to")]);
                let totnum = cleanNum(row[findKey(row, "total number")] || row[findKey(row, "total")]);
                let cancel = cleanNum(row[findKey(row, "cancelled")] || row[findKey(row, "cancel")]);

                if (fromVal) {
                    map[doc_typ].docs.push({
                        num: map[doc_typ].docs.length + 1,
                        to: String(toVal),
                        from: String(fromVal),
                        totnum: totnum,
                        cancel: cancel,
                        net_issue: totnum - cancel
                    });
                }
            });
            gstData.doc_issue.doc_det = Object.values(map);
        }
    } catch (error) {
        console.error(`Error parsing ${section}:`, error);
        throw new Error(`Failed parsing ${section}`);
    }
}

// --- AGGREGATION CALCULATOR ---
function calculateAggregates() {
    let agg = {
        b2b: { count: 0, txval: 0, iamt: 0, camt: 0, samt: 0 },
        b2cl: { count: 0, txval: 0, iamt: 0, camt: 0, samt: 0 },
        b2cs: { count: 0, txval: 0, iamt: 0, camt: 0, samt: 0 },
        cdnr: { count: 0, txval: 0, iamt: 0, camt: 0, samt: 0 },
        cdnur: { count: 0, txval: 0, iamt: 0, camt: 0, samt: 0 },
        exp: { count: 0, txval: 0, iamt: 0, camt: 0, samt: 0 },
        at: { count: 0 }, atadj: { count: 0 },
        exemp: { count: 0, txval: 0 },
        hsn_b2b: { count: 0, txval: 0, iamt: 0, camt: 0, samt: 0 },
        hsn_b2c: { count: 0, txval: 0, iamt: 0, camt: 0, samt: 0 },
        eco: { count: 0, txval: 0, iamt: 0, camt: 0, samt: 0 },
        ecob2b: { count: gstData.ecob2b.length },
        ecob2c: { count: gstData.ecob2c.length },
        ecourp2b: { count: gstData.ecourp2b.length },
        ecourp2c: { count: gstData.ecourp2c.length },
        docs: { count: 0 }
    };

    gstData.b2b.forEach(ctin => {
        agg.b2b.count += ctin.inv.length;
        ctin.inv.forEach(inv => inv.itms.forEach(itm => {
            agg.b2b.txval += itm.itm_det.txval || 0;
            agg.b2b.iamt += itm.itm_det.iamt || 0;
            agg.b2b.camt += itm.itm_det.camt || 0;
            agg.b2b.samt += itm.itm_det.samt || 0;
        }));
    });

    gstData.b2cl.forEach(pos => {
        agg.b2cl.count += pos.inv.length;
        pos.inv.forEach(inv => inv.itms.forEach(itm => {
            agg.b2cl.txval += itm.itm_det.txval || 0;
            agg.b2cl.iamt += itm.itm_det.iamt || 0;
        }));
    });

    gstData.b2cs.forEach(item => {
        agg.b2cs.count++;
        agg.b2cs.txval += item.txval || 0;
        agg.b2cs.iamt += item.iamt || 0;
        agg.b2cs.camt += item.camt || 0;
        agg.b2cs.samt += item.samt || 0;
    });

    gstData.cdnr.forEach(ctin => {
        agg.cdnr.count += ctin.nt.length;
        ctin.nt.forEach(nt => nt.itms.forEach(itm => {
            agg.cdnr.txval += itm.itm_det.txval || 0;
            agg.cdnr.iamt += itm.itm_det.iamt || 0;
            agg.cdnr.camt += itm.itm_det.camt || 0;
            agg.cdnr.samt += itm.itm_det.samt || 0;
        }));
    });

    gstData.cdnur.forEach(typ => {
        agg.cdnur.count += typ.nt.length;
        typ.nt.forEach(nt => nt.itms.forEach(itm => {
            agg.cdnur.txval += itm.itm_det.txval || 0;
            agg.cdnur.iamt += itm.itm_det.iamt || 0;
            agg.cdnur.camt += itm.itm_det.camt || 0;
            agg.cdnur.samt += itm.itm_det.samt || 0;
        }));
    });

    gstData.exp.forEach(et => {
        agg.exp.count += et.inv.length;
        et.inv.forEach(inv => inv.itms.forEach(itm => {
            agg.exp.txval += itm.txval || 0;
            agg.exp.iamt += itm.iamt || 0;
        }));
    });

    gstData.at.forEach(rec => agg.at.count += rec.itms.length);
    gstData.atadj.forEach(rec => agg.atadj.count += rec.itms.length);

    if (gstData.nil.inv) {
        gstData.nil.inv.forEach(n => {
            agg.exemp.count++;
            agg.exemp.txval += (n.expt_amt || 0) + (n.nil_amt || 0) + (n.ngsup_amt || 0);
        });
    }

    if (gstData.hsn.hsn_b2b) {
        gstData.hsn.hsn_b2b.forEach(h => {
            agg.hsn_b2b.count++;
            agg.hsn_b2b.txval += h.txval || 0;
            agg.hsn_b2b.iamt += h.iamt || 0;
            agg.hsn_b2b.camt += h.camt || 0;
            agg.hsn_b2b.samt += h.samt || 0;
        });
    }
    
    if (gstData.hsn.hsn_b2c) {
        gstData.hsn.hsn_b2c.forEach(h => {
            agg.hsn_b2c.count++;
            agg.hsn_b2c.txval += h.txval || 0;
            agg.hsn_b2c.iamt += h.iamt || 0;
            agg.hsn_b2c.camt += h.camt || 0;
            agg.hsn_b2c.samt += h.samt || 0;
        });
    }

    if (gstData.supeco.paytx) {
        gstData.supeco.paytx.forEach(eco => {
            agg.eco.count++;
            agg.eco.txval += eco.suppval || 0;
            agg.eco.iamt += eco.igst || 0;
            agg.eco.camt += eco.cgst || 0;
            agg.eco.samt += eco.sgst || 0;
        });
    }

    if (gstData.doc_issue.doc_det) {
        gstData.doc_issue.doc_det.forEach(d => {
            d.docs.forEach(doc => { agg.docs.count += doc.net_issue || 0; });
        });
    }

    return agg;
}

function renderSummaryCards() {
    const agg = calculateAggregates();
    const container = document.getElementById('statusBadges');
    if(!container) return;
    
    container.innerHTML = ''; 

    const keys = ['b2b', 'b2cl', 'b2cs', 'cdnr', 'cdnur', 'exp', 'at', 'atadj', 'exemp', 'hsn_b2b', 'hsn_b2c', 'docs', 'eco', 'ecob2b', 'ecob2c', 'ecourp2b', 'ecourp2c'];
    const labels = {
        b2b: '1. B2B', b2cl: '2. B2CL', b2cs: '3. B2CS', cdnr: '4. CDNR', cdnur: '5. CDNUR', exp: '6. EXP', at: '7. AT', atadj: '8. ATADJ', exemp: '9. EXEMP',
        hsn_b2b: '10. HSN (B2B)', hsn_b2c: '11. HSN (B2C)', docs: '12. DOCS', eco: '13. ECO (SUPECO)', ecob2b: '14. ECO B2B', ecob2c: '15. ECO B2C', ecourp2b: '16. ECO URP2B', ecourp2c: '17. ECO URP2C'
    };

    let activeCount = 0;

    keys.forEach(k => {
        let data = agg[k];
        if (data.count > 0) {
            activeCount++;
            let html = `
            <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 transition-colors">
                <div class="font-bold text-navy dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2 mb-2 flex justify-between items-center">
                    <span class="tracking-wide text-xs">${labels[k]}</span>
                    <span class="text-[10px] font-bold bg-cmRed text-white px-2 py-0.5 rounded shadow-sm">CNT: ${data.count}</span>
                </div>`;

            if (!['docs', 'at', 'atadj', 'ecob2b', 'ecob2c', 'ecourp2b', 'ecourp2c'].includes(k)) {
                html += `<div class="flex justify-between text-[11px] text-gray-600 dark:text-gray-300 mb-1.5"><span class="font-medium uppercase tracking-wider">Taxable:</span> <span class="font-mono font-bold text-navy dark:text-white">₹${data.txval.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>`;
                
                if (['b2b', 'b2cs', 'cdnr', 'cdnur', 'eco', 'hsn_b2b', 'hsn_b2c'].includes(k)) {
                    html += `<div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1"><span>IGST:</span> <span class="font-mono">₹${data.iamt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>`;
                    html += `<div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1"><span>CGST:</span> <span class="font-mono">₹${data.camt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>`;
                    html += `<div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400"><span>SGST:</span> <span class="font-mono">₹${data.samt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>`;
                }
                if (['exp', 'b2cl'].includes(k)) {
                    html += `<div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400"><span>IGST:</span> <span class="font-mono">₹${data.iamt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>`;
                }
            } else if (k === 'docs') {
                html += `<div class="text-[11px] font-medium text-gray-600 dark:text-gray-300 mt-2">Total Net Issued: <span class="font-bold text-navy dark:text-white">${data.count}</span></div>`;
            } else {
                html += `<div class="text-[11px] font-medium text-gray-600 dark:text-gray-300 mt-2">Records Captured Successfully.</div>`;
            }

            html += `</div>`;
            container.innerHTML += html;
        }
    });

    if (activeCount === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-8 text-gray-400 text-sm font-medium border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">No data loaded. Upload an Excel file or paste data to view aggregates.</div>`;
    }
}

// --- OPTION 1: EXCEL PROCESSING ---
function processExcelFile() {
    const fileInput = document.getElementById('excelFile');
    const gstinInput = document.getElementById('gstin').value.trim();
    if(gstinInput.length < 2) { alert("Please enter valid GSTIN."); return; }
    if (!fileInput.files.length) { alert("Please upload an Excel file."); return; }

    const userStateCode = gstinInput.substring(0, 2);
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const workbook = XLSX.read(new Uint8Array(e.target.result), {type: 'array'});
            
            // Map 17 standard sheets
            const sheetMapping = {
                'b2b': 'b2b', 'b2b,sez,de': 'b2b', 
                'b2cl': 'b2cl', 
                'b2cs': 'b2cs',
                'cdnr': 'cdnr', 
                'cdnur': 'cdnur', 
                'exp': 'exp', 
                'at': 'at', 
                'atadj': 'atadj',
                'nil': 'exemp', 'nilrated': 'exemp', 'exemp': 'exemp', 
                'hsn(b2b)': 'hsn_b2b', 'hsn(b2c)': 'hsn_b2c', 'hsn': 'hsn_b2b', 
                'docs': 'docs', 
                'eco': 'eco', 'supeco': 'eco',
                'ecob2b': 'ecob2b', 'ecob2c': 'ecob2c', 'ecourp2b': 'ecourp2b', 'ecourp2c': 'ecourp2c'
            };

            let processedCount = 0;
            workbook.SheetNames.forEach(sheetName => {
                let cleanName = sheetName.toLowerCase().replace(/ /g, '');
                let targetSection = sheetMapping[cleanName] || sheetMapping[sheetName.toLowerCase()];
                
                if(targetSection) {
                    let rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {range: 3, defval: ""});
                    let normalizedRows = normalizeRows(rawRows);
                    
                    if (normalizedRows.length === 0) { 
                         rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {defval: ""});
                         normalizedRows = normalizeRows(rawRows);
                    }

                    if (normalizedRows.length > 0) {
                        parseSectionData(targetSection, normalizedRows, userStateCode);
                        processedCount++;
                    }
                }
            });
            renderSummaryCards();
            alert(`Success! Extracted data from ${processedCount} mapped sheets.`);
        } catch (error) {
            console.error(error);
            alert("Error reading Excel. Please ensure it's the standard GSTR-1 template.");
        }
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
}

// --- OPTION 2: PASTE SECTION ---
function processPastedSection() {
    const gstinInput = document.getElementById('gstin').value.trim();
    if(gstinInput.length < 2) { alert("Please enter valid GSTIN."); return; }
    
    const userStateCode = gstinInput.substring(0, 2);
    const section = document.getElementById('sectionSelect').value;
    const text = document.getElementById('pasteArea').value;
    
    if(!text) { alert("Please paste data first."); return; }

    const rows = tsvToObjects(text);
    if(rows.length === 0) { alert("Could not parse data. Ensure you include the header row."); return; }

    try {
        parseSectionData(section, rows, userStateCode);
        renderSummaryCards();
        document.getElementById('pasteArea').value = "";
        alert(`${section.toUpperCase()} section added to memory successfully!`);
    } catch (error) {
        alert(`Error parsing data. Make sure copied columns match ${section.toUpperCase()} format.`);
    }
}

function clearData() {
    if(confirm("Are you sure you want to clear all memory?")) {
        gstData = { 
            b2b: [], b2cl: [], b2cs: [], cdnr: [], cdnur: [], exp: [], 
            at: [], atadj: [], nil: { inv: [] }, 
            hsn: { hsn_b2b: [], hsn_b2c: [] }, doc_issue: { doc_det: [] }, supeco: { paytx: [] },
            ecob2b: [], ecob2c: [], ecourp2b: [], ecourp2c: []
        };
        renderSummaryCards();
        document.getElementById('pasteArea').value = "";
        document.getElementById('excelFile').value = "";
    }
}

function generateJSON() {
    const gstinInput = document.getElementById('gstin').value.trim().toUpperCase();
    const fpInput = document.getElementById('fp').value.trim();

    if (gstinInput.length !== 15 || fpInput.length !== 6) {
        alert("Valid 15-digit GSTIN and 6-digit Return Period (MMYYYY) are required to generate JSON.");
        return;
    }

    const finalJson = { gstin: gstinInput, fp: fpInput, version: "GST3.2.4", hash: "hash" };

    // Inject 17 tables if populated
    if (gstData.b2b.length > 0) finalJson.b2b = gstData.b2b;
    if (gstData.b2cl.length > 0) finalJson.b2cl = gstData.b2cl;
    if (gstData.b2cs.length > 0) finalJson.b2cs = gstData.b2cs;
    if (gstData.cdnr.length > 0) finalJson.cdnr = gstData.cdnr;
    if (gstData.cdnur.length > 0) finalJson.cdnur = gstData.cdnur;
    if (gstData.exp.length > 0) finalJson.exp = gstData.exp;
    if (gstData.at.length > 0) finalJson.at = gstData.at;
    if (gstData.atadj.length > 0) finalJson.atadj = gstData.atadj;
    if (gstData.nil.inv && gstData.nil.inv.length > 0) finalJson.nil = gstData.nil;
    if (gstData.doc_issue.doc_det && gstData.doc_issue.doc_det.length > 0) finalJson.doc_issue = gstData.doc_issue;
    if ((gstData.hsn.hsn_b2b && gstData.hsn.hsn_b2b.length > 0) || (gstData.hsn.hsn_b2c && gstData.hsn.hsn_b2c.length > 0)) finalJson.hsn = gstData.hsn;
    if (gstData.supeco.paytx && gstData.supeco.paytx.length > 0) finalJson.supeco = gstData.supeco;
    if (gstData.ecob2b.length > 0) finalJson.ecob2b = gstData.ecob2b;
    if (gstData.ecob2c.length > 0) finalJson.ecob2c = gstData.ecob2c;
    if (gstData.ecourp2b.length > 0) finalJson.ecourp2b = gstData.ecourp2b;
    if (gstData.ecourp2c.length > 0) finalJson.ecourp2c = gstData.ecourp2c;

    if(Object.keys(finalJson).length === 4) {
        alert("No data processed! Please upload a file or paste data before downloading.");
        return;
    }

    const jsonString = JSON.stringify(finalJson, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `returns_${fpInput}_R1_${gstinInput}_offline.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
