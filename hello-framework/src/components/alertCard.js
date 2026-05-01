import { html } from "npm:htl";

export const ALERT_MAP = {
  "OK":                                                  { icon: "🟢", color: "#059669", bg: "#ecfdf5", border: "#6ee7b7" },
  "RECEITA A SER INFORMADA PELA DCGCE/SEPLAG":           { icon: "🟣", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
  "ATENCAO":                                             { icon: "🟠", color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
  "VALOR DISCREPANTE":                                   { icon: "⚠️",  color: "#b45309", bg: "#fef3c7", border: "#fbbf24" },
  "RECEITA NAO ESTIMADA":                                { icon: "🔴", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
  "RECEITA DE REPASSE DO FES E LANCADA PELA SPLOR":      { icon: "🔵", color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
  "RECEITA DE CONVENIOS EM FONTE NAO ESPERADA":          { icon: "🟤", color: "#92400e", bg: "#fef3c7", border: "#d97706" },
};

function normalizar(texto) {
  if (!texto) return "";
  return String(texto).toUpperCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getAlertStyle(alertText) {
  const key = normalizar(alertText);
  return ALERT_MAP[key] ?? { icon: "📌", color: "#64748b", bg: "#f8fafc", border: "#cbd5e1" };
}

export function AlertSummary(data, { field = "alertas" } = {}) {
  if (!data?.length) return html`<p style="color:#94a3b8">Sem dados de alerta.</p>`;

  const counts = new Map();
  for (const row of data) {
    const key = String(row[field] ?? "").trim();
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  const wrap = html`<div style="
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 8px;
  "></div>`;

  for (const [label, qty] of sorted) {
    const st = getAlertStyle(label);
    wrap.appendChild(html`<div style="
      display: flex;
      align-items: center;
      gap: 10px;
      background: ${st.bg};
      border: 1.5px solid ${st.border};
      border-radius: 10px;
      padding: 10px 16px;
      min-width: 160px;
      flex: 1 1 160px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    ">
      <span style="font-size:22px;line-height:1">${st.icon}</span>
      <div>
        <div style="font-size:20px;font-weight:800;color:${st.color};line-height:1.1">${qty}</div>
        <div style="font-size:10.5px;color:${st.color};opacity:0.85;margin-top:2px;max-width:160px;line-height:1.3">${label}</div>
      </div>
    </div>`);
  }

  return wrap;
}

export function AlertBadge(alertText) {
  const st = getAlertStyle(alertText);
  return html`<span style="
    display:inline-flex;align-items:center;gap:5px;
    background:${st.bg};color:${st.color};
    border:1px solid ${st.border};
    border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;
    white-space:nowrap;
  ">${st.icon} ${alertText}</span>`;
}