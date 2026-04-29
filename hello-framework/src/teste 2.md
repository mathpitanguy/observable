---
theme: dashboard
toc: false
title: Receitas — Visão Geral
---

```js
import { DuckDBClient } from "npm:@observablehq/duckdb";
import * as d3           from "npm:d3";
import { KpiCard }       from "./components/kpiCard.js";
import { buildTable }    from "./components/revenueTable.js";
```

```js
// ── Carrega dados ──────────────────────────────────────────────────────
const db = await DuckDBClient.of({
  receitas: FileAttachment("data/receita_analise.csv")
});
```

```js
// ── Listas únicas para os selects ─────────────────────────────────────
const anosArr = (await db.query(`
  SELECT DISTINCT CAST(ano_ref AS VARCHAR) AS v
  FROM receitas WHERE ano_ref IS NOT NULL ORDER BY ano_ref DESC
`)).toArray().map(d => d.v);

const uosArr = (await db.query(`
  SELECT DISTINCT uo_sigla AS v
  FROM receitas WHERE uo_sigla IS NOT NULL ORDER BY uo_sigla
`)).toArray().map(d => d.v);

const fontesArr = (await db.query(`
  SELECT DISTINCT fonte_desc AS v
  FROM receitas WHERE fonte_desc IS NOT NULL ORDER BY fonte_desc
`)).toArray().map(d => d.v);
```

```js
// ── Inputs de filtro ──────────────────────────────────────────────────
const anoInput   = Inputs.select(["Todos", ...anosArr],   { label: "Ano de Referência",    value: anosArr[0] ?? "Todos" });
const uoInput    = Inputs.select(["Todas", ...uosArr],    { label: "Unidade Orçamentária", value: "Todas" });
const fonteInput = Inputs.select(["Todas", ...fontesArr], { label: "Fonte de Recursos",    value: "Todas" });

const selAno   = Generators.input(anoInput);
const selUO    = Generators.input(uoInput);
const selFonte = Generators.input(fonteInput);
```

```js
// ── Filtragem principal via DuckDB ────────────────────────────────────
const esc = s => String(s).replace(/'/g, "''");

const whereAno   = selAno   === "Todos" ? "1=1" : `CAST(ano_ref AS VARCHAR) = '${esc(selAno)}'`;
const whereUO    = selUO    === "Todas" ? "1=1" : `uo_sigla = '${esc(selUO)}'`;
const whereFonte = selFonte === "Todas" ? "1=1" : `fonte_desc = '${esc(selFonte)}'`;

const mainSQL = `
  SELECT
    uo_cod,
    uo_sigla,
    receita_cod,
    receita_desc,
    fonte_cod,
    fonte_desc,
    CAST("2024" AS DOUBLE)            AS val2024,
    CAST("2025" AS DOUBLE)            AS val2025,
    CAST(reestimativa_2026 AS DOUBLE) AS val2026,
    CAST(siafi_2026 AS DOUBLE)        AS siafi2026,
    CAST("2027" AS DOUBLE)            AS val2027
  FROM receitas
  WHERE ${whereAno} AND ${whereUO} AND ${whereFonte}
  ORDER BY val2025 DESC NULLS LAST
`;

const allFiltered = (await db.query(mainSQL)).toArray();
```

```js
// ── KPIs ──────────────────────────────────────────────────────────────
const sum2025  = d3.sum(allFiltered, d => +d.val2025  || 0);
const sum2026  = d3.sum(allFiltered, d => +d.val2026  || 0);
const sumSiafi = d3.sum(allFiltered, d => +d.siafi2026 || 0);
const varPct   = sum2025 > 0 ? (sum2026 - sum2025) / sum2025 : 0;
const nUOs     = new Set(allFiltered.map(d => d.uo_sigla)).size;
const nFontes  = new Set(allFiltered.map(d => d.fonte_desc)).size;
const nLinhas  = allFiltered.length;

const fmtBRL = v => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL",
  notation: "compact", maximumFractionDigits: 2
}).format(v);
const fmtPct = v => (v >= 0 ? "+" : "") + d3.format(".1%")(v);
const fmtN   = v => new Intl.NumberFormat("pt-BR").format(v);
```

# Previsão de Receitas — Visão Geral

${fmtN(nLinhas)} registros filtrados · ${fmtN(nUOs)} UOs · ${fmtN(nFontes)} fontes de recursos


## Indicadores

<div class="grid grid-cols-4">

  <div class="card">
    ${KpiCard({
      label   : "Total 2025",
      value   : sum2025,
      format  : "brl",
      subtitle: "Previsto LOA 2025",
      color   : "#2563eb",
      icon    : "📅",
    })}
  </div>

  <div class="card">
    ${KpiCard({
      label   : "Total 2026 Reest.",
      value   : sum2026,
      format  : "brl",
      subtitle: `Variação: ${fmtPct(varPct)} vs 2025`,
      color   : varPct >= 0 ? "#059669" : "#dc2626",
      icon    : "📊",
    })}
  </div>

  <div class="card">
    ${KpiCard({
      label   : "SIAFI 2026",
      value   : sumSiafi,
      format  : "brl",
      subtitle: "Arrecadação registrada SIAFI",
      color   : "#7c3aed",
      icon    : "🏦",
    })}
  </div>

  <div class="card">
    ${KpiCard({
      label   : "Unidades Orçamentárias",
      value   : nUOs,
      format  : "int",
      subtitle: `${fmtN(nFontes)} fontes · ${fmtN(nLinhas)} linhas`,
      color   : "#d97706",
      icon    : "🏛️",
    })}
  </div>

</div>

---

## Filtros

<div class="grid grid-cols-3">
  <div>${anoInput}</div>
  <div>${uoInput}</div>
  <div>${fonteInput}</div>
</div>

---

## Visão Geral

```js
buildTable(allFiltered, { fmtBRL, fmtN })
```
