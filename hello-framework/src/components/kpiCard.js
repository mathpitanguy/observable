// components/kpiCard.js
import { html } from "npm:htl";
import * as d3  from "npm:d3";

const fmtBRL = v =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    notation: "compact", maximumFractionDigits: 2,
  }).format(v);

const fmtInt = v => new Intl.NumberFormat("pt-BR").format(v);
const fmtPct = d3.format(".1%");

/**
 * KpiCard — nó DOM para uso dentro de <div class="card"> do Framework
 *
 * @param {object}  opts
 * @param {string}  opts.label
 * @param {number}  opts.value
 * @param {"brl"|"int"|"pct"} [opts.format="brl"]
 * @param {string}  [opts.subtitle]
 * @param {number}  [opts.trend]     decimal (0.05 = +5 %)
 * @param {number}  [opts.progress]  0–1 para barra de execução
 * @param {string}  [opts.color]     cor de destaque
 * @param {string}  [opts.icon]
 */
export function KpiCard({
  label,
  value,
  format   = "brl",
  subtitle = "",
  trend    = null,
  progress = null,
  color    = "#3b82f6",
  icon     = "📊",
} = {}) {
  const display =
    format === "brl" ? fmtBRL(value) :
    format === "pct" ? fmtPct(value) :
    fmtInt(value);

  return html`<div style="
      display:flex; flex-direction:column; gap:4px;
      font-family:var(--sans-serif,system-ui,sans-serif);
    ">
    <!-- Rótulo -->
    <div style="
      display:flex; align-items:center; gap:6px;
      font-size:0.68rem; font-weight:600; text-transform:uppercase;
      letter-spacing:0.09em; color:var(--theme-foreground-muted,#64748b);
    ">
      <span>${icon}</span><span>${label}</span>
    </div>

    <!-- Valor + badge de tendência -->
    <div style="display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; margin-top:2px;">
      <span style="
        font-size:clamp(1.35rem,3vw,1.85rem); font-weight:800;
        letter-spacing:-0.03em; line-height:1.1;
        color:var(--theme-foreground,#0f172a);
        border-bottom:3px solid ${color}; padding-bottom:1px;
      ">${display}</span>

      ${trend !== null ? html`<span style="
        font-size:0.67rem; font-weight:700;
        padding:2px 8px; border-radius:99px;
        background:${trend >= 0 ? "#dcfce7" : "#fee2e2"};
        color:${trend >= 0 ? "#15803d" : "#b91c1c"};
      ">${trend >= 0 ? "▲" : "▼"} ${fmtPct(Math.abs(trend))}</span>` : ""}
    </div>

    <!-- Subtítulo -->
    ${subtitle ? html`<div style="
      font-size:0.72rem; color:var(--theme-foreground-muted,#94a3b8); margin-top:1px;
    ">${subtitle}</div>` : ""}

    <!-- Barra de progresso -->
    ${progress !== null ? html`<div style="
      margin-top:10px; height:5px; border-radius:99px;
      background:var(--theme-background-alt,#e2e8f0); overflow:hidden;
    ">
      <div style="
        width:${Math.min(1, progress) * 100}%; height:100%;
        border-radius:99px; background:${color};
        transition:width 0.5s cubic-bezier(.4,0,.2,1);
      "></div>
    </div>` : ""}
  </div>`;
}