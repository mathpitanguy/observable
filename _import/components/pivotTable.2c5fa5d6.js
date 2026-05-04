import { html } from "../../_npm/htl@0.3.1/72f4716c.js";
import * as d3   from "../../_npm/d3@7.9.0/66d82917.js";

// ── Colunas disponíveis como dimensões (agrupamento)
export const DIMENSOES = [
  { key: "uo_cod",      label: "UO — Código"              },
  { key: "uo_sigla",    label: "UO — Sigla"               },
  { key: "fonte_cod",   label: "Fonte — Código"            },
  { key: "fonte_desc",  label: "Fonte — Descrição"         },
  { key: "receita_cod", label: "Classificação — Código"    },
  { key: "alertas",     label: "Tipo de Alerta"            },
];

// ── Colunas numéricas disponíveis para agregar
export const METRICAS_CAMPOS = [
  { key: "val2024",   label: "2024"        },
  { key: "val2025",   label: "2025"        },
  { key: "val2026",   label: "2026 Reest"  },
  { key: "siafi2026", label: "SIAFI 2026"  },
  { key: "val2027",   label: "2027 LDO"    },
];

// ── Funções de agregação disponíveis
export const AGREGACOES = [
  { key: "soma",      label: "Soma",      fn: vals => d3.sum(vals)    },
  { key: "media",     label: "Média",     fn: vals => d3.mean(vals)   },
  { key: "maximo",    label: "Máximo",    fn: vals => d3.max(vals)    },
  { key: "minimo",    label: "Mínimo",    fn: vals => d3.min(vals)    },
  { key: "contagem",  label: "Contagem",  fn: vals => vals.length     },
];

const fmtBRL = v =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    notation: "compact", maximumFractionDigits: 2,
  }).format(v);

const fmtN = v => new Intl.NumberFormat("pt-BR").format(v);

// ── Monta a tabela pivot a partir das seleções
export function buildPivotTable(data, {
  dimKey,
  campoKey,
  agregKey,
}) {
  const dimDef   = DIMENSOES.find(d => d.key === dimKey)         ?? DIMENSOES[0];
  const campoDef = METRICAS_CAMPOS.find(d => d.key === campoKey) ?? METRICAS_CAMPOS[1];
  const agregDef = AGREGACOES.find(d => d.key === agregKey)      ?? AGREGACOES[0];

  // Agrupamento com d3.rollups
  const grupos = d3.rollups(
    data,
    rows => {
      const vals = rows.map(r => +r[campoDef.key] || 0);
      return {
        valor    : agregDef.fn(vals),
        contagem : rows.length,
      };
    },
    d => String(d[dimDef.key] ?? "(vazio)")
  ).sort((a, b) => b[1].valor - a[1].valor);

  if (!grupos.length) {
    return html`<p style="text-align:center;color:#94a3b8;padding:2rem 0;">
      Nenhum dado para os filtros selecionados.
    </p>`;
  }

  const isContagem  = agregKey === "contagem";
  const totalValor  = isContagem
    ? grupos.reduce((s, [, v]) => s + v.contagem, 0)
    : d3.sum(grupos, ([, v]) => v.valor);

  const maxValor = d3.max(grupos, ([, v]) => v.valor) || 1;

  const root = html`<div class="pv-wrap"></div>`;

  root.appendChild(html`<style>
    .pv-wrap { font-family: var(--sans-serif, system-ui); font-size: 12px; }
    .pv-scroll { overflow-x: auto; border: 1px solid var(--theme-foreground-faintest, #e5e7eb); border-radius: 8px; margin-top: 8px; }
    table.pv { border-collapse: collapse; width: 100%; min-width: 520px; }
    table.pv thead th {
      background: var(--theme-background-alt, #f8fafc);
      border-bottom: 2px solid #e2e8f0;
      padding: 7px 10px;
      text-align: left;
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .07em;
      color: #8b1a1a;
      white-space: nowrap;
    }
    table.pv thead th.num { text-align: right; }
    table.pv tbody tr { border-bottom: 1px solid var(--theme-foreground-faintest, #f1f5f9); }
    table.pv tbody tr:hover { background: var(--theme-background-alt, #f8fafc); }
    table.pv tbody td { padding: 5px 10px; white-space: nowrap; color: var(--theme-foreground, #111); }
    table.pv tbody td.num { text-align: right; font-variant-numeric: tabular-nums; font-size: 11.5px; }
    table.pv tbody td.neg { color: #dc2626; }
    table.pv tfoot td {
      padding: 6px 10px;
      font-weight: 800;
      font-size: 11.5px;
      border-top: 2px solid #e2e8f0;
      background: var(--theme-background-alt, #f8fafc);
    }
    table.pv tfoot td.num { text-align: right; }
    .pv-bar-cell { width: 140px; padding: 5px 10px; }
    .pv-bar-bg { background: #f1f5f9; border-radius: 4px; height: 8px; overflow: hidden; }
    .pv-bar-fill { height: 8px; border-radius: 4px; background: linear-gradient(90deg, #8b1a1a, #c0392b); }
    .pv-pct { font-size: 10px; color: var(--theme-foreground-muted, #94a3b8); margin-left: 4px; }
    .pv-rank { display: inline-block; background: #fef2f2; color: #8b1a1a; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 700; margin-right: 6px; }
  </style>`);

  const scroll = html`<div class="pv-scroll"></div>`;
  const table  = html`<table class="pv"></table>`;

  // Cabeçalho
  table.appendChild(html`<thead><tr>
    <th style="width:30px">#</th>
    <th>${dimDef.label}</th>
    <th class="num">${campoDef.label} — ${agregDef.label}</th>
    <th class="num">Registros</th>
    <th>Participação</th>
  </tr></thead>`);

  // Corpo
  const tbody = html`<tbody></tbody>`;
  grupos.forEach(([dim, { valor, contagem }], i) => {
    const pct     = totalValor > 0 ? valor / totalValor : 0;
    const barPct  = maxValor   > 0 ? (valor / maxValor) * 100 : 0;
    const negClass = valor < 0 ? " neg" : "";
    const display = isContagem
      ? fmtN(valor)
      : (valor >= 1e4 ? fmtBRL(valor) : fmtN(valor));

    tbody.appendChild(html`<tr>
      <td><span class="pv-rank">${i + 1}</span></td>
      <td title="${dim}">${dim}</td>
      <td class="num${negClass}">${display}</td>
      <td class="num">${fmtN(contagem)}</td>
      <td class="pv-bar-cell">
        <div style="display:flex;align-items:center;gap:6px">
          <div class="pv-bar-bg" style="flex:1">
            <div class="pv-bar-fill" style="width:${Math.max(0, barPct).toFixed(1)}%"></div>
          </div>
          <span class="pv-pct">${d3.format(".1%")(pct)}</span>
        </div>
      </td>
    </tr>`);
  });
  table.appendChild(tbody);

  // Rodapé com total
  const totalDisplay = isContagem
    ? fmtN(totalValor)
    : (totalValor >= 1e4 ? fmtBRL(totalValor) : fmtN(totalValor));

  table.appendChild(html`<tfoot><tr>
    <td colspan="2" style="color:#8b1a1a">TOTAL — ${grupos.length} grupos</td>
    <td class="num">${totalDisplay}</td>
    <td class="num">${fmtN(data.length)}</td>
    <td></td>
  </tr></tfoot>`);

  scroll.appendChild(table);
  root.appendChild(scroll);
  return root;
}