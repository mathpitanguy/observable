---
title: Painel de Gestão Orçamentária
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

.bi-wrap * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }

/* ── Layout ─────────────────────────────────────── */
.bi-wrap      { display: flex; min-height: 100vh; background: #f0f4f9; color: #1e293b; }
.bi-sidebar   { width: 232px; min-width: 232px; background: #16213e; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; flex-shrink: 0; }
.bi-main      { flex: 1; min-width: 0; display: flex; flex-direction: column; }

/* ── Sidebar ─────────────────────────────────────── */
.bi-sb-brand  { padding: 24px 18px 18px; border-bottom: 1px solid rgba(255,255,255,0.07); }
.bi-sb-logo   { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.bi-sb-dot    { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; }
.bi-sb-title  { color: #f1f5f9; font-size: 13px; font-weight: 700; letter-spacing: 0.01em; line-height: 1.3; }
.bi-sb-period { color: #475569; font-size: 11px; font-weight: 400; margin-top: 2px; }

.bi-sb-section       { padding: 20px 16px 6px; }
.bi-sb-section-label { color: #334155; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 14px; }

.bi-fg        { margin-bottom: 13px; }
.bi-fg label  { display: block; color: #64748b; font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; }
.bi-fg select,
.bi-fg input  { width: 100%; padding: 7px 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); border-radius: 6px; color: #cbd5e1; font-size: 12px; font-family: inherit; transition: border-color 0.15s, background 0.15s; -webkit-appearance: none; appearance: none; }
.bi-fg select:focus,
.bi-fg input:focus { outline: none; border-color: #3b82f6; background: rgba(59,130,246,0.1); }
.bi-fg select option { background: #1e293b; color: #e2e8f0; }

.bi-btn-clear { display: block; width: calc(100% - 32px); margin: 4px 16px 22px; padding: 8px; background: transparent; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: #475569; font-size: 11px; font-family: inherit; cursor: pointer; font-weight: 500; transition: all 0.15s; text-align: center; }
.bi-btn-clear:hover { border-color: #ef4444; color: #f87171; background: rgba(239,68,68,0.08); }

/* ── Topbar ─────────────────────────────────────── */
.bi-topbar    { background: #fff; padding: 18px 28px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; }
.bi-topbar-l  {}
.bi-topbar-title { font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.015em; }
.bi-topbar-sub   { font-size: 12px; color: #94a3b8; font-weight: 400; margin-top: 2px; }
.bi-badge     { font-size: 11px; font-weight: 600; color: #3b82f6; background: #eff6ff; padding: 4px 10px; border-radius: 20px; border: 1px solid #bfdbfe; }

/* ── KPI bar ─────────────────────────────────────── */
.bi-kpi-bar   { display: grid; grid-template-columns: repeat(4, 1fr); background: #fff; border-bottom: 1px solid #e2e8f0; }
.bi-kpi       { padding: 18px 24px; border-right: 1px solid #f1f5f9; transition: background 0.12s; }
.bi-kpi:last-child { border-right: none; }
.bi-kpi:hover { background: #f8fafc; }
.bi-kpi-label { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 8px; }
.bi-kpi-val   { font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; line-height: 1; margin-bottom: 5px; }
.bi-kpi-val.pos { color: #16a34a; }
.bi-kpi-val.neg { color: #dc2626; }
.bi-kpi-sub   { font-size: 11px; color: #64748b; font-weight: 400; }
.bi-kpi-bar-bottom { width: 36px; height: 3px; border-radius: 2px; margin-top: 10px; background: #e2e8f0; }
.bi-kpi-bar-fill  { height: 100%; border-radius: 2px; background: #3b82f6; }

/* ── Section ─────────────────────────────────────── */
.bi-section   { margin: 22px 24px; background: #fff; border-radius: 10px; border: 1px solid #e4eaf3; overflow: hidden; }
.bi-sec-head  { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
.bi-sec-title { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; }
.bi-sec-count { font-size: 11px; color: #94a3b8; font-weight: 400; }

/* ── Table ─────────────────────────────────────── */
.bi-tbl-wrap  { overflow-x: auto; }
.bi-tbl       { width: 100%; border-collapse: collapse; font-size: 13px; }

.bi-tbl thead th { background: #f8fafc; border-bottom: 2px solid #e4eaf3; padding: 0; white-space: nowrap; position: relative; }
.bi-th-in     { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; gap: 8px; cursor: pointer; user-select: none; }
.bi-th-in:hover { background: #f1f5f9; }
.bi-th-in span:first-child { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; }

.bi-filt-btn  { width: 20px; height: 20px; flex-shrink: 0; border: 1px solid #e2e8f0; border-radius: 4px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #94a3b8; padding: 0; transition: all 0.12s; }
.bi-filt-btn:hover, .bi-filt-btn.on { background: #2563eb; border-color: #2563eb; color: #fff; }

.bi-filt-dd   { display: none; position: absolute; top: 100%; left: 0; z-index: 1000; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.10); padding: 10px; min-width: 180px; }
.bi-filt-dd.open { display: block; }
.bi-dd-search { width: 100%; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 5px; font-size: 12px; font-family: inherit; margin-bottom: 7px; color: #334155; outline: none; }
.bi-dd-search:focus { border-color: #2563eb; }
.bi-dd-list   { max-height: 160px; overflow-y: auto; }
.bi-dd-item   { display: flex; align-items: center; gap: 8px; padding: 4px 3px; font-size: 12px; color: #334155; cursor: pointer; border-radius: 4px; }
.bi-dd-item:hover { background: #f8fafc; }
.bi-dd-item input[type=checkbox] { cursor: pointer; accent-color: #2563eb; flex-shrink: 0; }
.bi-dd-acts   { display: flex; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #f1f5f9; }
.bi-dd-acts button { flex: 1; padding: 5px; border: 1px solid #e2e8f0; border-radius: 5px; background: #f8fafc; font-size: 11px; font-family: inherit; cursor: pointer; color: #475569; font-weight: 500; }
.bi-dd-acts button:hover { border-color: #2563eb; color: #2563eb; }

.bi-tbl tbody td { padding: 9px 16px; border-bottom: 1px solid #f4f6fb; color: #334155; font-size: 13px; white-space: nowrap; }
.bi-tbl tbody tr:hover td { background: #f8fafc; }
.bi-tbl tbody tr:last-child td { border-bottom: none; }
.bi-td-r      { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
.bi-td-pos    { color: #16a34a; }
.bi-td-neg    { color: #dc2626; }
.bi-pill      { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.bi-pill-blue { background: #eff6ff; color: #1d4ed8; }
.bi-pill-grn  { background: #f0fdf4; color: #15803d; }
.bi-pill-red  { background: #fef2f2; color: #b91c1c; }
.bi-tbl-foot  { padding: 9px 20px; font-size: 11px; color: #94a3b8; text-align: right; border-top: 1px solid #f1f5f9; }

/* ── Pivot config ─────────────────────────────────────── */
.bi-pv-cfg    { display: flex; gap: 14px; padding: 14px 20px; background: #f8fafc; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap; align-items: flex-end; }
.bi-pv-grp    { display: flex; flex-direction: column; gap: 5px; min-width: 130px; }
.bi-pv-label  { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
.bi-pv-sel    { padding: 7px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; font-family: inherit; color: #334155; background: #fff; cursor: pointer; outline: none; transition: border-color 0.12s; -webkit-appearance: none; appearance: none; }
.bi-pv-sel:focus { border-color: #2563eb; }

/* ── Pivot table ─────────────────────────────────────── */
.bi-pv-result { overflow-x: auto; }
.bi-pv-tbl    { width: 100%; border-collapse: collapse; font-size: 13px; }
.bi-pv-tbl thead th { background: #f8fafc; padding: 10px 16px; text-align: right; font-size: 10.5px; font-weight: 700; color: #64748b; border-bottom: 2px solid #e4eaf3; border-right: 1px solid #f1f5f9; text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap; }
.bi-pv-tbl thead th.row-h { text-align: left; min-width: 140px; }
.bi-pv-tbl thead th.tot-h { background: #eef2ff; color: #4338ca; border-right: none; }
.bi-pv-tbl tbody td { padding: 9px 16px; text-align: right; border-bottom: 1px solid #f4f6fb; border-right: 1px solid #f8fafc; font-variant-numeric: tabular-nums; color: #334155; font-size: 13px; }
.bi-pv-tbl tbody td.row-l { text-align: left; font-weight: 600; color: #1e293b; }
.bi-pv-tbl tbody td.tot-c { background: #f5f3ff; font-weight: 600; color: #4338ca; border-right: none; }
.bi-pv-tbl tbody tr:hover td { background: #f8fafc; }
.bi-pv-tbl tbody tr:hover td.tot-c { background: #ede9fe; }
.bi-pv-tbl tfoot td { padding: 10px 16px; text-align: right; background: #f1f5f9; font-weight: 700; color: #334155; border-top: 2px solid #e4eaf3; font-size: 13px; font-variant-numeric: tabular-nums; }
.bi-pv-tbl tfoot td.row-l { text-align: left; color: #0f172a; }
.bi-pv-tbl tfoot td.tot-c { background: #e0e7ff; color: #3730a3; border-right: none; }
</style>

```js
const dados = await FileAttachment("data/dados.csv").csv({ typed: true });
const colunas = Object.keys(dados[0] || {});
```

```js
{
  /* ── Helpers ─────────────────────────────────────────────── */
  const LABELS = {
    id: "ID", data: "Data", departamento: "Departamento",
    categoria: "Categoria", valor_orcado: "Valor Orçado",
    valor_realizado: "Valor Realizado"
  };
  const lbl = col => LABELS[col] || col.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const colsTexto = colunas.filter(c => typeof dados[0][c] === "string");
  const colsNum   = colunas.filter(c => typeof dados[0][c] === "number");

  const fmtBRL = v => "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtNum = (v, agg) => agg === "count" ? Number(v).toLocaleString("pt-BR") : fmtBRL(v);

  const uniq = {};
  colunas.forEach(c => { uniq[c] = [...new Set(dados.map(d => String(d[c] ?? "")))].sort(); });

  /* ── Estado dos filtros ──────────────────────────────────── */
  const sF = {}; // sidebar
  const hF = {}; // header checkboxes (null = todos)
  colunas.forEach(c => { sF[c] = ""; hF[c] = null; });

  function filtrados() {
    return dados.filter(row => colunas.every(c => {
      const s = (sF[c] ?? "").toString().toLowerCase().trim();
      if (s && !String(row[c] ?? "").toLowerCase().includes(s)) return false;
      if (hF[c] !== null && !hF[c].has(String(row[c] ?? ""))) return false;
      return true;
    }));
  }

  /* ── KPIs ────────────────────────────────────────────────── */
  const totOrc  = dados.reduce((s, r) => s + (r.valor_orcado || 0), 0);
  const totReal = dados.reduce((s, r) => s + (r.valor_realizado || 0), 0);
  const delta   = totReal - totOrc;
  const execPct = (totReal / totOrc * 100).toFixed(1);

  const kpiBar = document.createElement("div");
  kpiBar.className = "bi-kpi-bar";

  function mkKPI(label, value, sub, cls, barPct) {
    const k = document.createElement("div"); k.className = "bi-kpi";
    k.innerHTML = `
      <div class="bi-kpi-label">${label}</div>
      <div class="bi-kpi-val ${cls || ""}">${value}</div>
      <div class="bi-kpi-sub">${sub}</div>
      <div class="bi-kpi-bar-bottom"><div class="bi-kpi-bar-fill" style="width:${barPct || 0}%; background:${cls === 'pos' ? '#16a34a' : cls === 'neg' ? '#dc2626' : '#3b82f6'}"></div></div>`;
    return k;
  }

  kpiBar.appendChild(mkKPI("Total Orçado",    fmtBRL(totOrc),              `${dados.length} registros`, "",    100));
  kpiBar.appendChild(mkKPI("Total Realizado", fmtBRL(totReal),             `${execPct}% executado`,     "",    parseFloat(execPct)));
  kpiBar.appendChild(mkKPI("Variação",        fmtBRL(Math.abs(delta)),     delta >= 0 ? "Acima do orçado" : "Dentro do orçado", delta >= 0 ? "neg" : "pos", Math.min(Math.abs(delta / totOrc * 100), 100)));

  const kpiCount = mkKPI("Registros filtrados", dados.length.toLocaleString("pt-BR"), `de ${dados.length} totais`, "", 100);
  kpiBar.appendChild(kpiCount);

  function atualizarKPI() {
    const f = filtrados();
    const pct = (f.length / dados.length * 100);
    kpiCount.querySelector(".bi-kpi-val").textContent = f.length.toLocaleString("pt-BR");
    kpiCount.querySelector(".bi-kpi-sub").textContent = `de ${dados.length} totais`;
    kpiCount.querySelector(".bi-kpi-bar-fill").style.width = pct + "%";
  }

  /* ── Tabela ──────────────────────────────────────────────── */
  const tblContainer = document.createElement("div");
  let ddAberto = null;

  document.addEventListener("click", () => {
    if (ddAberto) { ddAberto.classList.remove("open"); ddAberto = null; }
  });

  function renderTabela() {
    atualizarKPI();
    const rows = filtrados();
    tblContainer.innerHTML = "";

    const secHead = document.createElement("div"); secHead.className = "bi-sec-head";
    secHead.innerHTML = `<span class="bi-sec-title">Detalhamento de Dados</span><span class="bi-sec-count">${rows.length} registro(s)</span>`;
    tblContainer.appendChild(secHead);

    const wrap = document.createElement("div"); wrap.className = "bi-tbl-wrap";
    const tbl  = document.createElement("table"); tbl.className = "bi-tbl";

    /* cabeçalho com filtros */
    const thead = document.createElement("thead");
    const trH   = document.createElement("tr");

    colunas.forEach(col => {
      const th = document.createElement("th");
      const inner = document.createElement("div"); inner.className = "bi-th-in";
      const s = document.createElement("span"); s.textContent = lbl(col);
      const btn = document.createElement("button");
      btn.className = "bi-filt-btn" + (hF[col] !== null ? " on" : "");
      btn.innerHTML = `<svg width="9" height="9" viewBox="0 0 9 9"><path d="M0 1.5h9L5.5 6v3L3.5 8V6L0 1.5z" fill="currentColor"/></svg>`;
      inner.appendChild(s); inner.appendChild(btn);
      th.appendChild(inner);

      const dd = document.createElement("div"); dd.className = "bi-filt-dd";
      const search = document.createElement("input"); search.className = "bi-dd-search"; search.placeholder = "Buscar...";
      dd.appendChild(search);
      const list = document.createElement("div"); list.className = "bi-dd-list";

      function buildList(term = "") {
        list.innerHTML = "";
        const vals = uniq[col].filter(v => v.toLowerCase().includes(term.toLowerCase()));
        const ativos = hF[col] ?? new Set(uniq[col]);
        vals.forEach(v => {
          const item = document.createElement("label"); item.className = "bi-dd-item";
          const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = ativos.has(v);
          cb.addEventListener("change", () => {
            if (hF[col] === null) hF[col] = new Set(uniq[col]);
            cb.checked ? hF[col].add(v) : hF[col].delete(v);
            if (hF[col].size === uniq[col].length) hF[col] = null;
            btn.className = "bi-filt-btn" + (hF[col] !== null ? " on" : "");
            renderTabela();
          });
          const txt = document.createElement("span"); txt.textContent = v || "(vazio)";
          item.appendChild(cb); item.appendChild(txt); list.appendChild(item);
        });
      }
      buildList(); dd.appendChild(list);
      search.addEventListener("input", () => buildList(search.value));
      search.addEventListener("click", e => e.stopPropagation());

      const acts = document.createElement("div"); acts.className = "bi-dd-acts";
      const bAll = document.createElement("button"); bAll.textContent = "Selecionar todos";
      bAll.addEventListener("click", e => { e.stopPropagation(); hF[col] = null; btn.className = "bi-filt-btn"; buildList(search.value); renderTabela(); });
      const bNone = document.createElement("button"); bNone.textContent = "Limpar";
      bNone.addEventListener("click", e => { e.stopPropagation(); hF[col] = new Set(); btn.className = "bi-filt-btn on"; buildList(search.value); renderTabela(); });
      acts.appendChild(bAll); acts.appendChild(bNone); dd.appendChild(acts);
      th.appendChild(dd);

      inner.addEventListener("click", e => {
        e.stopPropagation();
        const aberto = dd.classList.contains("open");
        if (ddAberto) { ddAberto.classList.remove("open"); }
        if (!aberto) { dd.classList.add("open"); ddAberto = dd; } else { ddAberto = null; }
      });

      trH.appendChild(th);
    });
    thead.appendChild(trH); tbl.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.slice(0, 500).forEach(row => {
      const tr = document.createElement("tr");
      colunas.forEach(col => {
        const td = document.createElement("td");
        const v = row[col];
        if (col === "valor_realizado" && typeof v === "number") {
          const over = v > (row.valor_orcado || 0);
          td.className = "bi-td-r " + (over ? "bi-td-neg" : "bi-td-pos");
          td.textContent = fmtBRL(v);
        } else if (col === "valor_orcado" && typeof v === "number") {
          td.className = "bi-td-r";
          td.textContent = fmtBRL(v);
        } else if (col === "id") {
          td.innerHTML = `<span class="bi-pill bi-pill-blue">${v}</span>`;
        } else if (col === "departamento") {
          td.innerHTML = `<span class="bi-pill bi-pill-grn">${v ?? ""}</span>`;
        } else if (typeof v === "number") {
          td.className = "bi-td-r"; td.textContent = v.toLocaleString("pt-BR");
        } else {
          td.textContent = v ?? "";
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody); wrap.appendChild(tbl); tblContainer.appendChild(wrap);

    const foot = document.createElement("div"); foot.className = "bi-tbl-foot";
    foot.textContent = rows.length > 500 ? `Exibindo 500 de ${rows.length} registros` : `${rows.length} registro(s)`;
    tblContainer.appendChild(foot);
  }

  /* ── Sidebar ─────────────────────────────────────────────── */
  const sidebar = document.createElement("div"); sidebar.className = "bi-sidebar";
  sidebar.innerHTML = `
    <div class="bi-sb-brand">
      <div class="bi-sb-logo"><div class="bi-sb-dot"></div><div class="bi-sb-title">Gestão Orçamentária</div></div>
      <div class="bi-sb-period">Jan — Nov 2023</div>
    </div>
    <div class="bi-sb-section"><div class="bi-sb-section-label">Filtros</div></div>`;

  const sbSection = sidebar.querySelector(".bi-sb-section");
  const inputRefs = {};

  colunas.forEach(col => {
    const fg = document.createElement("div"); fg.className = "bi-fg";
    const label = document.createElement("label"); label.textContent = lbl(col);
    fg.appendChild(label);
    let inp;
    if (uniq[col].length <= 30) {
      inp = document.createElement("select");
      const o0 = document.createElement("option"); o0.value = ""; o0.textContent = "Todos";
      inp.appendChild(o0);
      uniq[col].forEach(v => { const o = document.createElement("option"); o.value = v; o.textContent = v; inp.appendChild(o); });
      inp.addEventListener("change", () => { sF[col] = inp.value; renderTabela(); });
    } else {
      inp = document.createElement("input"); inp.type = "text"; inp.placeholder = `Filtrar ${lbl(col)}...`;
      inp.addEventListener("input", () => { sF[col] = inp.value; renderTabela(); });
    }
    inputRefs[col] = inp;
    fg.appendChild(inp); sbSection.appendChild(fg);
  });

  sidebar.appendChild(sbSection);

  const btnClr = document.createElement("button"); btnClr.className = "bi-btn-clear"; btnClr.textContent = "Limpar todos os filtros";
  btnClr.addEventListener("click", () => {
    colunas.forEach(c => { sF[c] = ""; hF[c] = null; inputRefs[c].value = ""; });
    renderTabela();
  });
  sidebar.appendChild(btnClr);

  /* ── Pivot ───────────────────────────────────────────────── */
  function buildPivot(rowF, colF, valF, agg) {
    const rows = filtrados();
    const rowVals = [...new Set(rows.map(d => String(d[rowF] ?? "")))].sort();
    const colVals = colF ? [...new Set(rows.map(d => String(d[colF] ?? "")))].sort() : null;
    const mapa = {};
    rows.forEach(row => {
      const r = String(row[rowF] ?? "");
      const c = colF ? String(row[colF] ?? "") : "__T__";
      const v = Number(row[valF] ?? 0);
      if (!mapa[r]) mapa[r] = {};
      if (!mapa[r][c]) mapa[r][c] = [];
      mapa[r][c].push(v);
    });
    function agg_(arr) {
      if (!arr?.length) return 0;
      switch(agg) {
        case "soma":  return arr.reduce((a,b)=>a+b,0);
        case "media": return arr.reduce((a,b)=>a+b,0)/arr.length;
        case "max":   return Math.max(...arr);
        case "min":   return Math.min(...arr);
        case "count": return arr.length;
        default:      return arr.reduce((a,b)=>a+b,0);
      }
    }
    const cols = colVals || ["Total"];
    const tbl = document.createElement("table"); tbl.className = "bi-pv-tbl";
    const thead = document.createElement("thead");
    const trH = document.createElement("tr");
    const thR = document.createElement("th"); thR.className = "row-h"; thR.textContent = lbl(rowF); trH.appendChild(thR);
    cols.forEach(c => { const th = document.createElement("th"); th.textContent = c; trH.appendChild(th); });
    if (colF) { const th = document.createElement("th"); th.className = "tot-h"; th.textContent = "Total"; trH.appendChild(th); }
    thead.appendChild(trH); tbl.appendChild(thead);

    const tbody = document.createElement("tbody");
    const gTot = {}; cols.forEach(c => gTot[c] = []);
    rowVals.forEach(r => {
      const tr = document.createElement("tr");
      const tdL = document.createElement("td"); tdL.className = "row-l"; tdL.textContent = r; tr.appendChild(tdL);
      let rowAll = [];
      cols.forEach(c => {
        const key = colF ? c : "__T__";
        const arr = mapa[r]?.[key] || [];
        const val = agg_(arr);
        rowAll = rowAll.concat(arr);
        gTot[c] = (gTot[c] || []).concat(arr);
        const td = document.createElement("td"); td.textContent = fmtNum(val, agg); tr.appendChild(td);
      });
      if (colF) { const td = document.createElement("td"); td.className = "tot-c"; td.textContent = fmtNum(agg_(rowAll), agg); tr.appendChild(td); }
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);

    const tfoot = document.createElement("tfoot");
    const trF = document.createElement("tr");
    const tdL = document.createElement("td"); tdL.className = "row-l"; tdL.textContent = "Total Geral"; trF.appendChild(tdL);
    let gAll = [];
    cols.forEach(c => {
      const arr = gTot[c] || []; gAll = gAll.concat(arr);
      const td = document.createElement("td"); td.textContent = fmtNum(agg_(arr), agg); trF.appendChild(td);
    });
    if (colF) { const td = document.createElement("td"); td.className = "tot-c"; td.textContent = fmtNum(agg_(gAll), agg); trF.appendChild(td); }
    tfoot.appendChild(trF); tbl.appendChild(tfoot);
    return tbl;
  }

  const pvResult = document.createElement("div"); pvResult.className = "bi-pv-result";
  const pvCfg    = document.createElement("div"); pvCfg.className = "bi-pv-cfg";

  const aggOpts = [{v:"soma",l:"Soma"},{v:"media",l:"Média"},{v:"count",l:"Contagem"},{v:"max",l:"Máximo"},{v:"min",l:"Mínimo"}];

  function mkSel(labelTxt, optsArr) {
    const g = document.createElement("div"); g.className = "bi-pv-grp";
    const lb = document.createElement("div"); lb.className = "bi-pv-label"; lb.textContent = labelTxt;
    const sel = document.createElement("select"); sel.className = "bi-pv-sel";
    optsArr.forEach((o, i) => {
      const opt = document.createElement("option");
      opt.value = typeof o === "string" ? o : o.v;
      opt.textContent = typeof o === "string" ? lbl(o) : o.l;
      if (i === 0) opt.selected = true;
      sel.appendChild(opt);
    });
    g.appendChild(lb); g.appendChild(sel);
    return { g, sel };
  }

  const colOptsComNenhum = [{v:"", l:"(nenhuma)"}, ...colsTexto.map(c => ({v:c, l:lbl(c)}))];
  const { g: gL, sel: selL } = mkSel("Linhas",     colsTexto.length ? colsTexto : colunas);
  const { g: gC, sel: selC } = mkSel("Colunas",    colOptsComNenhum);
  const { g: gV, sel: selV } = mkSel("Valores",    colsNum.length ? colsNum : colunas);
  const { g: gA, sel: selA } = mkSel("Agregação",  aggOpts);

  pvCfg.appendChild(gL); pvCfg.appendChild(gC); pvCfg.appendChild(gV); pvCfg.appendChild(gA);

  function atualizarPivot() {
    const rowF = selL.value;
    const colF = selC.value || null;
    const valF = selV.value;
    const agg  = selA.value;
    pvResult.innerHTML = "";
    pvResult.appendChild(buildPivot(rowF, colF, valF, agg));
  }

  [selL, selC, selV, selA].forEach(s => s.addEventListener("change", atualizarPivot));

  /* ── Montar layout ───────────────────────────────────────── */
  const main = document.createElement("div"); main.className = "bi-main";

  const topbar = document.createElement("div"); topbar.className = "bi-topbar";
  topbar.innerHTML = `<div class="bi-topbar-l"><div class="bi-topbar-title">Painel de Gestão Orçamentária</div><div class="bi-topbar-sub">Análise de desempenho financeiro por departamento e categoria</div></div><div class="bi-badge">2023</div>`;
  main.appendChild(topbar);
  main.appendChild(kpiBar);

  // Seção tabela
  const secTbl = document.createElement("div"); secTbl.className = "bi-section";
  renderTabela();
  secTbl.appendChild(tblContainer);
  main.appendChild(secTbl);

  // Seção pivot
  const secPv = document.createElement("div"); secPv.className = "bi-section";
  const pvHead = document.createElement("div"); pvHead.className = "bi-sec-head";
  pvHead.innerHTML = `<span class="bi-sec-title">Tabela Dinâmica</span><span class="bi-sec-count">Configure as dimensões ao lado</span>`;
  secPv.appendChild(pvHead);
  secPv.appendChild(pvCfg);
  secPv.appendChild(pvResult);
  main.appendChild(secPv);

  const wrap = document.createElement("div"); wrap.className = "bi-wrap";
  wrap.appendChild(sidebar);
  wrap.appendChild(main);

  display(wrap);
  atualizarPivot();
}
```
