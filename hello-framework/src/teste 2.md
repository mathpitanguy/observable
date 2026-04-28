---
title: Gestão Orçamentária Pro (DuckDB Estável)
theme: dashboard
toc: false
---

```js
import { html } from "npm:htl";
import * as duckdb from "npm:@duckdb/duckdb-wasm";
```

<style> .dashboard { display: grid; gap: 16px; } .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; } .card { background: white; border-radius: 14px; padding: 16px; box-shadow: 0 1px 2px rgba(0,0,0,.06); } .kpi-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; } .kpi-value { font-size: 22px; font-weight: bold; } .grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; } </style>

```js
// ===== DADOS =====
const dados = await FileAttachment("data/dados.csv").csv({ typed: true });

// ===== FILTROS =====
const filtroDept = view(
  Inputs.select(
    ["Todos", ...new Set(dados.map(d => d.departamento))],
    { label: "Departamento", value: "Todos" }
  )
);

const filtroCategoria = view(
  Inputs.select(
    ["Todos", ...new Set(dados.map(d => d.categoria))],
    { label: "Categoria", value: "Todos" }
  )
);

const busca = view(
  Inputs.text({ label: "Busca", placeholder: "Digite para filtrar..." })
);

// ===== DUCKDB (SEM WORKER - ESTÁVEL) =====
const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger());

const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
await db.instantiate(bundle.mainModule);

const conn = await db.connect();

// registra dados
await conn.insertJSON(dados, { name: "dados" });

// ===== QUERY (PIVOT VIA SQL) =====
const termo = (busca || "").toLowerCase();

const df = await conn.query(`
  SELECT
    departamento,
    categoria,
    SUM(valor_orcado) AS orcado,
    SUM(valor_realizado) AS realizado
  FROM dados
  WHERE
    (${filtroDept === "Todos"} OR departamento = '${filtroDept}')
    AND (${filtroCategoria === "Todos"} OR categoria = '${filtroCategoria}')
    AND (
      '${termo}' = '' OR
      LOWER(departamento) LIKE '%' || '${termo}' || '%' OR
      LOWER(categoria) LIKE '%' || '${termo}' || '%'
    )
  GROUP BY departamento, categoria
`).then(r => r.toArray());

// ===== KPIs =====
const fmt = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const totOrc  = d3.sum(df, d => d.orcado);
const totReal = d3.sum(df, d => d.realizado);
const delta   = totReal - totOrc;

display(html`
<div class="dashboard">

  <div class="kpi-grid">
    <div class="card">
      <div class="kpi-label">Orçado</div>
      <div class="kpi-value">${fmt(totOrc)}</div>
    </div>

    <div class="card">
      <div class="kpi-label">Realizado</div>
      <div class="kpi-value">${fmt(totReal)}</div>
    </div>

    <div class="card">
      <div class="kpi-label">Variação</div>
      <div class="kpi-value" style="color:${delta > 0 ? '#dc2626' : '#16a34a'}">
        ${delta > 0 ? '▲' : '▼'} ${fmt(Math.abs(delta))}
      </div>
    </div>

    <div class="card">
      <div class="kpi-label">Linhas</div>
      <div class="kpi-value">${df.length}</div>
    </div>
  </div>

</div>
`);

// ===== GRÁFICOS =====
display(html`<div class="grid-2">`);

display(
  resize(width =>
    Plot.plot({
      width,
      marginBottom: 60,
      x: { tickRotate: -30 },
      y: { grid: true },
      marks: [
        Plot.barY(df, {
          x: "departamento",
          y: "realizado",
          fill: "#2563eb",
          title: d => `${d.departamento}: ${fmt(d.realizado)}`
        })
      ]
    })
  )
);

display(
  resize(width =>
    Plot.plot({
      width,
      marginLeft: 120,
      marks: [
        Plot.barX(df, {
          y: "categoria",
          x: "realizado",
          fill: "#3b82f6",
          title: d => `${d.categoria}: ${fmt(d.realizado)}`
        })
      ]
    })
  )
);

display(html`</div>`);

// ===== TABELA =====
view(Inputs.table(df, { rows: 15 }));
