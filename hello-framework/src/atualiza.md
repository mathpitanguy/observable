---
theme: dashboard
toc: false
title: Receitas — Visão Geral
---

```js
// ── Importações ───────────────────────────────────────────────────────
import * as d3 from "npm:d3";
import { buildTable } from "./components/revenueTable.js";

// ── Carregamento dos dados ────────────────────────────────────────────
const dadosBrutos = await FileAttachment("data/receita_analise.csv")
  .csv({ typed: true });

// ── Formatadores ──────────────────────────────────────────────────────
const fmtBRL = v => v?.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 2
});

const fmtN = v => new Intl.NumberFormat("pt-BR").format(v);
````

```js
// ── Listas únicas para filtros ────────────────────────────────────────
const anosArr = [
  "Todos",
  ...new Set(dadosBrutos.map(d => String(d.ano_ref)).filter(Boolean))
].sort().reverse();

const uosArr = [
  "Todas",
  ...new Set(dadosBrutos.map(d => d.uo_sigla).filter(Boolean))
].sort();

const fontesArr = [
  "Todas",
  ...new Set(dadosBrutos.map(d => d.fonte_desc).filter(Boolean))
].sort();
```

```js
// ── Inputs ────────────────────────────────────────────────────────────
const anoInput = Inputs.select(anosArr, {
  label: "Ano de Referência",
  value: anosArr[1] ?? "Todos"
});

const uoInput = Inputs.select(uosArr, {
  label: "Unidade Orçamentária",
  value: "Todas"
});

const fonteInput = Inputs.select(fontesArr, {
  label: "Fonte de Recursos",
  value: "Todas"
});

const selAno = Generators.input(anoInput);
const selUO = Generators.input(uoInput);
const selFonte = Generators.input(fonteInput);
```

```js
// ── Filtro principal (JS puro) ────────────────────────────────────────
const filtrados = dadosBrutos
  .filter(d =>
    (selAno === "Todos" || String(d.ano_ref) === selAno) &&
    (selUO === "Todas" || d.uo_sigla === selUO) &&
    (selFonte === "Todas" || d.fonte_desc === selFonte)
  )
  .map(d => ({
    uo_cod: d.uo_cod,
    uo_sigla: d.uo_sigla,
    receita_cod: d.receita_cod,
    receita_desc: d.receita_desc,
    fonte_cod: d.fonte_cod,
    fonte_desc: d.fonte_desc,
    val2024: d["2024"] || 0,
    val2025: d["2025"] || 0,
    val2026: d.reestimativa_2026 || 0,
    siafi2026: d.siafi_2026 || 0,
    val2027: d["2027"] || 0
  }));
```

```js
// ── Busca global ──────────────────────────────────────────────────────
const buscaInput = Inputs.search(filtrados, {
  placeholder: "Pesquisar UO, Receita ou Fonte..."
});

const dadosFinais = Generators.input(buscaInput);
```

```js
// ── KPIs (opcional, mas útil) ─────────────────────────────────────────
const sum2025  = d3.sum(dadosFinais, d => +d.val2025 || 0);
const sum2026  = d3.sum(dadosFinais, d => +d.val2026 || 0);
const nLinhas  = dadosFinais.length;
```

# Previsão de Receitas — Visão Geral
```js
${fmtN(nLinhas)} registros filtrados
```
---

## Filtros

<div class="grid grid-cols-3">
  <div>${anoInput}</div>
  <div>${uoInput}</div>
  <div>${fonteInput}</div>
</div>

---

## Busca

<div>${buscaInput}</div>

---

## Tabela

```js
buildTable(dadosFinais, { fmtBRL, fmtN })
```
