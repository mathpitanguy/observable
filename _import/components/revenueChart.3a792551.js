import { html } from "../../_npm/htl@0.3.1/72f4716c.js";
import * as Plot from "../../_npm/@observablehq/plot@0.6.17/a96a6bbb.js";
import * as d3   from "../../_npm/d3@7.9.0/66d82917.js";

const fmtBRL = v =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    notation: "compact", maximumFractionDigits: 2,
  }).format(v);

const fmtAxis = v =>
  v >= 1e9 ? d3.format(",.1f")(v / 1e9) + "Bi"
           : d3.format(",.1f")(v / 1e6) + "Mi";

export function HorizontalBarChart(
  data,
  { width, fill = "#3b82f6", xField = "valor", yField = "nome" } = {}
) {
  if (!data?.length)
    return html`<p style="text-align:center;color:#94a3b8;padding:2rem 0;">
      📭 Sem dados para os filtros selecionados
    </p>`;

  return Plot.plot({
    width,
    height: Math.max(160, data.length * 32 + 40),
    marginLeft  : Math.min(190, Math.round(width * 0.36)),
    marginRight : 76,
    marginTop   : 24,
    marginBottom: 8,
    style: { fontFamily: "var(--sans-serif,system-ui)", fontSize: "11px", background: "transparent" },
    x: { label: null, axis: "top", tickFormat: fmtAxis, tickSize: 3 },
    y: { label: null, domain: data.map(d => d[yField]), tickSize: 0 },
    marks: [
      Plot.barX(data, {
        x: xField, y: yField,
        fill, fillOpacity: 0.88, rx: 4,
        tip: { format: { x: v => fmtBRL(v), y: true } },
      }),
      Plot.text(data, {
        x: xField, y: yField,
        text: d => fmtBRL(d[xField]),
        dx: 6, textAnchor: "start",
        fill: "var(--theme-foreground-muted,#94a3b8)",
        fontSize: 10,
      }),
      Plot.ruleX([0]),
    ],
  });
}
