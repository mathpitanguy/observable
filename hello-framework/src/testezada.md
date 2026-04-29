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

import { KpiCard }                                             from "./components/kpiCard.js";
import { HorizontalBarChart, GroupedBarChart, ExecutionDonut } from "./components/revenueChart.js";
```

```js
// ── Dados — SEM await: o Framework resolve a Promise reativamente ─────
const rawData   = FileAttachment("data/Orcamento_Receita.csv").csv({ typed: true });
const fonteData = FileAttachment("data/fonte_recurso.csv").csv({ typed: true });
const uoData    = FileAttachment("data/uo.csv").csv({ typed: true });
```

```js
// ── Mapeamento de colunas ─────────────────────────────────────────────
// ⚙️  Ajuste para bater com os nomes reais do seu CSV
const COL = {
  exercicio   : "Exercicio",
  nomeUO      : "Nome_UO",
  codigoUO    : "Codigo_UO",
  nomeFonte   : "Nome_Fonte",
  codigoFonte : "Codigo_Fonte",
  previsto    : "Valor_Previsto",
  realizado   : "Valor_Realizado",
  categoria   : "Categoria",
};

const cols         = rawData.length ? Object.keys(rawData[0]) : [];
const hasRealizado = COL.realizado && cols.includes(COL.realizado);
const hasCategoria = COL.categoria && cols.includes(COL.categoria);
```

```js
// ── Listas únicas para os selects ────────────────────────────────────
const exercicios   = [...new Set(rawData.map(d => String(d[COL.exercicio])))].sort().reverse();
const fontesUnicas = [...new Set(rawData.map(d => d[COL.nomeFonte]).filter(Boolean))].sort();
const uosUnicas    = [...new Set(rawData.map(d => d[COL.nomeUO]).filter(Boolean))].sort();
const categorias   = hasCategoria
  ? [...new Set(rawData.map(d => d[COL.categoria]).filter(Boolean))].sort()
  : [];
```

```js
// ── Inputs de filtro ──────────────────────────────────────────────────
const anoInput = Inputs.select(
  ["Todos", ...exercicios],
  { label: "Exercício", value: exercicios[0] ?? "Todos" }
);
const fonteInput = Inputs.select(
  ["Todas", ...fontesUnicas],
  { label: "Fonte de Recurso", value: "Todas" }
);
const uoInput = Inputs.select(
  ["Todas", ...uosUnicas],
  { label: "Unidade Orçamentária", value: "Todas" }
);
const catInput = hasCategoria
  ? Inputs.select(["Todas", ...categorias], { label: "Categoria", value: "Todas" })
  : null;

// Valores reativos via Generators.input
const selAno   = Generators.input(anoInput);
const selFonte = Generators.input(fonteInput);
const selUO    = Generators.input(uoInput);
const selCat   = catInput ? Generators.input(catInput) : "Todas";
```

```js
// ── Busca textual ─────────────────────────────────────────────────────
// Inputs.text simples — filtramos manualmente junto com os outros filtros
const searchInput = Inputs.text({ placeholder: "🔍 Buscar na tabela…", value: "" });
const searchStr   = Generators.input(searchInput);
```

```js
// ── Filtragem principal ───────────────────────────────────────────────
function applyFilters(data) {
  return data.filter(d => {
    const anoOk   = selAno   === "Todos" || String(d[COL.exercicio]) === selAno;
    const fonteOk = selFonte === "Todas" || d[COL.nomeFonte]  === selFonte;
    const uoOk    = selUO    === "Todas" || d[COL.nomeUO]     === selUO;
    const catOk   = selCat   === "Todas" || d[COL.categoria]  === selCat;
    return anoOk && fonteOk && uoOk && catOk;
  });
}

const filteredData = applyFilters(rawData);

// Aplica também busca textual para a tabela
const tableData = filteredData.filter(d => {
  if (!searchStr) return true;
  const q = searchStr.toLowerCase();
  return Object.values(d).some(v => String(v ?? "").toLowerCase().includes(q));
});
```

```js
// ── KPIs ──────────────────────────────────────────────────────────────
const totalPrevisto  = d3.sum(filteredData, d => +d[COL.previsto]  || 0);
const totalRealizado = hasRealizado
  ? d3.sum(filteredData, d => +d[COL.realizado] || 0) : null;
const pctExecucao    = hasRealizado && totalPrevisto > 0
  ? totalRealizado / totalPrevisto : null;

const nFontes = new Set(filteredData.map(d => d[COL.nomeFonte])).size;
const nUOs    = new Set(filteredData.map(d => d[COL.nomeUO])).size;
const nLinhas = filteredData.length;

const fmtBRL = v => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL",
  notation: "compact", maximumFractionDigits: 2,
}).format(v);
const fmtPct = d3.format(".1%");
const fmtN   = v => new Intl.NumberFormat("pt-BR").format(v);
```

```js
// ── Dados para gráficos ───────────────────────────────────────────────
const dadosPorFonte = d3.rollups(
  filteredData,
  v => d3.sum(v, d => +d[COL.previsto] || 0),
  d => d[COL.nomeFonte]
).map(([nome, valor]) => ({ nome, valor }))
  .sort((a, b) => d3.descending(a.valor, b.valor))
  .slice(0, 10);

const dadosPorUO = d3.rollups(
  filteredData,
  v => d3.sum(v, d => +d[COL.previsto] || 0),
  d => d[COL.nomeUO]
).map(([nome, valor]) => ({ nome, valor }))
  .sort((a, b) => d3.descending(a.valor, b.valor))
  .slice(0, 8);
```

# Previsão de Receitas

Visão geral do orçamento${selAno !== "Todos" ? ` — Exercício **${selAno}**` : ""} · ${fmtN(nLinhas)} registros filtrados de ${fmtN(rawData.length)} totais

---

## Filtros

<div class="grid grid-cols-4">
  <div>${anoInput}</div>
  <div>${fonteInput}</div>
  <div>${uoInput}</div>
  ${catInput ? html`<div>${catInput}</div>` : html`<div></div>`}
</div>

---

## Resumo

<div class="grid grid-cols-3">

  <div class="card">
    ${KpiCard({
      label    : "Total Previsto",
      value    : totalPrevisto,
      format   : "brl",
      subtitle : `${fmtN(nLinhas)} registros · ${fmtN(nFontes)} fontes`,
      color    : "#2563eb",
      icon     : "💼",
    })}
  </div>

  <div class="card">
    ${hasRealizado
      ? KpiCard({
          label    : "Total Realizado",
          value    : totalRealizado,
          format   : "brl",
          subtitle : `${fmtPct(pctExecucao ?? 0)} de execução orçamentária`,
          progress : pctExecucao,
          color    : pctExecucao >= 0.9 ? "#059669"
                   : pctExecucao >= 0.6 ? "#d97706" : "#dc2626",
          icon     : "✅",
        })
      : KpiCard({
          label    : "Fontes de Recurso",
          value    : nFontes,
          format   : "int",
          subtitle : "fontes distintas com previsão",
          color    : "#7c3aed",
          icon     : "🏷️",
        })
    }
  </div>

  <div class="card">
    ${KpiCard({
      label    : "Unidades Orçamentárias",
      value    : nUOs,
      format   : "int",
      subtitle : "UOs com previsão de receita",
      color    : "#d97706",
      icon     : "🏛️",
    })}
  </div>

</div>

---

## Distribuição

<div class="grid grid-cols-2">

  <div class="card">
    <h2>💰 Top Fontes de Recurso</h2>
    ${resize(width => HorizontalBarChart(dadosPorFonte, { width, fill: "#3b82f6" }))}
  </div>

  <div class="card">
    <h2>🏛️ Top Unidades Orçamentárias</h2>
    ${resize(width => HorizontalBarChart(dadosPorUO, { width, fill: "#d97706" }))}
  </div>

</div>

---

## Dados Detalhados

${searchInput}

```js
Inputs.table(tableData, {
  rows   : 20,
  sort   : COL.previsto,
  reverse: true,
  format : {
    [COL.previsto]: v => fmtBRL(+v || 0),
    ...(hasRealizado ? { [COL.realizado]: v => fmtBRL(+v || 0) } : {}),
  },
  width: {
    [COL.exercicio]   : 80,
    [COL.codigoUO]    : 90,
    [COL.codigoFonte] : 90,
    [COL.previsto]    : 140,
    ...(hasRealizado ? { [COL.realizado]: 140 } : {}),
  },
  header: {
    [COL.exercicio]  : "Exercício",
    [COL.nomeFonte]  : "Fonte de Recurso",
    [COL.nomeUO]     : "Unidade Orçamentária",
    [COL.previsto]   : "Valor Previsto",
    ...(hasRealizado ? { [COL.realizado]: "Valor Realizado" } : {}),
    ...(hasCategoria  ? { [COL.categoria]: "Categoria" }     : {}),
  },
})
```