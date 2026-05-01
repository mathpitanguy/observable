---
theme: dashboard
toc: false
title: Receitas — Visão Geral
---

```js
import { DuckDBClient }      from "npm:@observablehq/duckdb";
import * as d3               from "npm:d3";
import * as Plot             from "npm:@observablehq/plot";
import { KpiCard }           from "./components/kpiCard.js";
import { buildTable }        from "./components/revenueTable.js";
import { AlertSummary }      from "./components/alertCard.js";
import { HorizontalBarChart } from "./components/revenueChart.js";
```

```js
const db = await DuckDBClient.of({
  receitas: FileAttachment("data/receita_analise.csv")
});
```

```js
const anosArr = (await db.query(`
  SELECT DISTINCT CAST(ano_ref AS VARCHAR) AS v
  FROM receitas WHERE ano_ref IS NOT NULL ORDER BY ano_ref DESC
`)).toArray().map(d => d.v);

const uosArr = (await db.query(`
  SELECT DISTINCT uo_sigla AS v FROM receitas WHERE uo_sigla IS NOT NULL ORDER BY uo_sigla
`)).toArray().map(d => d.v);

const fontesArr = (await db.query(`
  SELECT DISTINCT fonte_desc AS v FROM receitas WHERE fonte_desc IS NOT NULL ORDER BY fonte_desc
`)).toArray().map(d => d.v);

const alertasArr = (await db.query(`
  SELECT DISTINCT alertas AS v FROM receitas WHERE alertas IS NOT NULL ORDER BY alertas
`)).toArray().map(d => d.v);
```

```js
const anoInput    = Inputs.select(["Todos", ...anosArr],    { label: "Ano de Referência"    });
const uoInput     = Inputs.select(["Todas", ...uosArr],     { label: "Unidade Orçamentária" });
const fonteInput  = Inputs.select(["Todas", ...fontesArr],  { label: "Fonte de Recursos"    });
const alertaInput = Inputs.select(["Todos", ...alertasArr], { label: "Tipo de Alerta"       });

const selAno    = Generators.input(anoInput);
const selUO     = Generators.input(uoInput);
const selFonte  = Generators.input(fonteInput);
const selAlerta = Generators.input(alertaInput);
```

```js
const esc = s => String(s).replace(/'/g, "''");

const whereAno    = selAno    === "Todos" ? "1=1" : `CAST(ano_ref AS VARCHAR) = '${esc(selAno)}'`;
const whereUO     = selUO     === "Todas" ? "1=1" : `uo_sigla = '${esc(selUO)}'`;
const whereFonte  = selFonte  === "Todas" ? "1=1" : `fonte_desc = '${esc(selFonte)}'`;
const whereAlerta = selAlerta === "Todos" ? "1=1" : `alertas = '${esc(selAlerta)}'`;

const allFiltered = (await db.query(`
  SELECT
    uo_cod, uo_sigla, receita_cod, receita_desc,
    fonte_cod, fonte_desc, alertas,
    CAST("2024" AS DOUBLE)            AS val2024,
    CAST("2025" AS DOUBLE)            AS val2025,
    CAST(reestimativa_2026 AS DOUBLE) AS val2026,
    CAST(siafi_2026 AS DOUBLE)        AS siafi2026,
    CAST("2027" AS DOUBLE)            AS val2027
  FROM receitas
  WHERE ${whereAno} AND ${whereUO} AND ${whereFonte} AND ${whereAlerta}
  ORDER BY val2025 DESC NULLS LAST
`)).toArray();
```

```js
const sum2024    = d3.sum(allFiltered, d => +d.val2024   || 0);
const sum2025    = d3.sum(allFiltered, d => +d.val2025   || 0);
const sum2026    = d3.sum(allFiltered, d => +d.val2026   || 0);
const sumSiafi   = d3.sum(allFiltered, d => +d.siafi2026 || 0);
const sum2027    = d3.sum(allFiltered, d => +d.val2027   || 0);
const varPct2526 = sum2025 > 0 ? (sum2026 - sum2025) / sum2025 : 0;
const varPct2627 = sum2026 > 0 ? (sum2027 - sum2026) / sum2026 : 0;
const execPct    = sum2026 > 0 ? sumSiafi / sum2026 : 0;
const nUOs       = new Set(allFiltered.map(d => d.uo_sigla)).size;
const nFontes    = new Set(allFiltered.map(d => d.fonte_desc)).size;
const nLinhas    = allFiltered.length;
const nOK        = allFiltered.filter(d =>
  String(d.alertas ?? "").toUpperCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"") === "OK"
).length;

const fmtBRL = v => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 2
}).format(v);
const fmtPct = v => (v >= 0 ? "+" : "") + d3.format(".1%")(v);
const fmtN   = v => new Intl.NumberFormat("pt-BR").format(v);
```

```js
const topUOs = d3.rollups(
  allFiltered.filter(d => d.uo_sigla),
  v => d3.sum(v, d => +d.val2025 || 0),
  d => d.uo_sigla
).sort((a,b) => b[1]-a[1]).slice(0,10).map(([nome,valor]) => ({nome,valor}));

const evolucao = [
  { ano: "2024",       valor: sum2024  },
  { ano: "2025",       valor: sum2025  },
  { ano: "2026 Reest", valor: sum2026  },
  { ano: "SIAFI 2026", valor: sumSiafi },
  { ano: "2027 LDO",   valor: sum2027  },
].filter(d => d.valor > 0);
```

# 📊 Previsão de Receitas — Visão Geral

<p class="meta-info">${fmtN(nLinhas)} registros · ${fmtN(nUOs)} Unidades Orçamentárias · ${fmtN(nFontes)} fontes de recursos</p>

---

## 🔍 Filtros

<div class="grid grid-cols-4">
  <div>${anoInput}</div>
  <div>${uoInput}</div>
  <div>${fonteInput}</div>
  <div>${alertaInput}</div>
</div>

---

## 📈 Indicadores Principais

<div class="grid grid-cols-4">
  <div class="card">
    ${KpiCard({ label:"Total 2025 (LOA)", value:sum2025, format:"brl", subtitle:"Previsto Lei Orçamentária Anual", color:"#2563eb", icon:"📅", trend:varPct2526, trendLabel:"vs 2026 Reest." })}
  </div>
  <div class="card">
    ${KpiCard({ label:"2026 Reestimativa", value:sum2026, format:"brl", subtitle:`Δ ${fmtPct(varPct2526)} comparado a 2025`, color:varPct2526>=0?"#059669":"#dc2626", icon:"📊", trend:varPct2627, trendLabel:"vs 2027 LDO" })}
  </div>
  <div class="card">
    ${KpiCard({ label:"SIAFI 2026", value:sumSiafi, format:"brl", subtitle:`Execução: ${d3.format(".1%")(execPct)} do Reestimado`, color:"#7c3aed", icon:"🏦" })}
  </div>
  <div class="card">
    ${KpiCard({ label:"2027 LDO", value:sum2027, format:"brl", subtitle:`Δ ${fmtPct(varPct2627)} vs 2026 Reest.`, color:varPct2627>=0?"#0891b2":"#ea580c", icon:"🔮" })}
  </div>
</div>

<div class="grid grid-cols-4">
  <div class="card">
    ${KpiCard({ label:"Unidades Orçamentárias", value:nUOs, format:"int", subtitle:`${fmtN(nFontes)} fontes de recursos`, color:"#d97706", icon:"🏛️" })}
  </div>
  <div class="card">
    ${KpiCard({ label:"Total de Registros", value:nLinhas, format:"int", subtitle:"Linhas no filtro atual", color:"#0891b2", icon:"📋" })}
  </div>
  <div class="card">
    ${KpiCard({ label:"Linhas com Status OK", value:nOK, format:"int", subtitle:`${d3.format(".1%")(nLinhas>0?nOK/nLinhas:0)} do total filtrado`, color:"#059669", icon:"✅" })}
  </div>
  <div class="card">
    ${KpiCard({ label:"% Execução 2026", value:execPct, format:"pct", subtitle:"SIAFI vs Reestimativa 2026", color:execPct>=0.8?"#059669":execPct>=0.5?"#d97706":"#dc2626", icon:"⚙️" })}
  </div>
</div>

---

## 🚦 Resumo de Alertas

```js
AlertSummary(allFiltered, { field: "alertas" })
```

---

## 📊 Análises Visuais

<div class="grid grid-cols-2">
  <div class="card">
    <h3 style="margin:0 0 12px;font-size:14px;color:var(--theme-foreground-muted)">🏛️ Top 10 UOs — Previsto 2025</h3>
    ${resize(width => HorizontalBarChart(topUOs, { width, fill: "#3b82f6" }))}
  </div>
  <div class="card">
    <h3 style="margin:0 0 12px;font-size:14px;color:var(--theme-foreground-muted)">📈 Evolução da Receita Total</h3>
    ${resize(width => Plot.plot({
      width,
      height: 280,
      marginLeft: 50,
      marginBottom: 40,
      style: { fontFamily:"var(--sans-serif,system-ui)", fontSize:"11px", background:"transparent" },
      x: { label:null, tickSize:0 },
      y: {
        label: null,
        tickFormat: v => v >= 1e9 ? d3.format(",.1f")(v/1e9)+"Bi" : d3.format(",.1f")(v/1e6)+"Mi",
      },
      marks: [
        Plot.barY(evolucao, {
          x:"ano", y:"valor",
          fill: d => d.ano==="SIAFI 2026"?"#7c3aed":d.ano==="2027 LDO"?"#0891b2":"#3b82f6",
          fillOpacity:0.85, rx:4,
          tip:{ format:{ y: v => fmtBRL(v) } },
        }),
        Plot.text(evolucao, {
          x:"ano", y:"valor",
          text: d => fmtBRL(d.valor),
          dy:-8, textAnchor:"middle",
          fill:"var(--theme-foreground-muted,#94a3b8)", fontSize:10,
        }),
        Plot.ruleY([0]),
      ],
    }))}
  </div>
</div>

---

## 📋 Detalhamento — Visão Geral

```js
buildTable(allFiltered, { fmtBRL, fmtN })
```

<style>
.meta-info { color:var(--theme-foreground-muted);font-size:13px;margin:0 0 8px; }
</style>