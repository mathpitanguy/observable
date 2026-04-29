/**
 * revenueTable.js — Tabela filtrável por coluna para Receitas
 * Usada no Observable Framework. Cada coluna categórica tem seu próprio
 * campo de busca inline, e as colunas numéricas têm mini-filtros de range.
 *
 * Exporta:
 *   buildTable(data, { fmtBRL, fmtN }) → HTMLElement
 */

import { html } from "npm:htl";

// ── Definição de colunas ───────────────────────────────────────────────
const COLS = [
  { key: "uo_cod",      label: "UO Cód",                    type: "text",   width: 75  },
  { key: "uo_sigla",    label: "UO",                         type: "text",   width: 90  },
  { key: "receita_cod", label: "Classif. Receita Cód",       type: "text",   width: 130 },
  { key: "receita_desc",label: "Classificação da Receita",   type: "text",   width: 260 },
  { key: "fonte_cod",   label: "Fonte Cód",                  type: "text",   width: 75  },
  { key: "fonte_desc",  label: "Fonte de Recursos",          type: "text",   width: 190 },
  { key: "val2024",     label: "2024",                       type: "num",    width: 120 },
  { key: "val2025",     label: "2025",                       type: "num",    width: 120 },
  { key: "val2026",     label: "2026 Reest",                 type: "num",    width: 125 },
  { key: "siafi2026",   label: "SIAFI 2026",                 type: "num",    width: 125 },
  { key: "val2027",     label: "2027 LDO",                   type: "num",    width: 120 },
];

const PAGE_SIZE = 25;

// ── Componente principal ───────────────────────────────────────────────
export function buildTable(data, { fmtBRL, fmtN } = {}) {
  // ─── Estado interno ───────────────────────────────────────────────
  const state = {
    filters  : Object.fromEntries(COLS.map(c => [c.key, ""])),
    sortKey  : "val2025",
    sortDir  : -1,   // -1 desc / +1 asc
    page     : 0,
    data,
    fmtBRL   : fmtBRL ?? (v => v?.toLocaleString("pt-BR", { style:"currency", currency:"BRL" })),
    fmtN     : fmtN   ?? (v => (+v).toLocaleString("pt-BR")),
  };

  // ─── Raiz do componente ───────────────────────────────────────────
  const root = html`<div class="revenue-table-wrap"></div>`;
  render(root, state);
  return root;
}

// ── Render ─────────────────────────────────────────────────────────────
function render(root, state) {
  // Aplica filtros de texto / número
  const filtered = applyFilters(state.data, state.filters);

  // Ordena
  const sorted = [...filtered].sort((a, b) => {
    const va = a[state.sortKey] ?? "";
    const vb = b[state.sortKey] ?? "";
    return state.sortDir * (va < vb ? -1 : va > vb ? 1 : 0);
  });

  // Paginação
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page       = Math.min(state.page, totalPages - 1);
  const pageSlice  = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── HTML ─────────────────────────────────────────────────────────
  const totalWidth = COLS.reduce((s, c) => s + c.width, 0);

  root.innerHTML = "";
  root.appendChild(html`
    <style>
      .revenue-table-wrap {
        font-family: var(--sans-serif, system-ui, sans-serif);
        font-size: 12px;
      }
      .rt-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
        color: var(--theme-foreground-muted, #666);
        font-size: 11px;
      }
      .rt-scroll {
        overflow-x: auto;
        border: 1px solid var(--theme-foreground-faintest, #e5e7eb);
        border-radius: 6px;
      }
      table.rt {
        border-collapse: collapse;
        min-width: ${totalWidth}px;
        width: 100%;
      }
      table.rt thead tr.rt-headers th {
        background: var(--theme-background-alt, #f8fafc);
        border-bottom: 2px solid var(--theme-foreground-faintest, #e2e8f0);
        padding: 6px 8px 4px;
        text-align: left;
        font-weight: 600;
        white-space: nowrap;
        cursor: pointer;
        user-select: none;
        position: sticky;
        top: 0;
        z-index: 1;
      }
      table.rt thead tr.rt-headers th:hover {
        background: var(--theme-background, #f1f5f9);
      }
      table.rt thead tr.rt-headers th.num {
        text-align: right;
      }
      .sort-arrow {
        margin-left: 4px;
        font-size: 10px;
        opacity: 0.5;
      }
      .sort-arrow.active {
        opacity: 1;
        color: var(--theme-primary, #2563eb);
      }
      table.rt thead tr.rt-filters th {
        background: var(--theme-background, #fff);
        border-bottom: 1px solid var(--theme-foreground-faintest, #e2e8f0);
        padding: 3px 6px;
        position: sticky;
        top: 33px;
        z-index: 1;
      }
      .rt-filters input {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--theme-foreground-faintest, #d1d5db);
        border-radius: 4px;
        padding: 2px 5px;
        font-size: 11px;
        background: var(--theme-background, #fff);
        color: var(--theme-foreground, #111);
        outline: none;
      }
      .rt-filters input:focus {
        border-color: var(--theme-primary, #2563eb);
        box-shadow: 0 0 0 2px #2563eb22;
      }
      table.rt tbody tr {
        border-bottom: 1px solid var(--theme-foreground-faintest, #f1f5f9);
      }
      table.rt tbody tr:hover {
        background: var(--theme-background-alt, #f8fafc);
      }
      table.rt tbody td {
        padding: 5px 8px;
        white-space: nowrap;
        max-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--theme-foreground, #111);
      }
      table.rt tbody td.num {
        text-align: right;
        font-variant-numeric: tabular-nums;
        font-size: 11.5px;
      }
      table.rt tbody td.num.neg {
        color: #dc2626;
      }
      .rt-pager {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        margin-top: 8px;
        font-size: 11px;
        color: var(--theme-foreground-muted, #666);
      }
      .rt-pager button {
        border: 1px solid var(--theme-foreground-faintest, #d1d5db);
        background: var(--theme-background, #fff);
        border-radius: 4px;
        padding: 2px 8px;
        cursor: pointer;
        font-size: 11px;
      }
      .rt-pager button:disabled {
        opacity: 0.4;
        cursor: default;
      }
      .rt-pager button:not(:disabled):hover {
        background: var(--theme-background-alt, #f1f5f9);
      }
      .rt-clear-btn {
        border: none;
        background: none;
        color: var(--theme-primary, #2563eb);
        cursor: pointer;
        font-size: 11px;
        text-decoration: underline;
        padding: 0;
      }
    </style>
  `);

  // Contagem
  root.appendChild(html`
    <div class="rt-meta">
      <span>${state.fmtN(filtered.length)} registros · página ${page + 1} de ${totalPages}</span>
      <button class="rt-clear-btn" onclick=${() => {
        COLS.forEach(c => { state.filters[c.key] = ""; });
        state.page = 0;
        render(root, state);
      }}>✕ Limpar filtros</button>
    </div>
  `);

  // Tabela
  const scroll = html`<div class="rt-scroll"></div>`;
  const table  = html`<table class="rt"></table>`;

  // — Cabeçalho com colunas e setas de ordenação
  const thead = html`<thead></thead>`;
  const rowHeaders = html`<tr class="rt-headers"></tr>`;
  for (const col of COLS) {
    const isActive = state.sortKey === col.key;
    const arrow    = state.sortDir === -1 ? "▼" : "▲";
    const th = html`<th
      class=${col.type === "num" ? "num" : ""}
      style="width:${col.width}px; min-width:${col.width}px"
      title="Ordenar por ${col.label}"
    >
      ${col.label}
      <span class=${"sort-arrow" + (isActive ? " active" : "")}>
        ${isActive ? arrow : "↕"}
      </span>
    </th>`;
    th.addEventListener("click", () => {
      if (state.sortKey === col.key) {
        state.sortDir *= -1;
      } else {
        state.sortKey = col.key;
        state.sortDir = col.type === "num" ? -1 : 1;
      }
      state.page = 0;
      render(root, state);
    });
    rowHeaders.appendChild(th);
  }
  thead.appendChild(rowHeaders);

  // — Linha de filtros por coluna
  const rowFilters = html`<tr class="rt-filters"></tr>`;
  for (const col of COLS) {
    const input = html`<input
      type="text"
      placeholder=${col.type === "num" ? "≥ valor…" : "filtrar…"}
      value=${state.filters[col.key]}
      title="Filtrar: ${col.label}"
    />`;
    input.addEventListener("input", e => {
      state.filters[col.key] = e.target.value;
      state.page = 0;
      render(root, state);
    });
    const tfh = html`<th style="width:${col.width}px; min-width:${col.width}px">${input}</th>`;
    rowFilters.appendChild(tfh);
  }
  thead.appendChild(rowFilters);
  table.appendChild(thead);

  // — Corpo da tabela
  const tbody = html`<tbody></tbody>`;
  for (const row of pageSlice) {
    const tr = html`<tr></tr>`;
    for (const col of COLS) {
      const raw = row[col.key];
      if (col.type === "num") {
        const v = +raw || 0;
        const td = html`<td class=${"num" + (v < 0 ? " neg" : "")}
          title=${state.fmtBRL(v)}
        >${state.fmtBRL(v)}</td>`;
        tr.appendChild(td);
      } else {
        const td = html`<td title=${raw ?? ""}>${raw ?? ""}</td>`;
        tr.appendChild(td);
      }
    }
    tbody.appendChild(tr);
  }
  if (pageSlice.length === 0) {
    tbody.appendChild(html`
      <tr><td colspan=${COLS.length} style="text-align:center;padding:24px;color:#999">
        Nenhum registro encontrado com os filtros aplicados.
      </td></tr>
    `);
  }
  table.appendChild(tbody);
  scroll.appendChild(table);
  root.appendChild(scroll);

  // — Paginação
  const prev = html`<button disabled=${page === 0} onclick=${() => { state.page = page - 1; render(root, state); }}>‹ Anterior</button>`;
  const next = html`<button disabled=${page >= totalPages - 1} onclick=${() => { state.page = page + 1; render(root, state); }}>Próximo ›</button>`;
  root.appendChild(html`
    <div class="rt-pager">
      Linhas ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)}
      de ${state.fmtN(filtered.length)}
      ${prev} ${next}
    </div>
  `);
}

// ── Aplica filtros de texto e numérico ────────────────────────────────
function applyFilters(data, filters) {
  return data.filter(row => {
    for (const col of COLS) {
      const q = (filters[col.key] ?? "").trim();
      if (!q) continue;

      if (col.type === "num") {
        // Filtro numérico: suporta ">= x", "<= x", "x-y", ou apenas "x" (≥ x)
        const v = +row[col.key] || 0;
        const rangeMatch = q.match(/^(\d[\d.,]*)\s*-\s*(\d[\d.,]*)$/);
        if (rangeMatch) {
          const lo = parseLocaleNum(rangeMatch[1]);
          const hi = parseLocaleNum(rangeMatch[2]);
          if (v < lo || v > hi) return false;
        } else {
          const op  = q.match(/^(>=|<=|>|<)\s*([\d.,]+)$/);
          if (op) {
            const threshold = parseLocaleNum(op[2]);
            if (op[1] === ">=" && v < threshold) return false;
            if (op[1] === "<=" && v > threshold) return false;
            if (op[1] === ">"  && v <= threshold) return false;
            if (op[1] === "<"  && v >= threshold) return false;
          } else {
            // Número simples → interpreta como ≥ valor (em milhões se < 1000)
            const threshold = parseLocaleNum(q);
            if (!isNaN(threshold) && v < threshold) return false;
          }
        }
      } else {
        // Filtro textual: busca parcial case-insensitive
        if (!String(row[col.key] ?? "").toLowerCase().includes(q.toLowerCase())) return false;
      }
    }
    return true;
  });
}

// Converte string numérica pt-BR ("1.234,56") ou en-US ("1234.56") → number
function parseLocaleNum(s) {
  return parseFloat(String(s).replace(/\./g, "").replace(",", "."));
}
