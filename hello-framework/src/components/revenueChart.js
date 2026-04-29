// components/revenueChart.js
import { html } from "npm:htl";
import * as Plot from "npm:@observablehq/plot";
import * as d3   from "npm:d3";

const fmtBRL = v =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    notation: "compact", maximumFractionDigits: 2,
  }).format(v);

const fmtAxis = v =>
  v >= 1e9 ? d3.format(",.1f")(v / 1e9) + "Bi"
           : d3.format(",.1f")(v / 1e6) + "Mi";

// ─────────────────────────────────────────────────────────────────────────────
/**
 * HorizontalBarChart
 * Retorna um Plot.plot() para uso dentro de resize() no .md.
 *
 * @param {Array}  data          [{nome, valor}, …] ordenado desc
 * @param {object} opts
 * @param {number} opts.width
 * @param {string} [opts.fill="#3b82f6"]
 * @param {string} [opts.xField="valor"]
 * @param {string} [opts.yField="nome"]
 */
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
    x: {
      label: null,
      axis: "top",
      tickFormat: fmtAxis,
      tickSize: 3,
    },
    y: {
      label: null,
      domain: data.map(d => d[yField]),
      tickSize: 0,
    },
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

// ─────────────────────────────────────────────────────────────────────────────
/**
 * GroupedBarChart
 * Barras agrupadas para comparar duas séries (ex: previsto vs realizado).
 *
 * @param {Array}  data   dados "longos": [{categoria, grupo, valor}, …]
 * @param {object} opts
 * @param {number} opts.width
 * @param {string} [opts.xField="valor"]
 * @param {string} [opts.yField="categoria"]
 * @param {string} [opts.fyField="grupo"]
 * @param {string[]} [opts.colorRange]
 */
export function GroupedBarChart(
  data,
  {
    width,
    xField     = "valor",
    yField     = "categoria",
    fyField    = "grupo",
    colorRange = ["#3b82f6", "#10b981"],
  } = {}
) {
  if (!data?.length)
    return html`<p style="text-align:center;color:#94a3b8;padding:2rem 0;">
      📭 Sem dados para os filtros selecionados
    </p>`;

  const grupos = [...new Set(data.map(d => d[fyField]))];

  return Plot.plot({
    width,
    marginLeft  : Math.min(190, Math.round(width * 0.36)),
    marginRight : 76,
    marginTop   : 24,
    style: { fontFamily: "var(--sans-serif,system-ui)", fontSize: "11px", background: "transparent" },
    color: { domain: grupos, range: colorRange, legend: true },
    x: { label: null, axis: "top", tickFormat: fmtAxis },
    y: { label: null, tickSize: 0 },
    fy: { label: null },
    marks: [
      Plot.barX(data, {
        x: xField, y: fyField, fy: yField,
        fill: fyField, fillOpacity: 0.88, rx: 4,
        tip: { format: { x: v => fmtBRL(v), y: true } },
      }),
      Plot.text(data, {
        x: xField, y: fyField, fy: yField,
        text: d => fmtBRL(d[xField]),
        dx: 6, textAnchor: "start",
        fill: "var(--theme-foreground-muted,#94a3b8)",
        fontSize: 10,
      }),
      Plot.ruleX([0]),
      Plot.frame({ opacity: 0.25 }),
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * ExecutionDonut
 * Rosca SVG com percentual de execução no centro.
 *
 * @param {number} realizado
 * @param {number} previsto
 * @param {object} opts
 * @param {number} opts.width
 * @param {string} [opts.colorRealized="#059669"]
 * @param {string} [opts.colorRemainder="#e2e8f0"]
 */
export function ExecutionDonut(
  realizado,
  previsto,
  { width, colorRealized = "#059669", colorRemainder = "#e2e8f0" } = {}
) {
  const height = width;
  const radius = Math.min(width, height) / 2 - 4;
  const pct    = previsto > 0 ? Math.min(realizado / previsto, 1) : 0;

  const arc = d3.arc().innerRadius(radius * 0.62).outerRadius(radius);
  const pie = d3.pie().sort(null).padAngle(0.04);
  const slices = pie([pct, 1 - pct]);

  const svg = d3.create("svg")
    .attr("width", width).attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width:100%;height:auto;");

  svg.append("g").selectAll("path").data(slices).join("path")
    .attr("fill", (_, i) => [colorRealized, colorRemainder][i])
    .attr("d", arc);

  svg.append("text")
    .attr("text-anchor", "middle").attr("dy", "-0.15em")
    .attr("font-family", "system-ui,sans-serif")
    .attr("font-size", `${radius * 0.38}px`).attr("font-weight", "800")
    .attr("fill", "var(--theme-foreground,#0f172a)")
    .text(d3.format(".1%")(pct));

  svg.append("text")
    .attr("text-anchor", "middle").attr("dy", "1.1em")
    .attr("font-family", "system-ui,sans-serif")
    .attr("font-size", `${radius * 0.17}px`)
    .attr("fill", "var(--theme-foreground-muted,#64748b)")
    .text("execução");

  return svg.node();
}