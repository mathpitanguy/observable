import * as d3 from "npm:d3";

// ── Campos disponíveis — ordem define a ordem dos botões
export const CAMPOS = [
  { key: "uo_cod",      label: "UO cod",                   type: "dim" },
  { key: "uo_sigla",    label: "UO",                       type: "dim" },
  { key: "receita_cod", label: "Classif. Receita cod",     type: "dim" },
  { key: "fonte_cod",   label: "Fonte cod",                type: "dim" },
  { key: "fonte_desc",  label: "Fonte de Recursos",        type: "dim" },
  { key: "alertas",     label: "Alertas",                  type: "dim" },
  { key: "val2024",     label: "2024",                     type: "val" },
  { key: "val2025",     label: "2025",                     type: "val" },
  { key: "val2026",     label: "2026 Reest",               type: "val" },
  { key: "siafi2026",   label: "SIAFI 2026",               type: "val" },
  { key: "val2027",     label: "2027 LDO",                 type: "val" },
];

const fmtNum = v =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

const fmtBRL = v =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(v);

// ── Componente principal
// Aceita `data` reativo: sempre que o dado mudar (filtros externos),
// basta chamar novamente buildDynamicTable(novoData) — o estado dos
// campos selecionados é preservado internamente.
export function buildDynamicTable(data) {
  // Estado interno: conjunto de chaves selecionadas (Set — sem ordem relevante)
  const selected = new Set();

  // ── Raiz ────────────────────────────────────────────────────────────────
  const root = document.createElement("div");
  root.className = "dyn-root";

  // ── Estilos ──────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    .dyn-root {
      font-family: var(--sans-serif, system-ui);
    }

    /* Barra de campos */
    .dyn-campos {
      display    : flex;
      flex-wrap  : wrap;
      gap        : 8px;
      padding    : 14px;
      background : var(--theme-background-alt, #f8fafc);
      border     : 1px solid var(--theme-foreground-faintest, #e2e8f0);
      border-radius: 8px;
      margin-bottom: 12px;
    }

    /* Botão de campo */
    .dyn-btn {
      display     : flex;
      align-items : center;
      gap         : 7px;
      padding     : 5px 12px 5px 8px;
      border-radius: 6px;
      border      : 1px solid #d0d0d0;
      background  : var(--theme-background, #fff);
      cursor      : pointer;
      font-size   : 13px;
      color       : #555;
      transition  : all .12s;
      user-select : none;
    }
    .dyn-btn:hover { border-color: #aaa; }

    /* Quadradinho de check */
    .dyn-cbox {
      width        : 15px;
      height       : 15px;
      border-radius: 3px;
      border       : 1.5px solid #ccc;
      background   : var(--theme-background, #fff);
      display      : flex;
      align-items  : center;
      justify-content: center;
      flex-shrink  : 0;
      font-size    : 10px;
      color        : transparent;
      transition   : all .12s;
    }

    /* Dimensão marcada — roxo */
    .dyn-btn.ativo-d {
      background  : #EEEDFE;
      border-color: #AFA9EC;
      color       : #3C3489;
      font-weight : 700;
    }
    .dyn-btn.ativo-d .dyn-cbox {
      background  : #7F77DD;
      border-color: #7F77DD;
      color       : #fff;
    }

    /* Valor marcado — verde */
    .dyn-btn.ativo-v {
      background  : #E1F5EE;
      border-color: #5DCAA5;
      color       : #085041;
      font-weight : 700;
    }
    .dyn-btn.ativo-v .dyn-cbox {
      background  : #1D9E75;
      border-color: #1D9E75;
      color       : #fff;
    }

    /* Área da tabela */
    .dyn-table-wrap {
      overflow-x   : auto;
      border       : 1px solid var(--theme-foreground-faintest, #e2e8f0);
      border-radius: 8px;
      min-height   : 200px;
      background   : var(--theme-background, #fff);
    }

    /* Mensagem vazia */
    .dyn-aviso {
      display        : flex;
      align-items    : center;
      justify-content: center;
      height         : 180px;
      color          : #aaa;
      font-size      : 13px;
      text-align     : center;
      line-height    : 1.8;
    }

    /* Barra de status */
    .dyn-status {
      font-size    : 11px;
      color        : #aaa;
      padding      : 7px 14px;
      border-top   : 1px solid var(--theme-foreground-faintest, #f0f0f0);
      background   : var(--theme-background-alt, #f8fafc);
      border-radius: 0 0 8px 8px;
    }

    /* Tabela */
    table.dyn {
      width          : 100%;
      border-collapse: collapse;
      font-size      : 13px;
    }
    table.dyn thead th {
      padding       : 9px 12px;
      text-align    : left;
      border-bottom : 2px solid #e2e8f0;
      font-size     : 11px;
      font-weight   : 800;
      text-transform: uppercase;
      letter-spacing: .06em;
      background    : var(--theme-background-alt, #f8fafc);
      white-space   : nowrap;
    }
    table.dyn thead th { color: var(--theme-foreground, #111); border-bottom-color: #e2e8f0; }
    table.dyn thead th.th-v { text-align: right; }

    table.dyn tbody tr { border-bottom: 1px solid var(--theme-foreground-faintest, #f0f0f0); }
    table.dyn tbody tr:hover { background: var(--theme-background-alt, #f8fafc); }
    table.dyn tbody td { padding: 6px 12px; color: var(--theme-foreground, #333); white-space: nowrap; }
    table.dyn tbody td.tv { text-align: right; font-variant-numeric: tabular-nums; }
    table.dyn tbody td.zero { color: #ccc; }

    /* Rodapé de totais */
    table.dyn tfoot td {
      padding      : 7px 12px;
      font-weight  : 800;
      font-size    : 12px;
      border-top   : 2px solid #e2e8f0;
      background   : var(--theme-background-alt, #f8fafc);
    }
    table.dyn tfoot td.tv { text-align: right; color: var(--theme-foreground, #111); }
  `;
  root.appendChild(style);

  // ── Barra de campos ──────────────────────────────────────────────────────
  const camposBar = document.createElement("div");
  camposBar.className = "dyn-campos";

  CAMPOS.forEach(f => {
    const btn = document.createElement("div");
    btn.className = "dyn-btn";
    btn.dataset.key = f.key;
    btn.innerHTML = `<span class="dyn-cbox">✓</span>${f.label}`;

    btn.onclick = () => {
      if (selected.has(f.key)) {
        selected.delete(f.key);
        btn.classList.remove("ativo-d", "ativo-v");
      } else {
        selected.add(f.key);
        btn.classList.add(f.type === "dim" ? "ativo-d" : "ativo-v");
      }
      renderTable(data);
    };

    camposBar.appendChild(btn);
  });

  root.appendChild(camposBar);

  // ── Área da tabela ───────────────────────────────────────────────────────
  const tableWrap = document.createElement("div");
  tableWrap.className = "dyn-table-wrap";
  tableWrap.innerHTML = '<div class="dyn-aviso">Marque os campos acima<br>para construir a tabela</div>';
  root.appendChild(tableWrap);

  const statusBar = document.createElement("div");
  statusBar.className = "dyn-status";
  root.appendChild(statusBar);

  // ── Render ───────────────────────────────────────────────────────────────
  function renderTable(rows) {
    // Ordem das colunas sempre: dims primeiro, vals depois — ambas seguindo
    // a ordem declarada em CAMPOS, independente da ordem em que o usuário clicou
    const dims = CAMPOS.filter(f => f.type === "dim" && selected.has(f.key)).map(f => f.key);
    const vals = CAMPOS.filter(f => f.type === "val" && selected.has(f.key)).map(f => f.key);
    const ordered = [...dims, ...vals]; // ordem fixa: dims → vals

    if (selected.size === 0) {
      tableWrap.innerHTML = '<div class="dyn-aviso">Marque os campos acima<br>para construir a tabela</div>';
      statusBar.textContent = "";
      return;
    }

    // Cabeçalho — sempre dims primeiro, depois vals
    let html = '<table class="dyn"><thead><tr>';
    ordered.forEach(k => {
      const f = CAMPOS.find(f => f.key === k);
      html += `<th class="${f.type === "dim" ? "th-d" : "th-v"}">${f.label}</th>`;
    });
    html += "</tr></thead>";

    // Só monta linhas quando há ao menos 1 dim + 1 val
    if (dims.length > 0 && vals.length > 0) {
      // GROUP BY dims, SUM vals
      const grouped = {};
      rows.forEach(row => {
        const key = dims.map(k => String(row[k] ?? "")).join("||");
        if (!grouped[key]) {
          grouped[key] = {};
          dims.forEach(k => grouped[key][k] = row[k]);
          vals.forEach(k => grouped[key][k] = 0);
        }
        vals.forEach(k => grouped[key][k] += +row[k] || 0);
      });

      // Ordenação alfabética pelas dimensões (primeira dim, depois segunda, etc.)
      const result = Object.values(grouped).sort((a, b) => {
        for (const k of dims) {
          const va = String(a[k] ?? "").toLowerCase();
          const vb = String(b[k] ?? "").toLowerCase();
          if (va < vb) return -1;
          if (va > vb) return  1;
        }
        return 0;
      });

      html += "<tbody>";
      result.forEach(r => {
        html += "<tr>";
        ordered.forEach(k => {
          const f = CAMPOS.find(f => f.key === k);
          if (f.type === "dim") {
            html += `<td>${r[k] ?? ""}</td>`;
          } else {
            const n = r[k] ?? 0;
            html += `<td class="tv${n === 0 ? " zero" : ""}">${fmtNum(n)}</td>`;
          }
        });
        html += "</tr>";
      });
      html += "</tbody>";

      // Rodapé com totais
      html += "<tfoot><tr>";
      ordered.forEach((k, i) => {
        const f = CAMPOS.find(f => f.key === k);
        if (f.type === "dim") {
          html += i === 0
            ? `<td>TOTAL — ${result.length} grupos</td>`
            : "<td></td>";
        } else {
          const total = result.reduce((s, r) => s + (r[k] || 0), 0);
          html += `<td class="tv">${total >= 1e4 ? fmtBRL(total) : fmtNum(total)}</td>`;
        }
      });
      html += "</tr></tfoot>";

      statusBar.textContent =
        `${result.length} linhas · ${ordered.length} colunas · agrupado por ${dims.length} dimensão(ões) · ${rows.length} registros na base`;

    } else {
      html += "<tbody></tbody>";
      statusBar.textContent = dims.length === 0
        ? "Selecione ao menos uma dimensão para agrupar os dados"
        : "Selecione ao menos um campo de valor para preencher as linhas";
    }

    html += "</table>";
    tableWrap.innerHTML = html;
  }

  // Primeira renderização
  renderTable(data);

  // Expõe método update para quando os filtros externos mudarem
  root.update = (newData) => {
    data = newData;
    renderTable(newData);
  };

  return root;
}
