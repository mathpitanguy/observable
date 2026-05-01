import { html } from "npm:htl";

const COLS = [
  { key:"uo_cod",     label:"UO Cód",           type:"text",  width:75  },
  { key:"uo_sigla",   label:"UO",               type:"text",  width:100 },
  { key:"fonte_cod",  label:"Fonte Cód",         type:"text",  width:80  },
  { key:"fonte_desc", label:"Fonte de Recursos", type:"text",  width:230 },
  { key:"alertas",    label:"Alerta",            type:"alert", width:190 },
  { key:"val2024",    label:"2024",              type:"num",   width:120 },
  { key:"val2025",    label:"2025",              type:"num",   width:120 },
  { key:"val2026",    label:"2026 Reest",        type:"num",   width:125 },
  { key:"val2027",    label:"2027 LDO",          type:"num",   width:120 },
];

const ALERT_COLORS = {
  "OK":                                                  { bg:"#ecfdf5", color:"#059669", icon:"🟢" },
  "RECEITA A SER INFORMADA PELA DCGCE/SEPLAG":           { bg:"#f5f3ff", color:"#7c3aed", icon:"🟣" },
  "ATENCAO":                                             { bg:"#fffbeb", color:"#d97706", icon:"🟠" },
  "VALOR DISCREPANTE":                                   { bg:"#fef3c7", color:"#b45309", icon:"⚠️"  },
  "RECEITA NAO ESTIMADA":                                { bg:"#fef2f2", color:"#dc2626", icon:"🔴" },
  "RECEITA DE REPASSE DO FES E LANCADA PELA SPLOR":      { bg:"#eff6ff", color:"#2563eb", icon:"🔵" },
  "RECEITA DE CONVENIOS EM FONTE NAO ESPERADA":          { bg:"#fef3c7", color:"#92400e", icon:"🟤" },
};

function alertStyle(text) {
  const k = String(text ?? "").toUpperCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return ALERT_COLORS[k] ?? { bg:"#f8fafc", color:"#64748b", icon:"📌" };
}

function parseLocaleNum(s) {
  return parseFloat(String(s).replace(/\./g,"").replace(",","."));
}

function applyFilters(data, filters) {
  return data.filter(row => {
    for (const col of COLS) {
      const q = (filters[col.key]??"").trim();
      if (!q) continue;
      if (col.type === "num") {
        const v = +row[col.key]||0;
        const t = parseLocaleNum(q);
        if (!isNaN(t) && v < t) return false;
      } else {
        if (!String(row[col.key]??"").toLowerCase().includes(q.toLowerCase())) return false;
      }
    }
    return true;
  });
}

const PAGE_SIZE = 25;

export function buildFonteTable(data, { fmtBRL, fmtN } = {}) {
  const state = {
    filters: Object.fromEntries(COLS.map(c => [c.key,""])),
    sortKey:"val2025", sortDir:-1, page:0, data,
    fmtBRL: fmtBRL ?? (v => v?.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})),
    fmtN:   fmtN   ?? (v => (+v).toLocaleString("pt-BR")),
  };
  const root = html`<div class="ft-wrap"></div>`;
  renderFonte(root, state);
  return root;
}

function renderFonte(root, state) {
  const filtered   = applyFilters(state.data, state.filters);
  const sorted     = [...filtered].sort((a,b) => {
    const va=a[state.sortKey]??"", vb=b[state.sortKey]??"";
    return state.sortDir*(va<vb?-1:va>vb?1:0);
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length/PAGE_SIZE));
  const page       = Math.min(state.page, totalPages-1);
  const pageSlice  = sorted.slice(page*PAGE_SIZE, (page+1)*PAGE_SIZE);
  const totalWidth = COLS.reduce((s,c)=>s+c.width,0);

  root.innerHTML = "";
  root.appendChild(html`<style>
    .ft-wrap{font-family:var(--sans-serif,system-ui);font-size:12px}
    .ft-meta{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;color:var(--theme-foreground-muted,#666);font-size:11px}
    .ft-scroll{overflow-x:auto;border:1px solid var(--theme-foreground-faintest,#e5e7eb);border-radius:6px}
    table.ft2{border-collapse:collapse;min-width:${totalWidth}px;width:100%}
    table.ft2 thead tr.fth th{background:var(--theme-background-alt,#f8fafc);border-bottom:2px solid #e2e8f0;padding:6px 8px 4px;text-align:left;font-weight:600;white-space:nowrap;cursor:pointer;user-select:none;position:sticky;top:0;z-index:1}
    table.ft2 thead tr.fth th:hover{background:var(--theme-background,#f1f5f9)}
    table.ft2 thead tr.fth th.num{text-align:right}
    .sa{margin-left:4px;font-size:10px;opacity:.5}.sa.active{opacity:1;color:#2563eb}
    table.ft2 thead tr.ftf th{background:var(--theme-background,#fff);border-bottom:1px solid #e2e8f0;padding:3px 6px;position:sticky;top:33px;z-index:1}
    .ftf input{width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:4px;padding:2px 5px;font-size:11px;background:var(--theme-background,#fff);color:var(--theme-foreground,#111);outline:none}
    .ftf input:focus{border-color:#2563eb;box-shadow:0 0 0 2px #2563eb22}
    table.ft2 tbody tr{border-bottom:1px solid #f1f5f9}
    table.ft2 tbody tr:hover{background:var(--theme-background-alt,#f8fafc)}
    table.ft2 tbody td{padding:5px 8px;white-space:nowrap;max-width:0;overflow:hidden;text-overflow:ellipsis;color:var(--theme-foreground,#111)}
    table.ft2 tbody td.num{text-align:right;font-variant-numeric:tabular-nums;font-size:11.5px}
    table.ft2 tbody td.num.neg{color:#dc2626}
    .ft-pager{display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-top:8px;font-size:11px;color:var(--theme-foreground-muted,#666)}
    .ft-pager button{border:1px solid #d1d5db;background:var(--theme-background,#fff);border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px}
    .ft-pager button:disabled{opacity:.4;cursor:default}
    .ft-pager button:not(:disabled):hover{background:var(--theme-background-alt,#f1f5f9)}
    .ft-clear{border:none;background:none;color:#2563eb;cursor:pointer;font-size:11px;text-decoration:underline;padding:0}
    .ab2{display:inline-flex;align-items:center;gap:4px;border-radius:5px;padding:2px 7px;font-size:10.5px;font-weight:600;white-space:nowrap}
  </style>`);

  root.appendChild(html`<div class="ft-meta">
    <span>${state.fmtN(filtered.length)} registros · página ${page+1} de ${totalPages}</span>
    <button class="ft-clear" onclick=${()=>{COLS.forEach(c=>{state.filters[c.key]=""});state.page=0;renderFonte(root,state)}}>✕ Limpar filtros</button>
  </div>`);

  const scroll=html`<div class="ft-scroll"></div>`;
  const table=html`<table class="ft2"></table>`;
  const thead=html`<thead></thead>`;

  const rowH=html`<tr class="fth"></tr>`;
  for (const col of COLS) {
    const active=state.sortKey===col.key;
    const th=html`<th class=${col.type==="num"?"num":""} style="width:${col.width}px;min-width:${col.width}px">
      ${col.label}<span class=${"sa"+(active?" active":"")}>${active?(state.sortDir===-1?"▼":"▲"):"↕"}</span>
    </th>`;
    th.addEventListener("click",()=>{
      if(state.sortKey===col.key) state.sortDir*=-1;
      else{state.sortKey=col.key;state.sortDir=col.type==="num"?-1:1}
      state.page=0;renderFonte(root,state);
    });
    rowH.appendChild(th);
  }
  thead.appendChild(rowH);

  const rowF=html`<tr class="ftf"></tr>`;
  for (const col of COLS) {
    const inp=html`<input type="text" placeholder=${col.type==="num"?"≥ valor…":"filtrar…"} value=${state.filters[col.key]}/>`;
    inp.addEventListener("input",e=>{state.filters[col.key]=e.target.value;state.page=0;renderFonte(root,state);});
    rowF.appendChild(html`<th style="width:${col.width}px;min-width:${col.width}px">${inp}</th>`);
  }
  thead.appendChild(rowF);
  table.appendChild(thead);

  const tbody=html`<tbody></tbody>`;
  for (const row of pageSlice) {
    const tr=html`<tr></tr>`;
    for (const col of COLS) {
      const raw=row[col.key];
      if (col.type==="alert") {
        const st=alertStyle(raw);
        tr.appendChild(html`<td><span class="ab2" style="background:${st.bg};color:${st.color}">${st.icon} ${raw??""}</span></td>`);
      } else if (col.type==="num") {
        const v=+raw||0;
        tr.appendChild(html`<td class=${"num"+(v<0?" neg":"")} title=${state.fmtBRL(v)}>${state.fmtBRL(v)}</td>`);
      } else {
        tr.appendChild(html`<td title=${raw??""}>${raw??""}</td>`);
      }
    }
    tbody.appendChild(tr);
  }
  if (!pageSlice.length) tbody.appendChild(html`<tr><td colspan=${COLS.length} style="text-align:center;padding:24px;color:#999">Nenhum registro encontrado.</td></tr>`);
  table.appendChild(tbody);
  scroll.appendChild(table);
  root.appendChild(scroll);

  root.appendChild(html`<div class="ft-pager">
    Linhas ${page*PAGE_SIZE+1}–${Math.min((page+1)*PAGE_SIZE,filtered.length)} de ${state.fmtN(filtered.length)}
    <button disabled=${page===0} onclick=${()=>{state.page=page-1;renderFonte(root,state)}}>‹ Anterior</button>
    <button disabled=${page>=totalPages-1} onclick=${()=>{state.page=page+1;renderFonte(root,state)}}>Próximo ›</button>
  </div>`);
}
