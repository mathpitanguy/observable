import { html } from "npm:htl";
import * as d3 from "npm:d3";

const fmtBRL = v =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    notation: "compact", maximumFractionDigits: 2,
  }).format(v);

const fmtInt = v => new Intl.NumberFormat("pt-BR").format(v);
const fmtPct = v => (v >= 0 ? "+" : "") + d3.format(".1%")(v);

export function KpiCard({
  label,
  value,
  format      = "brl",
  subtitle,
  color       = "#2563eb",
  icon        = "📊",
  trend,
  trendLabel,
  labelSize   = "11px",
  labelWeight = "600",
} = {}) {
  const formatted =
    format === "brl" ? fmtBRL(value) :
    format === "pct" ? d3.format(".1%")(value) :
    fmtInt(value);

  const trendUp    = trend !== undefined && trend >= 0;
  const trendIcon  = trend !== undefined ? (trendUp ? "▲" : "▼") : "";
  const trendColor = trend !== undefined ? (trendUp ? "#059669" : "#dc2626") : "";

  return html`<div style="
    display:flex;flex-direction:column;gap:6px;
    padding:18px 20px 14px;
    border-left: 4px solid ${color};
    height:100%;box-sizing:border-box;
  ">
    <div style="display:flex;align-items:center;gap:8px;">
      ${icon ? html`<span style="font-size:20px">${icon}</span>` : ""}
      <span style="
        font-size:${labelSize};font-weight:${labelWeight};text-transform:uppercase;
        letter-spacing:.06em;color:var(--theme-foreground-muted,#64748b);
      ">${label}</span>
    </div>
    <div style="
      font-size:28px;font-weight:800;
      color:${color};
      letter-spacing:-0.03em;line-height:1;
      margin-top:4px;
    ">${formatted}</div>
    ${subtitle ? html`<div style="
      font-size:11.5px;color:var(--theme-foreground-muted,#94a3b8);margin-top:2px;
    ">${subtitle}</div>` : ""}
    ${trend !== undefined ? html`<div style="
      font-size:11px;font-weight:600;color:${trendColor};
      margin-top:4px;display:flex;align-items:center;gap:3px;
    ">
      <span>${trendIcon} ${fmtPct(trend)}</span>
      ${trendLabel ? html`<span style="color:var(--theme-foreground-muted,#94a3b8);font-weight:400"> ${trendLabel}</span>` : ""}
    </div>` : ""}
  </div>`;
}