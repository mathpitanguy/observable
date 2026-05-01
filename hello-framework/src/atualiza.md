---
theme: dashboard
toc: false
title: Fonte de Recursos
---

```js
import { DuckDBClient }       from "npm:@observablehq/duckdb";
import * as d3                from "npm:d3";
import * as Plot              from "npm:@observablehq/plot";
import { KpiCard }            from "./components/kpiCard.js";
import { AlertSummary }       from "./components/alertCard.js";
import { HorizontalBarChart, GroupedBarChart } from "./components/revenueChart.js";
```

```js
const db = await DuckDBClient.of({
  fontes: FileAttachment("data/fonte_analise.csv")
});
```

```js
const uosArr = (await db.query(`
  SELECT DISTINCT uo_sigla AS v FROM fontes WHERE uo_sigla IS NOT NULL ORDER BY uo_sigla
`)).toArray().map(d => d.v);

const fontesArr = (await db.query(`
  SELECT DISTINCT fonte_desc AS v FROM fontes WHERE fonte_desc IS NOT NULL ORDER BY fonte_desc
`)).toArray().map(d => d.v);

const alertasArr = (await db.query(`
  SELECT DISTINCT alertas AS v FROM fontes WHERE alertas IS NOT NULL ORDER BY alertas
`)).toArray().map(d => d.v);
```

```js
const uoInput     = Inputs.select(["Todas", ...uosArr],    { label: "Unidade Orçamentária" });
const fonteInput  = Inputs.select(["Todas", ...fontesArr], { label: "Fonte de Recursos"    });
const alertaInput = Inputs.select(["Todos", ...alertasArr],{ label: "Tipo de Alerta"       });

const selUO     = Generators.input(uoInput);
const selFonte  = Generators.input(fonteInput);
const selAlerta = Generators.input(alertaInput);
```

```js
const esc = s => String(s).replace(/'/g, "''");

const allFiltered = (await db.query(`
  SELECT
    uo_cod, uo_sigla,
    fonte_cod, fonte_desc, alertas,
    CAST("2024" AS DOUBLE)            AS val2024,
    CAST("2025" AS DOUBLE)            AS val2025,
    CAST(reestimativa_2026 AS DOUBLE) AS val2026,
    CAST("2027" AS DOUBLE)            AS val2027
  FROM fontes
  WHERE
    ${selUO     === "Todas" ? "1=1" : `uo_sigla = '${esc(selUO)}'`}
    AND ${selFonte  === "Todas" ? "1=1" : `fonte_desc = '${esc(selFonte)}'`}
    AND ${selAlerta === "Todos" ? "1=1" : `alertas = '${esc(selAlerta)}'`}
  ORDER BY val2025 DESC NULLS LAST
`)).toArray();
```

```js
const sum2025  = d3.sum(allFiltered, d => +d.val2025 || 0);
const sum2026  = d3.sum(allFiltered, d => +d.val2026 || 0);
const sum2027  = d3.sum(allFiltered, d => +d.val2027 || 0);
const sum2024  = d3.sum(allFiltered, d => +d.val2024 || 0);
const varPct   = sum2025 > 0 ? (sum2026 - sum2025) / sum2025 : 0;
const varPct27 = sum2026 > 0 ? (sum2027 - sum2026) / sum2026 : 0;
const varAcum  = sum2025 > 0 ? (sum2027 - sum2025) / sum2025 : 0;
const nUOs     = new Set(allFiltered.map(d => d.uo_sigla)).size;
const nFontes  = new Set(allFiltered.map(d => d.fonte_desc)).size;
const nLinhas  = allFiltered.length;
const nOK      = allFiltered.filter(d =>
  String(d.alertas ?? "").toUpperCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"") === "OK"
).length;

const fmtBRL = v => new Intl.NumberFormat("pt-BR", {
  style:"currency", currency:"BRL", notation:"compact", maximumFractionDigits:2
}).format(v);
const fmtPct = v => (v >= 0 ? "+" : "") + d3.format(".1%")(v);
const fmtN   = v => new Intl.NumberFormat("pt-BR").format(v);
```

```js
const topFontes = d3.rollups(
  allFiltered.filter(d => d.fonte_desc),
  v => d3.sum(v, d => +d.val2025 || 0),
  d => d.fonte_desc
).sort((a,b) => b[1]-a[1]).slice(0,10).map(([nome,valor]) => ({nome,valor}));

const top8Fontes = topFontes.slice(0,8).map(d => d.nome);
const comparGrupo = [];
for (const fonte of top8Fontes) {
  const rows = allFiltered.filter(d => d.fonte_desc === fonte);
  const label = fonte.length > 28 ? fonte.substring(0,28)+"…" : fonte;
  comparGrupo.push({ categoria: label, grupo:"2025 Prev.",  valor: d3.sum(rows, d => +d.val2025||0) });
  comparGrupo.push({ categoria: label, grupo:"2026 Reest.", valor: d3.sum(rows, d => +d.val2026||0) });
}
```

# 💰 Análise por Fonte de Recursos

<p class="meta-info">${fmtN(nLinhas)} registros · ${fmtN(nFontes)} fontes · ${fmtN(nUOs)} Unidades Orçamentárias</p>

---

## 🔍 Filtros

<div class="grid grid-cols-3">
  <div>${uoInput}</div>
  <div>${fonteInput}</div>
  <div>${alertaInput}</div>
</div>

---

## 📈 Indicadores

<div class="grid grid-cols-4">
  <div class="card">
    ${KpiCard({ label:"Total 2025", value:sum2025, format:"brl", subtitle:"Previsto 2025", color:"#2563eb", icon:"📅", trend:varPct, trendLabel:"vs 2026" })}
  </div>
  <div class="card">
    ${KpiCard({ label:"2026 Reestimativa", value:sum2026, format:"brl", subtitle:`Δ ${fmtPct(varPct)} vs 2025`, color:varPct>=0?"#059669":"#dc2626", icon:"📊" })}
  </div>
  <div class="card">
    ${KpiCard({ label:"2027 LDO", value:sum2027, format:"brl", subtitle:`Δ ${fmtPct(varPct27)} vs 2026`, color:varPct27>=0?"#0891b2":"#ea580c", icon:"🔮", trend:varPct27, trendLabel:"vs 2026" })}
  </div>
  <div class="card">
    ${KpiCard({ label:"Linhas OK / Total", value:nOK, format:"int", subtitle:`${d3.format(".1%")(nLinhas>0?nOK/nLinhas:0)} sem alertas`, color:"#059669", icon:"✅" })}
  </div>
</div>

<div class="grid grid-cols-3">
  <div class="card">
    ${KpiCard({ label:"Fontes de Recursos", value:nFontes, format:"int", subtitle:"Fontes distintas no filtro", color:"#d97706", icon:"🗂️" })}
  </div>
  <div class="card">
    ${KpiCard({ label:"Unidades Orçamentárias", value:nUOs, format:"int", subtitle:"UOs com receitas no filtro", color:"#7c3aed", icon:"🏛️" })}
  </div>
  <div class="card">
    ${KpiCard({ label:"Variação 2025→2027", value:varAcum, format:"pct", subtitle:"Crescimento acumulado previsto", color:"#0891b2", icon:"📐" })}
  </div>
</div>

---

## 🚦 Alertas por Fonte

```js
AlertSummary(allFiltered, { field: "alertas" })
```

---

## 📊 Análises Visuais

<div class="grid grid-cols-2">
  <div class="card">
    <h3 style="margin:0 0 12px;font-size:14px;color:var(--theme-foreground-muted)">🏆 Top 10 Fontes — Previsto 2025</h3>
    ${resize(width => HorizontalBarChart(topFontes, { width, fill:"#10b981" }))}
  </div>
  <div class="card">
    <h3 style="margin:0 0 12px;font-size:14px;color:var(--theme-foreground-muted)">⚖️ Comparativo 2025 vs 2026 — Top 8 Fontes</h3>
    ${resize(width => GroupedBarChart(comparGrupo, { width, colorRange:["#3b82f6","#10b981"], xField:"valor", yField:"grupo", fyField:"categoria" }))}
  </div>
</div>

---

## 📋 Detalhamento — Fonte de Recursos

```js
import { buildFonteTable } from "./components/fonteTable.js";
buildFonteTable(allFiltered, { fmtBRL, fmtN })
```

<style>
.meta-info { color:var(--theme-foreground-muted);font-size:13px;margin:0 0 8px; }
</style>