// revenueTable.js (versão com DuckDB)

import { html } from "npm:htl";

const COLS = [
  { key: "uo_cod", label: "UO Cód", type: "text", width: 75 },
  { key: "uo_sigla", label: "UO", type: "text", width: 90 },
  { key: "receita_cod", label: "Classif. Receita Cód", type: "text", width: 130 },
  { key: "receita_desc", label: "Classificação da Receita", type: "text", width: 260 },
  { key: "fonte_cod", label: "Fonte Cód", type: "text", width: 75 },
  { key: "fonte_desc", label: "Fonte de Recursos", type: "text", width: 190 },
  { key: "val2024", label: "2024", type: "num", width: 120 },
  { key: "val2025", label: "2025", type: "num", width: 120 },
  { key: "val2026", label: "2026 Reest", type: "num", width: 125 },
  { key: "siafi2026", label: "SIAFI 2026", type: "num", width: 125 },
  { key: "val2027", label: "2027 LDO", type: "num", width: 120 }
];

const PAGE_SIZE = 25;

export function buildTable(db, baseWhere, { fmtBRL, fmtN } = {}) {
  const state = {
    filters: Object.fromEntries(COLS.map(c => [c.key, ""])),
    sortKey: "val2025",
    sortDir: -1,
    page: 0
  };

  const root = html`<div class="revenue-table-wrap"></div>`;
  render(root, state);

  async function render(root, state) {

    const whereCols = buildWhere(state.filters);
    const orderSQL = `${state.sortKey} ${state.sortDir === -1 ? "DESC" : "ASC"}`;

    const sql = `
      SELECT *
      FROM (
        SELECT
          uo_cod,
          uo_sigla,
          receita_cod,
          receita_desc,
          fonte_cod,
          fonte_desc,
          CAST("2024" AS DOUBLE) AS val2024,
          CAST("2025" AS DOUBLE) AS val2025,
          CAST(reestimativa_2026 AS DOUBLE) AS val2026,
          CAST(siafi_2026 AS DOUBLE) AS siafi2026,
          CAST("2027" AS DOUBLE) AS val2027
        FROM receitas
        WHERE ${baseWhere} AND ${whereCols}
      )
      ORDER BY ${orderSQL}
      LIMIT ${PAGE_SIZE}
      OFFSET ${state.page * PAGE_SIZE}
    `;

    const data = (await db.query(sql)).toArray();

    // total count (para paginação)
    const countSQL = `
      SELECT COUNT(*) as n
      FROM receitas
      WHERE ${baseWhere} AND ${whereCols}
    `;
    const total = (await db.query(countSQL)).toArray()[0].n;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    drawTable(root, state, data, total, totalPages);
  }

  function drawTable(root, state, data, total, totalPages) {
    root.innerHTML = "";

    root.appendChild(html`
      <div class="rt-meta">
        <span>${fmtN(total)} registros · página ${state.page + 1} de ${totalPages}</span>
      </div>
    `);

    const table = html`<table class="rt"></table>`;
    const thead = html`<thead></thead>`;

    const rowHeaders = html`<tr></tr>`;
    for (const col of COLS) {
      const th = html`<th>${col.label}</th>`;
      th.onclick = () => {
        state.sortKey = col.key;
        state.sortDir *= -1;
        state.page = 0;
        render(root, state);
      };
      rowHeaders.appendChild(th);
    }

    const rowFilters = html`<tr></tr>`;
    for (const col of COLS) {
      const input = html`<input placeholder="filtrar...">`;
      input.oninput = e => {
        state.filters[col.key] = e.target.value;
        state.page = 0;
        render(root, state);
      };
      rowFilters.appendChild(html`<th>${input}</th>`);
    }

    thead.append(rowHeaders, rowFilters);
    table.appendChild(thead);

    const tbody = html`<tbody></tbody>`;
    for (const row of data) {
      const tr = html`<tr></tr>`;
      for (const col of COLS) {
        const v = row[col.key];
        tr.appendChild(html`<td>${col.type === "num" ? fmtBRL(v) : v}</td>`);
      }
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    root.appendChild(table);

    root.appendChild(html`
      <div>
        <button onclick=${() => { state.page--; render(root, state); }} disabled=${state.page===0}>‹</button>
        <button onclick=${() => { state.page++; render(root, state); }} disabled=${state.page>=totalPages-1}>›</button>
      </div>
    `);
  }

  function buildWhere(filters) {
    const clauses = [];

    for (const col of COLS) {
      const q = (filters[col.key] ?? "").trim();
      if (!q) continue;

      if (col.type === "text") {
        clauses.push(`${col.key} ILIKE '%${q.replace(/'/g, "''")}%'`);
      } else {
        const num = parseFloat(q.replace(",", "."));
        if (!isNaN(num)) {
          clauses.push(`${col.key} >= ${num}`);
        }
      }
    }

    return clauses.length ? clauses.join(" AND ") : "1=1";
  }

  return root;
}
