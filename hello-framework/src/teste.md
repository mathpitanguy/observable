---
theme: dashboard
toc: false
title: Painel LDO
---

```js
import * as d3                from "npm:d3";
import * as Plot              from "npm:@observablehq/plot";
import { html }               from "npm:htl";
import { KpiCard }            from "./components/kpiCard.js";
import { buildTable }         from "./components/revenueTable.js";
import { HorizontalBarChart } from "./components/revenueChart.js";
import {
  buildPivotTable,
  DIMENSOES,
  METRICAS_CAMPOS,
  AGREGACOES,
}                             from "./components/pivotTable.js";
```

```js
const rawReceitas = await FileAttachment("data/receita_analise.csv").csv({ typed: true });

const receitas = rawReceitas.map(d => ({
  ...d,
  val2024  : +d["2024"]              || 0,
  val2025  : +d["2025"]              || 0,
  val2026  : +d["reestimativa_2026"] || 0,
  siafi2026: +d["siafi_2026"]        || 0,
  val2027  : +d["2027"]              || 0,
}));
```

```js
// Listas únicas para os datalists
const uoOpcoes    = [...new Set(receitas.map(d => d.uo_sigla).filter(Boolean))].sort();
const fonteOpcoes = [...new Set(receitas.map(d => d.fonte_desc).filter(Boolean))].sort();
const alertasArr  = [...new Set(receitas.map(d => d.alertas).filter(Boolean))].sort();
```

```js
// Filtro UO — texto livre + datalist (dropdown ao clicar + digitação livre)
const inputUO = Inputs.text({
  placeholder: "Digite ou selecione a UO…",
  datalist   : uoOpcoes,
  spellcheck : false,
});

// Filtro Fonte — texto livre + datalist (dropdown ao clicar + digitação livre)
const inputFonte = Inputs.text({
  placeholder: "Digite ou selecione a fonte…",
  datalist   : fonteOpcoes,
  spellcheck : false,
});

// Filtro Alerta — select com todas as opções
const inputAlerta = Inputs.select(
  ["Todos", ...alertasArr],
  { label: null }
);
```

```js
const filterUO     = Generators.input(inputUO);
const filterFonte  = Generators.input(inputFonte);
const filterAlerta = Generators.input(inputAlerta);
```

```js
const allFiltered = receitas.filter(d => {
  if (filterUO    && !String(d.uo_sigla   ?? "").toLowerCase().includes(filterUO.toLowerCase()))    return false;
  if (filterFonte && !String(d.fonte_desc ?? "").toLowerCase().includes(filterFonte.toLowerCase())) return false;
  if (filterAlerta !== "Todos" && d.alertas !== filterAlerta)                                        return false;
  return true;
});
```

```js
const fmtBRL = v => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 2,
}).format(v);
const fmtPct = v => (v >= 0 ? "+" : "") + d3.format(".1%")(v);
const fmtN   = v => new Intl.NumberFormat("pt-BR").format(v);

const sum2025    = d3.sum(allFiltered, d => d.val2025);
const sum2026    = d3.sum(allFiltered, d => d.val2026);
const sumSiafi   = d3.sum(allFiltered, d => d.siafi2026);
const sum2027    = d3.sum(allFiltered, d => d.val2027);
const varPct2526 = sum2025 > 0 ? (sum2026 - sum2025) / sum2025 : 0;
const varPct2627 = sum2026 > 0 ? (sum2027 - sum2026) / sum2026 : 0;
const execPct    = sum2026 > 0 ? sumSiafi / sum2026 : 0;
const nLinhas    = allFiltered.length;

const normalizar = s =>
  String(s ?? "").toUpperCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const nOK           = allFiltered.filter(d => normalizar(d.alertas) === "OK").length;
const nDiscrepantes = allFiltered.filter(d => normalizar(d.alertas) === "VALOR DISCREPANTE").length;
const nAtencao      = allFiltered.filter(d => normalizar(d.alertas) === "ATENCAO").length;
```



```js
const topUOs = d3.rollups(
  allFiltered.filter(d => d.uo_sigla),
  v => d3.sum(v, d => d.val2027),
  d => d.uo_sigla
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([nome, valor]) => ({ nome, valor }));

const evolucao = [
  { ano: "2024",       valor: d3.sum(allFiltered, d => d.val2024) },
  { ano: "2025",       valor: sum2025  },
  { ano: "2026 Reest", valor: sum2026  },
  { ano: "SIAFI 2026", valor: sumSiafi },
  { ano: "2027 LDO",   valor: sum2027  },
].filter(d => d.valor > 0);

const corEvolucao = {
  "2024"      : "#c0392b",
  "2025"      : "#a93226",
  "2026 Reest": "#922b21",
  "SIAFI 2026": "#6e1f1a",
  "2027 LDO"  : "#4a1010",
};
```

```js
// FileAttachment garante que o Observable inclui a imagem no build.
// Coloque o arquivo em: src/assets/logo_governo_minas.png
const logoUrl = await FileAttachment("assets/logo_governo_minas.png").url();
```

```js
// Cabeçalho montado em JS para que ${logoUrl} seja resolvido corretamente
const cabecalho = html`
  <div class="dash-header">
    <div class="dash-header-spacer"></div>
    <div class="dash-header-center">
      <p class="dash-eyebrow">SEPLAG — SPLOR</p>
      <h1 class="dash-title">PAINEL LDO</h1>
    </div>
    <div class="dash-header-logo">
      <img src="${logoUrl}" alt="Governo de Minas Gerais" class="dash-logo" />
    </div>
  </div>
`;
```

<!--- cabeçalho renderizado via JS -->

```js
cabecalho
```


<!--- ══════════════════════════════════════
      KPI CARDS — linha 1
══════════════════════════════════════ -->
<div class="grid grid-cols-3">
  <div class="card">
    ${KpiCard({ label: "2026 Reestimativa", value: sum2026, format: "brl",
      subtitle: `Δ ${fmtPct(varPct2526)} comparado a 2025`,
      color: "#2563eb",
      icon: "", labelSize: "13px", labelWeight: "800",
      trend: varPct2627, trendLabel: "vs 2027 LDO" })}
  </div>
  <div class="card">
    ${KpiCard({ label: "SIAFI 2026", value: sumSiafi, format: "brl",
      subtitle: `Execução: ${d3.format(".1%")(execPct)} do Reestimado`,
      color: "#7c3aed",
      icon: "", labelSize: "13px", labelWeight: "800" })}
  </div>
  <div class="card">
    ${KpiCard({ label: "2027 LDO", value: sum2027, format: "brl",
      subtitle: `Δ ${fmtPct(varPct2627)} vs 2026 Reest.`,
      color: "#0891b2",
      icon: "", labelSize: "13px", labelWeight: "800" })}
  </div>
</div>

<!--- KPI CARDS — linha 2 (alertas) -->
<div class="grid grid-cols-3">
  <div class="card">
    ${KpiCard({ label: "Linhas com Status OK", value: nOK, format: "int",
      subtitle: `${d3.format(".1%")(nLinhas > 0 ? nOK / nLinhas : 0)} do total filtrado`,
      color: "#059669", icon: "✅" })}
  </div>
  <div class="card">
    ${KpiCard({ label: "Valores Discrepantes", value: nDiscrepantes, format: "int",
      subtitle: `${d3.format(".1%")(nLinhas > 0 ? nDiscrepantes / nLinhas : 0)} do total filtrado`,
      color: "#b45309", icon: "⚠️" })}
  </div>
  <div class="card">
    ${KpiCard({ label: "Atenção", value: nAtencao, format: "int",
      subtitle: `${d3.format(".1%")(nLinhas > 0 ? nAtencao / nLinhas : 0)} do total filtrado`,
      color: "#d97706", icon: "🟠" })}
  </div>
</div>

---

## Filtros

<div class="grid grid-cols-3">
  <div class="filtro-bloco">
    <span class="filtro-label">Unidade Orçamentária</span>
    ${inputUO}
  </div>
  <div class="filtro-bloco">
    <span class="filtro-label">Fonte de Recursos</span>
    ${inputFonte}
  </div>
  <div class="filtro-bloco">
    <span class="filtro-label">Tipo de Alerta</span>
    ${inputAlerta}
  </div>
</div>

---

## Análise das Receitas

```js
buildTable(allFiltered, { fmtBRL, fmtN })
```

---

<div class="grid grid-cols-2">
  <div class="card">
    <p class="chart-title">Top 10 UOs — 2027 LDO</p>
    ${resize(width => HorizontalBarChart(topUOs, { width, fill: "#8b1a1a" }))}
  </div>
  <div class="card">
    <p class="chart-title">Evolução da Receita Total</p>
    ${resize(width => Plot.plot({
      width,
      height      : 280,
      marginLeft  : 50,
      marginBottom: 40,
      style: { fontFamily: "var(--sans-serif, system-ui)", fontSize: "11px", background: "transparent" },
      x: { label: null, tickSize: 0 },
      y: {
        label: null,
        tickFormat: v => v >= 1e9
          ? d3.format(",.1f")(v / 1e9) + "Bi"
          : d3.format(",.1f")(v / 1e6) + "Mi",
      },
      marks: [
        Plot.barY(evolucao, {
          x: "ano", y: "valor",
          fill: d => corEvolucao[d.ano] ?? "#8b1a1a",
          fillOpacity: 0.9,
          rx: 4,
          tip: { format: { y: v => fmtBRL(v) } },
        }),
        Plot.text(evolucao, {
          x: "ano", y: "valor",
          text: d => fmtBRL(d.valor),
          dy: -8, textAnchor: "middle",
          fill: "var(--theme-foreground-muted, #94a3b8)",
          fontSize: 10,
        }),
        Plot.ruleY([0]),
      ],
    }))}
  </div>
</div>

---

## Tabela Interativa

```js
// ── Controles da pivot ───────────────────────────────────────────────────────
const pvInputDim = Inputs.select(
  DIMENSOES.map(d => d.key),
  {
    label  : null,
    format : key => DIMENSOES.find(d => d.key === key)?.label ?? key,
    value  : "uo_sigla",
  }
);

const pvInputCampo = Inputs.select(
  METRICAS_CAMPOS.map(d => d.key),
  {
    label  : null,
    format : key => METRICAS_CAMPOS.find(d => d.key === key)?.label ?? key,
    value  : "val2027",
  }
);

const pvInputAgreg = Inputs.select(
  AGREGACOES.map(d => d.key),
  {
    label  : null,
    format : key => AGREGACOES.find(d => d.key === key)?.label ?? key,
    value  : "soma",
  }
);
```

```js
const pvDim   = Generators.input(pvInputDim);
const pvCampo = Generators.input(pvInputCampo);
const pvAgreg = Generators.input(pvInputAgreg);
```

<div class="grid grid-cols-3">
  <div class="filtro-bloco">
    <span class="filtro-label">Agrupar por (Dimensão)</span>
    ${pvInputDim}
  </div>
  <div class="filtro-bloco">
    <span class="filtro-label">Campo de Valor</span>
    ${pvInputCampo}
  </div>
  <div class="filtro-bloco">
    <span class="filtro-label">Agregação</span>
    ${pvInputAgreg}
  </div>
</div>

```js
buildPivotTable(allFiltered, {
  dimKey   : pvDim,
  campoKey : pvCampo,
  agregKey : pvAgreg,
})
```

<style>
/* ══════════════════════════════════════════
   CABEÇALHO — gradiente bordô institucional
══════════════════════════════════════════ */
.dash-header {
  display        : flex;
  align-items    : center;
  justify-content: space-between;
  gap            : 16px;
  padding        : 16px 32px;
  margin-bottom  : 0.75rem;
  border-radius  : 10px;
  background     : linear-gradient(120deg, #6b1111 0%, #8b1a1a 55%, #a0281f 100%);
  box-shadow     : 0 4px 18px rgba(107, 17, 17, 0.28);
}

/* Coluna fantasma — mesma largura da logo para centralizar o título */
.dash-header-spacer {
  flex     : 0 0 200px;
  min-width: 0;
}

.dash-header-center {
  flex      : 1 1 0;
  text-align: center;
  min-width : 0;
}

/* "SEPLAG — SPLOR" — rosa claro sobre bordô */
.dash-eyebrow {
  margin         : 0 0 6px;
  font-family    : var(--sans-serif, system-ui, sans-serif);
  font-size      : 11px;
  font-weight    : 600;
  text-transform : uppercase;
  letter-spacing : .14em;
  color          : #f4b8b8;
}

/* Título principal — branco sobre gradiente */
.dash-title {
  margin         : 0 !important;
  font-family    : var(--sans-serif, system-ui, sans-serif) !important;
  font-size      : 32px !important;
  font-weight    : 900 !important;
  text-transform : uppercase !important;
  letter-spacing : .06em !important;
  color          : #ffffff !important;
  line-height    : 1.05 !important;
  white-space    : nowrap !important;
}

/* Coluna da logo */
.dash-header-logo {
  flex           : 0 0 200px;
  min-width      : 0;
  display        : flex;
  align-items    : center;
  justify-content: flex-end;
}

/* Logo com brilho suave para destacar sobre fundo escuro */
.dash-logo {
  max-height : 52px;
  max-width  : 200px;
  object-fit : contain;
  filter     : brightness(1.08) drop-shadow(0 1px 4px rgba(0,0,0,0.25));
}

/* ══════════════════════════════════════════
   TÍTULOS DE SEÇÃO — h2
══════════════════════════════════════════ */
h2 {
  font-family    : var(--sans-serif, system-ui, sans-serif) !important;
  font-size      : 21px !important;
  font-weight    : 800 !important;
  text-transform : uppercase !important;
  letter-spacing : .09em !important;
  color          : #8b1a1a !important;
  margin-top     : 2rem !important;
}

/* ══════════════════════════════════════════
   TÍTULOS INTERNOS DOS GRÁFICOS
══════════════════════════════════════════ */
.chart-title {
  margin         : 0 0 14px;
  font-family    : var(--sans-serif, system-ui, sans-serif);
  font-size      : 11px;
  font-weight    : 800;
  text-transform : uppercase;
  letter-spacing : .09em;
  color          : #8b1a1a;
}

/* ══════════════════════════════════════════
   FILTROS — título acima + input estilizado
══════════════════════════════════════════ */

/* Wrapper: empilha título + campo verticalmente */
.filtro-bloco {
  display       : flex;
  flex-direction: column;
  gap           : 6px;
}

/* Título acima do campo — preto, caixa alta, negrito */
.filtro-label {
  font-family    : var(--sans-serif, system-ui, sans-serif);
  font-size      : 11px;
  font-weight    : 900;
  text-transform : uppercase;
  letter-spacing : .08em;
  color          : #111111;
}

/* Oculta o label interno gerado automaticamente pelo Observable */
.filtro-bloco .observablehq--input label {
  display: none !important;
}

/* Garante que o wrapper do input ocupe 100% da coluna */
.filtro-bloco .observablehq--input,
.filtro-bloco .observablehq--input form {
  width: 100%;
}

/* Estilo dos campos — texto e select */
.filtro-bloco .observablehq--input input[type="text"],
.filtro-bloco .observablehq--input select {
  width        : 100%;
  box-sizing   : border-box;
  border       : 1.5px solid var(--theme-foreground-faintest, #e2e8f0);
  border-radius: 8px;
  padding      : 7px 11px;
  font-size    : 13px;
  background   : var(--theme-background, #ffffff);
  color        : var(--theme-foreground, #111111);
  outline      : none;
  transition   : border-color .15s, box-shadow .15s;
}

/* Foco: borda e halo em bordô */
.filtro-bloco .observablehq--input input[type="text"]:focus,
.filtro-bloco .observablehq--input select:focus {
  border-color: #8b1a1a;
  box-shadow  : 0 0 0 3px rgba(139, 26, 26, 0.12);
}

/* Placeholder suave */
.filtro-bloco .observablehq--input input[type="text"]::placeholder {
  color  : var(--theme-foreground-faint, #94a3b8);
  opacity: 1;
}

/* ══════════════════════════════════════════
   PIVOT — select sem label herda filtro-bloco
══════════════════════════════════════════ */
.filtro-bloco .observablehq--input select {
  appearance    : auto;
  cursor        : pointer;
}
</style>