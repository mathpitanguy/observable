---
theme: dashboard
toc: false
title: Receitas — Visão Geral
---

```js
import { html }               from "npm:htl";
import * as Plot              from "npm:@observablehq/plot";
import { resize, Generators } from "npm:@observablehq/stdlib";
import * as d3                from "npm:d3";

import { KpiCard }            from "./components/kpiCard.js";
import { HorizontalBarChart } from "./components/revenueChart.js";
```

```js
// ── Carregamento dos CSVs ─────────────────────────────────────────────
const rawOrcamento    = FileAttachment("data/Orcamento_Receita.csv").csv({ typed: true });
const rawUO           = FileAttachment("data/uo.csv").csv({ typed: true });
const rawFonteRecurso = FileAttachment("data/fonte_recurso.csv").csv({ typed: true });
const rawAuxDCMEFO    = FileAttachment("data/tab_auxiliar_fte_dcmefo.csv").csv({ typed: true });
```

```js
// ── Utilitários ───────────────────────────────────────────────────────
// Normaliza string: trim
function ns(v) { return String(v ?? "").trim(); }

// Slug para comparação robusta de nomes de colunas:
// remove acentos, minúsculas, apaga espaços/underscore/hífen
function slugify(s) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_\-]+/g, "");
}

// Busca a primeira coluna existente dentre os candidatos
function findCol(cols, candidates) {
  for (const c of candidates) {
    const sc = slugify(c);
    const hit = cols.find(k => slugify(k) === sc);
    if (hit) return hit;
  }
  return null;
}

// Converte valor monetário pt-BR ("1.234,56") ou padrão ("1234.56")
function parseBRL(v) {
  if (v === null || v === undefined || v === "") return 0;
  const s = String(v).trim();
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(s))
    return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
  return parseFloat(String(s).replace(",", ".")) || 0;
}
```

```js
// ── Mapa UO: uo_cod → uo_sigla (filtrado para ano 2026) ──────────────
const uoMap = (() => {
  const cols   = rawUO.length ? Object.keys(rawUO[0]) : [];
  const colAno = findCol(cols, ["ano"]);
  const base   = colAno ? rawUO.filter(d => ns(d[colAno]) === "2026") : rawUO;
  const colCod = findCol(cols, ["uo_cod","cod_uo","CD_UO"]);
  const colSig = findCol(cols, ["uo_sigla","sigla_uo","UO_SIGLA"]);
  const map = new Map();
  for (const r of base) {
    const cod = ns(r[colCod]);
    const sig = ns(r[colSig]);
    if (cod) map.set(cod, sig);
  }
  return map;
})();

// ── Mapa Fonte: fonte_cod → fonte_desc (filtrado para ano 2026) ───────
const fonteMap = (() => {
  const cols    = rawFonteRecurso.length ? Object.keys(rawFonteRecurso[0]) : [];
  const colAno  = findCol(cols, ["ano"]);
  const base    = colAno ? rawFonteRecurso.filter(d => ns(d[colAno]) === "2026") : rawFonteRecurso;
  const colCod  = findCol(cols, ["fonte_cod","cod_fonte","CD_FONTE"]);
  const colDesc = findCol(cols, ["fonte_desc","desc_fonte","DS_FONTE","descricao"]);
  const map = new Map();
  for (const r of base) {
    const cod  = ns(r[colCod]);
    const desc = ns(r[colDesc]);
    if (cod) map.set(cod, desc);
  }
  return map;
})();

// ── Mapa DCMEFO: CD_FONTE → "Sim" | "Não" ────────────────────────────
const dcmefoMap = (() => {
  const cols   = rawAuxDCMEFO.length ? Object.keys(rawAuxDCMEFO[0]) : [];
  const colCod = findCol(cols, ["CD_FONTE","cd_fonte","fonte_cod"]);
  const colAna = findCol(cols, ["Analise DCMEFO","analise_dcmefo","Analise"]);
  const map = new Map();
  for (const r of rawAuxDCMEFO) {
    const cod = ns(r[colCod]);
    const val = ns(r[colAna]).toUpperCase() === "SIM" ? "Sim" : "Não";
    if (cod) map.set(cod, val);
  }
  return map;
})();
```

```js
// ── Detecta colunas do Orcamento_Receita.csv ──────────────────────────
const orcCols = rawOrcamento.length ? Object.keys(rawOrcamento[0]) : [];

const C = {
  // Coluna "Código da Unidade" — nome exato com acento e espaços
  uoCod      : findCol(orcCols, ["Código da Unidade","Codigo da Unidade","codigo_da_unidade","uo_cod","CD_UO"]),
  uoNome     : findCol(orcCols, ["Unidade Orçamentária","Unidade Orcamentaria","unidade_orcamentaria","NM_UO"]),
  // Coluna "Fonte" — código numérico da fonte
  fonteCod   : findCol(orcCols, ["Fonte","fonte","fonte_cod","CD_FONTE"]),
  // Coluna "Classificação da Receita" — código
  receitaCod : findCol(orcCols, ["Classificação da Receita","Classificacao da Receita","classificacao_da_receita","receita_cod","CD_RECEITA"]),
  // Coluna "Descrição da Receita"
  receitaDesc: findCol(orcCols, ["Descrição da Receita","Descricao da Receita","descricao_da_receita","receita_desc","DS_RECEITA"]),
  // Coluna "Valor LDO"
  valorLDO   : findCol(orcCols, ["Valor LDO","valor_ldo","ValorLDO","VL_LDO"]),
  // Anos históricos e projeção
  ano2024    : findCol(orcCols, ["2024"]),
  ano2025    : findCol(orcCols, ["2025"]),
  reest2026  : findCol(orcCols, ["2026 Reest","2026_Reest","reestimativa_2026"]),
  ano2027    : findCol(orcCols, ["2027","2027 LDO"]),
  // Coluna de alertas (opcional)
  alertas    : findCol(orcCols, ["alertas","Alertas","alerta","Alerta"]),
};

// Diagnóstico — abra F12 > Console para ver o mapeamento
console.log("[Dashboard] Colunas detectadas:", JSON.stringify(C, null, 2));
console.log("[Dashboard] Colunas do CSV:", orcCols);
```

```js
// ── Enriquecimento: join UO + Fonte + DCMEFO ──────────────────────────
const enrichedData = rawOrcamento.map(row => {
  const uoCod      = ns(row[C.uoCod]);
  // Extrai só os dígitos iniciais do código da fonte (ex: "60 - RECURSOS..." → "60")
  const fonteCodRaw = ns(row[C.fonteCod]);
  const fonteCod    = fonteCodRaw.replace(/^(\d+).*/, "$1").trim() || fonteCodRaw;

  const uoSigla    = uoMap.get(uoCod)    ?? ns(row[C.uoNome] ?? "");
  const fonteDesc  = fonteMap.get(fonteCod) ?? fonteMap.get(fonteCodRaw) ?? "";
  const dcmefo     = dcmefoMap.get(fonteCod) ?? dcmefoMap.get(fonteCodRaw) ?? "Não";

  const receitaCod  = ns(row[C.receitaCod]);
  const receitaDesc = ns(row[C.receitaDesc]);

  return {
    ...row,
    _uoCod        : uoCod,
    _uoSigla      : uoSigla,
    _uoLabel      : uoSigla ? `${uoCod} - ${uoSigla}` : uoCod,
    _fonteCod     : fonteCod,
    _fonteDesc    : fonteDesc,
    _fonteLabel   : fonteDesc ? `${fonteCod} - ${fonteDesc}` : fonteCodRaw || fonteCod,
    _receitaCod   : receitaCod,
    _receitaDesc  : receitaDesc,
    _receitaLabel : receitaCod && receitaDesc ? `${receitaCod} - ${receitaDesc}` : receitaDesc || receitaCod,
    _dcmefo       : dcmefo,
    _alerta       : C.alertas ? ns(row[C.alertas]) : "",
    _valorLDO     : parseBRL(row[C.valorLDO]),
    _2024         : C.ano2024    ? parseBRL(row[C.ano2024])    : null,
    _2025         : C.ano2025    ? parseBRL(row[C.ano2025])    : null,
    _reest2026    : C.reest2026  ? parseBRL(row[C.reest2026])  : null,
    _2027         : C.ano2027    ? parseBRL(row[C.ano2027])    : null,
  };
});
```

```js
// ── Listas únicas para os 5 filtros ───────────────────────────────────
const optsDcmefo  = [...new Set(enrichedData.map(d => d._dcmefo).filter(Boolean))].sort();
const optsUO      = [...new Set(enrichedData.map(d => d._uoLabel).filter(Boolean))].sort();
const optsFonte   = [...new Set(enrichedData.map(d => d._fonteLabel).filter(Boolean))].sort();
const optsReceita = [...new Set(enrichedData.map(d => d._receitaLabel).filter(Boolean))].sort();
const optsAlerta  = C.alertas
  ? [...new Set(enrichedData.map(d => d._alerta).filter(Boolean))].sort()
  : [];
```

```js
// ── Inputs dos 5 filtros (espelham exatamente o Streamlit) ───────────
const dcmefoInput  = Inputs.select(["Todos", ...optsDcmefo],  { label: "DCMEFO",  value: "Todos" });
const uoInput      = Inputs.select(["Todas", ...optsUO],      { label: "UO",      value: "Todas" });
const fonteInput   = Inputs.select(["Todas", ...optsFonte],   { label: "Fonte",   value: "Todas" });
const receitaInput = Inputs.select(["Todas", ...optsReceita], { label: "Receita", value: "Todas" });
const alertaInput  = optsAlerta.length
  ? Inputs.select(["Todos", ...optsAlerta], { label: "Alerta", value: "Todos" })
  : null;

const selDcmefo  = Generators.input(dcmefoInput);
const selUO      = Generators.input(uoInput);
const selFonte   = Generators.input(fonteInput);
const selReceita = Generators.input(receitaInput);
const selAlerta  = alertaInput ? Generators.input(alertaInput) : "Todos";

// Busca textual (apenas na tabela)
const searchInput = Inputs.text({ placeholder: "🔍 Buscar na tabela…", value: "" });
const searchStr   = Generators.input(searchInput);
```

```js
// ── Filtragem ─────────────────────────────────────────────────────────
const filteredData = enrichedData.filter(d => {
  if (selDcmefo  !== "Todos" && d._dcmefo       !== selDcmefo)  return false;
  if (selUO      !== "Todas" && d._uoLabel       !== selUO)      return false;
  if (selFonte   !== "Todas" && d._fonteLabel    !== selFonte)   return false;
  if (selReceita !== "Todas" && d._receitaLabel  !== selReceita) return false;
  if (selAlerta  !== "Todos" && d._alerta        !== selAlerta)  return false;
  return true;
});

const tableData = filteredData.filter(d => {
  if (!searchStr) return true;
  const q = searchStr.toLowerCase();
  return [d._uoCod, d._uoSigla, d._fonteCod, d._fonteDesc,
          d._receitaCod, d._receitaDesc, d._alerta]
    .some(v => v.toLowerCase().includes(q));
});
```

```js
// ── KPIs ──────────────────────────────────────────────────────────────
const totalLDO = d3.sum(filteredData, d => d._valorLDO);
const nUOs     = new Set(filteredData.map(d => d._uoCod).filter(Boolean)).size;
const nFontes  = new Set(filteredData.map(d => d._fonteCod).filter(Boolean)).size;
const nLinhas  = filteredData.length;

const fmtBRL = v => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 2
}).format(v);
const fmtBRLFull = v => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", minimumFractionDigits: 2
}).format(v);
const fmtN = v => new Intl.NumberFormat("pt-BR").format(v);
```

```js
// ── Dados para gráficos ───────────────────────────────────────────────
const dadosPorUO = d3.rollups(filteredData, v => d3.sum(v, d => d._valorLDO), d => d._uoLabel)
  .map(([nome, valor]) => ({ nome: nome || "(sem UO)", valor }))
  .sort((a, b) => d3.descending(a.valor, b.valor)).slice(0, 8);

const dadosPorFonte = d3.rollups(filteredData, v => d3.sum(v, d => d._valorLDO), d => d._fonteLabel)
  .map(([nome, valor]) => ({ nome: nome || "(sem Fonte)", valor }))
  .sort((a, b) => d3.descending(a.valor, b.valor)).slice(0, 8);
```

<style>
/* ── Reset ────────────────────────────────────────────────────── */
body { margin: 0; padding: 0; background: #f1f5f9; }
#observablehq-main, #observablehq-main > div { padding: 0 !important; margin: 0 !important; }
#observablehq-main header { display: none !important; }
.observablehq--block { margin: 0 !important; }

/* ── Layout raiz ──────────────────────────────────────────────── */
.dashboard-root {
  display: grid;
  grid-template-columns: 272px 1fr;
  min-height: 100vh;
  font-family: "IBM Plex Sans", system-ui, sans-serif;
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════════════════ */
.sidebar {
  background: #0f172a;
  color: #e2e8f0;
  padding: 1.4rem 1rem 1.5rem;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  scrollbar-width: thin;
  scrollbar-color: #1e293b #0f172a;
}

.sidebar-logo {
  font-size: 0.95rem;
  font-weight: 800;
  color: #f8fafc;
  padding-bottom: 1.1rem;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 1.1rem;
  letter-spacing: -0.01em;
}

.sidebar-section-title {
  font-size: 0.63rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 0.9rem;
}

.filter-group { margin-bottom: 0.85rem; }

.filter-label {
  display: block;
  font-size: 0.68rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 0.28rem;
  font-weight: 600;
}

/* Override dos inputs do Observable dentro da sidebar */
.sidebar select,
.sidebar input[type="text"],
.sidebar input[type="search"] {
  width: 100% !important;
  box-sizing: border-box !important;
  background: #1e293b !important;
  border: 1px solid #293548 !important;
  color: #e2e8f0 !important;
  border-radius: 6px !important;
  padding: 0.38rem 0.55rem !important;
  font-size: 0.76rem !important;
  font-family: inherit !important;
  outline: none !important;
  appearance: auto !important;
  -webkit-appearance: auto !important;
}
.sidebar select:focus,
.sidebar input:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.18) !important;
}
/* Esconde labels do Observable — usamos os nossos .filter-label */
.sidebar label,
.sidebar .observablehq-input label,
.sidebar form label { display: none !important; }
.sidebar form { margin: 0 !important; padding: 0 !important; }

.sidebar-divider { border: none; border-top: 1px solid #1e293b; margin: 0.8rem 0; }

.sidebar-stats {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #1e293b;
  font-size: 0.69rem;
  color: #475569;
  line-height: 2;
}
.sidebar-stats b { color: #94a3b8; }

/* ══════════════════════════════════════════════════════════════
   CONTEÚDO PRINCIPAL
══════════════════════════════════════════════════════════════ */
.main-content {
  background: #f1f5f9;
  padding: 2rem 1.8rem 3rem;
  min-height: 100vh;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.2rem;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0 0 1.4rem;
}
.counter-badge {
  display: inline-block;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 99px;
  padding: 0.1rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 700;
}

.section-title {
  font-size: 0.67rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 1.6rem 0 0.75rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid #e2e8f0;
}

/* ── Gráficos ─────────────────────────────────────────────── */
.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.chart-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.chart-card h3 {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Tabela ───────────────────────────────────────────────── */
.table-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.table-header h3 { font-size: 0.82rem; font-weight: 700; color: #0f172a; margin: 0; }

.table-search { flex: 1; min-width: 140px; max-width: 260px; }
.table-search input[type="text"] {
  width: 100%; box-sizing: border-box;
  border: 1px solid #e2e8f0; border-radius: 6px;
  padding: 0.32rem 0.6rem; font-size: 0.76rem;
  color: #334155; outline: none; font-family: inherit;
}
.table-search input:focus { border-color: #3b82f6; }
.table-search label { display: none !important; }
.table-search form { margin: 0 !important; }

/* Container com scroll vertical + header sticky */
.table-wrapper {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 520px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.table-wrapper::-webkit-scrollbar { width: 5px; height: 5px; }
.table-wrapper::-webkit-scrollbar-track { background: #f8fafc; }
.table-wrapper::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
.table-wrapper::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

table.receita-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.77rem;
  color: #334155;
}
table.receita-table thead th {
  padding: 0.52rem 0.7rem;
  text-align: left;
  font-weight: 700;
  font-size: 0.67rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  white-space: nowrap;
  background: #f1f5f9;
  position: sticky;
  top: 0;
  z-index: 2;
  box-shadow: 0 1px 0 #cbd5e1;
}
table.receita-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
table.receita-table tbody tr:hover { background: #f8fafc; }
table.receita-table tbody td { padding: 0.48rem 0.7rem; vertical-align: middle; }

.badge-uo {
  background: #dbeafe; color: #1d4ed8;
  border-radius: 4px; padding: 0.1rem 0.38rem;
  font-size: 0.66rem; font-weight: 700; white-space: nowrap;
}
.badge-fonte {
  background: #fef3c7; color: #92400e;
  border-radius: 4px; padding: 0.1rem 0.38rem;
  font-size: 0.66rem; font-weight: 600; white-space: nowrap;
}
.badge-sim { background: #dcfce7; color: #166534; border-radius: 4px; padding: 0.1rem 0.38rem; font-size: 0.66rem; font-weight: 600; }
.badge-nao { background: #f1f5f9; color: #64748b; border-radius: 4px; padding: 0.1rem 0.38rem; font-size: 0.66rem; }
.valor-cell { font-family: "IBM Plex Mono", monospace; font-size: 0.73rem; text-align: right; white-space: nowrap; color: #0f172a; }
.receita-desc { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.table-footer {
  padding: 0.45rem 0.7rem;
  font-size: 0.7rem; color: #94a3b8;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

/* Empty state */
.empty-state {
  padding: 2.5rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.82rem;
  line-height: 1.8;
}
</style>

```js
// ── Renderização ──────────────────────────────────────────────────────
display(html`
<div class="dashboard-root">

  <!-- ══════════ SIDEBAR ══════════ -->
  <aside class="sidebar">

    <div class="sidebar-logo">📊 Previsão de Receitas</div>

    <div class="sidebar-section-title">🎛️ Filtros</div>

    <div class="filter-group">
      <span class="filter-label">Passível de análise DCMEFO?</span>
      ${dcmefoInput}
    </div>

    <div class="filter-group">
      <span class="filter-label">Unidade Orçamentária (UO)</span>
      ${uoInput}
    </div>

    <div class="filter-group">
      <span class="filter-label">Fonte de Recursos</span>
      ${fonteInput}
    </div>

    <div class="filter-group">
      <span class="filter-label">Classificação da Receita</span>
      ${receitaInput}
    </div>

    ${alertaInput ? html`
    <div class="filter-group">
      <span class="filter-label">Tipo de Alerta</span>
      ${alertaInput}
    </div>` : ""}

    <div class="sidebar-stats">
      <div>📦 Total: <b>${fmtN(rawOrcamento.length)}</b> registros</div>
      <div>✅ Filtrados: <b>${fmtN(nLinhas)}</b></div>
      <div>🏛️ UOs: <b>${fmtN(nUOs)}</b> · Fontes: <b>${fmtN(nFontes)}</b></div>
    </div>

  </aside>

  <!-- ══════════ CONTEÚDO ══════════ -->
  <main class="main-content">

    <p class="page-title">📋 Visão Geral — Previsão de Receitas</p>
    <p class="page-subtitle">
      Orçamento LDO 2027 &nbsp;·&nbsp;
      <span class="counter-badge">${fmtN(nLinhas)} registros exibidos</span>
    </p>

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.2rem;">
      ${KpiCard({
        label   : "Total Previsto (LDO)",
        value   : totalLDO,
        format  : "brl",
        subtitle: `${fmtN(nLinhas)} linhas · ${fmtN(nFontes)} fontes`,
        color   : "#2563eb",
        icon    : "💼",
      })}
      ${KpiCard({
        label   : "Unidades Orçamentárias",
        value   : nUOs,
        format  : "int",
        subtitle: "UOs distintas com previsão",
        color   : "#d97706",
        icon    : "🏛️",
      })}
      ${KpiCard({
        label   : "Fontes de Recurso",
        value   : nFontes,
        format  : "int",
        subtitle: "fontes distintas no filtro",
        color   : "#7c3aed",
        icon    : "🏷️",
      })}
    </div>

    <!-- Gráficos -->
    <p class="section-title">Distribuição por UO e Fonte</p>
    <div class="chart-grid">
      <div class="chart-card">
        <h3>🏛️ Top Unidades Orçamentárias — Valor LDO</h3>
        ${resize(width => HorizontalBarChart(dadosPorUO, { width, fill: "#2563eb" }))}
      </div>
      <div class="chart-card">
        <h3>💰 Top Fontes de Recurso — Valor LDO</h3>
        ${resize(width => HorizontalBarChart(dadosPorFonte, { width, fill: "#d97706" }))}
      </div>
    </div>

    <!-- Tabela -->
    <p class="section-title">Detalhamento</p>
    <div class="table-card">
      <div class="table-header">
        <h3>📋 Detalhamento (Visão Geral)</h3>
        <div class="table-search">${searchInput}</div>
        <span class="counter-badge">${fmtN(tableData.length)} linhas</span>
      </div>

      ${tableData.length === 0 ? html`
        <div class="empty-state">
          ⚠️ Nenhum dado encontrado com os filtros atuais.<br>
          <small>Pressione <b>F12 → Console</b> e procure por <code>[Dashboard] Colunas detectadas</code><br>
          para confirmar o mapeamento das colunas do seu CSV.</small>
        </div>
      ` : html`
      <div class="table-wrapper">
        <table class="receita-table">
          <thead>
            <tr>
              <th>UO Cód</th>
              <th>UO</th>
              <th>Classif. Receita Cód</th>
              <th>Classificação da Receita</th>
              <th>Fonte Cód</th>
              <th>Fonte de Recursos</th>
              <th>DCMEFO</th>
              ${C.ano2024    ? html`<th class="valor-cell">2024</th>`       : ""}
              ${C.ano2025    ? html`<th class="valor-cell">2025</th>`       : ""}
              ${C.reest2026  ? html`<th class="valor-cell">2026 Reest</th>` : ""}
              ${C.ano2027    ? html`<th class="valor-cell">2027 LDO</th>`   : ""}
              <th class="valor-cell">Valor LDO</th>
              ${C.alertas    ? html`<th>Alerta</th>`                        : ""}
            </tr>
          </thead>
          <tbody>
            ${tableData.slice(0, 200).map(d => html`
              <tr>
                <td><span class="badge-uo">${d._uoCod || "—"}</span></td>
                <td>${d._uoSigla || "—"}</td>
                <td style="font-family:monospace;font-size:0.7rem">${d._receitaCod || "—"}</td>
                <td><div class="receita-desc" title="${d._receitaDesc}">${d._receitaDesc || "—"}</div></td>
                <td><span class="badge-fonte">${d._fonteCod || "—"}</span></td>
                <td style="font-size:0.72rem">${d._fonteDesc || "—"}</td>
                <td>
                  <span class="${d._dcmefo === 'Sim' ? 'badge-sim' : 'badge-nao'}">${d._dcmefo}</span>
                </td>
                ${C.ano2024   ? html`<td class="valor-cell">${d._2024      != null ? fmtBRLFull(d._2024)      : "—"}</td>` : ""}
                ${C.ano2025   ? html`<td class="valor-cell">${d._2025      != null ? fmtBRLFull(d._2025)      : "—"}</td>` : ""}
                ${C.reest2026 ? html`<td class="valor-cell">${d._reest2026 != null ? fmtBRLFull(d._reest2026) : "—"}</td>` : ""}
                ${C.ano2027   ? html`<td class="valor-cell">${d._2027      != null ? fmtBRLFull(d._2027)      : "—"}</td>` : ""}
                <td class="valor-cell">${fmtBRLFull(d._valorLDO)}</td>
                ${C.alertas   ? html`<td style="font-size:0.72rem">${d._alerta || "—"}</td>` : ""}
              </tr>
            `)}
          </tbody>
        </table>
        ${tableData.length > 200 ? html`
          <div class="table-footer">
            Exibindo 200 de ${fmtN(tableData.length)} registros. Use os filtros para refinar.
          </div>` : ""}
      </div>
      `}
    </div>

  </main>
</div>
`);
```