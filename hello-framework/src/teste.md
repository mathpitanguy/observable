---
title: Painel de Gestão Orçamentária
theme: dashboard
toc: false
---
```js
const dados = await FileAttachment("data/dados.csv").csv({ typed: true });
```

```js 
const fmtBRL = v =>
  v == null ? "—"
  : "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) + "%" : "—";
```

```js 
const depSelect = view(
  Inputs.select(
    [null, ...new Set(dados.map(d => d.departamento))].sort(),
    { label: "Departamento", format: d => d ?? "Todos" }
  )
);
```

```js
const catSelect = view(
  Inputs.select(
    [null, ...new Set(dados.map(d => d.categoria))].sort(),
    { label: "Categoria", format: d => d ?? "Todas" }
  )
);
```

```js 
const busca = view(
  Inputs.search(dados, { label: "Busca geral", placeholder: "Digite para filtrar…" })
);
```

```js
const filtrados = busca.filter(d =>
  (depSelect == null || d.departamento === depSelect) &&
  (catSelect == null || d.categoria === catSelect)
);

const totOrc  = d3.sum(filtrados, d => d.valor_orcado);
const totReal = d3.sum(filtrados, d => d.valor_realizado);
const delta   = totReal - totOrc;

```

<div class="grid grid-cols-4">
  <div class="card">
    <h2>Total Orçado</h2>
    <span class="big">${fmtBRL(totOrc)}</span>
    <p>${dados.length} registros no total</p>
  </div>
  <div class="card">
    <h2>Total Realizado</h2>
    <span class="big">${fmtBRL(totReal)}</span>
    <p>${pct(totReal, totOrc)} executado</p>
  </div>
  <div class="card">
    <h2>Variação</h2>
    <span class="big" style="color: ${delta > 0 ? 'var(--theme-red)' : 'var(--theme-green)'}">
      ${delta > 0 ? "▲" : "▼"} ${fmtBRL(Math.abs(delta))}
    </span>
    <p>${delta > 0 ? "Acima do orçado" : "Dentro do orçado"}</p>
  </div>
  <div class="card">
    <h2>Registros filtrados</h2>
    <span class="big">${filtrados.length}</span>
    <p>de ${dados.length} totais</p>
  </div>
</div>

```js
const porDepto = d3.rollups(
  filtrados,
  v => ({
    orcado:    d3.sum(v, d => d.valor_orcado),
    realizado: d3.sum(v, d => d.valor_realizado)
  }),
  d => d.departamento
).flatMap(([dep, vals]) => [
  { departamento: dep, tipo: "Orçado",    valor: vals.orcado },
  { departamento: dep, tipo: "Realizado", valor: vals.realizado }
]);

const porCategoria = d3.rollups(
  filtrados,
  v => d3.sum(v, d => d.valor_realizado),
  d => d.categoria
).map(([categoria, valor]) => ({ categoria, valor }));

```
<div class="grid grid-cols-3" style="grid-auto-rows: auto;">
  <div class="card grid-colspan-2">
    <h2>Realizado vs. Orçado por Departamento</h2>
    ${resize((width) => Plot.plot({
      width,
      marginLeft: 120,
      x: { label: "R$", tickFormat: v => "R$ " + (v / 1000).toFixed(0) + "k" },
      y: { label: null },
      color: { legend: true, domain: ["Orçado", "Realizado"], range: ["#94a3b8", "#3b82f6"] },
      marks: [
        Plot.barX(porDepto, {
          x: "valor",
          y: "departamento",
          fill: "tipo",
          sort: { y: "x", reduce: "sum", reverse: true },
          tip: true
        }),
        Plot.ruleX([0])
      ]
    }))}
  </div>
  <div class="card">
    <h2>Por Categoria</h2>
    ${resize((width) => Plot.plot({
      width,
      marginLeft: 100,
      x: { label: "Realizado (R$)" },
      y: { label: null },
      marks: [
        Plot.barX(porCategoria, {
          x: "valor",
          y: "categoria",
          fill: "#6366f1",
          sort: { y: "x", reverse: true },
          tip: true
        }),
        Plot.ruleX([0])
      ]
    }))}
  </div>
</div>
<div class="card" style="margin-top: 1rem;">
  <h2>Detalhamento — ${filtrados.length} registro(s)</h2>
  ${Inputs.table(filtrados, {
    columns: ["id", "data", "departamento", "categoria", "valor_orcado", "valor_realizado"],
    header: {
      id: "ID",
      data: "Data",
      departamento: "Departamento",
      categoria: "Categoria",
      valor_orcado: "Orçado",
      valor_realizado: "Realizado"
    },
    format: {
      valor_orcado: v => fmtBRL(v),
      valor_realizado: (v, row) => {
        const cor = v > row.valor_orcado ? "tomato" : "steelblue";
        const el = document.createElement("span");
        el.style.color = cor;
        el.textContent = fmtBRL(v);
        return el;
      }
    },
    rows: 20,
    sort: "valor_realizado",
    reverse: true
  })}
</div>

```js

const pvLinhas = view(
  Inputs.select(["departamento", "categoria"], {
    label: "Linhas",
    format: d => d.replace(/_/g, " ")
  })
);

const pvColunas = view(
  Inputs.select([null, "departamento", "categoria"], {
    label: "Colunas",
    format: d => d ? d.replace(/_/g, " ") : "(nenhuma)"
  })
);

const pvValor = view(
  Inputs.select(["valor_realizado", "valor_orcado"], { label: "Valores" })
);

const pvAgg = view(
  Inputs.select(["soma", "média", "máximo", "mínimo", "contagem"], { label: "Agregação" })
);

function agregar(arr, tipo) {
  if (!arr || !arr.length) return 0;
  switch (tipo) {
    case "soma":     return d3.sum(arr);
    case "média":    return d3.mean(arr);
    case "máximo":   return d3.max(arr);
    case "mínimo":   return d3.min(arr);
    case "contagem": return arr.length;
    default:         return d3.sum(arr);
  }
}
<<<<<<< Updated upstream
```
=======

const rowVals = [...new Set(filtrados.map(d => d[pvLinhas]))].sort();
const colVals = pvColunas ? [...new Set(filtrados.map(d => d[pvColunas]))].sort() : null;
const fmtPivot = pvAgg === "contagem" ? v => v : v => fmtBRL(v);

const pivotRows = rowVals.map(r => {
  const obj      = { [pvLinhas]: r };
  const subDados = filtrados.filter(d => d[pvLinhas] === r);
  if (colVals) {
    colVals.forEach(c => {
      const vals = subDados.filter(d => d[pvColunas] === c).map(d => d[pvValor]);
      obj[c] = agregar(vals, pvAgg);
    });
    obj["Total"] = agregar(subDados.map(d => d[pvValor]), pvAgg);
  } else {
    obj["Valor"] = agregar(subDados.map(d => d[pvValor]), pvAgg);
  }
  return obj;
});

const pivotCols = [pvLinhas, ...(colVals ?? ["Valor"]), ...(colVals ? ["Total"] : [])];
```
<div class="card">
  ${Inputs.table(pivotRows, {
    columns: pivotCols,
    format: Object.fromEntries(
      pivotCols.filter(c => c !== pvLinhas).map(c => [c, fmtPivot])
    )
  })}
</div>
>>>>>>> Stashed changes
