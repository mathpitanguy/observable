// src/components/pivotTable.js
import { html } from "npm:htl";

export async function PivotTable(data) {
  // Carrega os scripts do Perspective via CDN
  await Promise.all([
    loadScript("https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.js"),
    loadScript("https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/cdn/perspective-viewer.js"),
    loadLink("https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/themes.css"),
    loadLink("https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid/dist/cdn/perspective-viewer-datagrid.css"),
    loadLink("https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc/dist/cdn/perspective-viewer-d3fc.css"),
  ]);

  await loadScript("https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid/dist/cdn/perspective-viewer-datagrid.js");
  await loadScript("https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc/dist/cdn/perspective-viewer-d3fc.js");

  const worker = await window.perspective.worker();
  const table = await worker.table(data);

  const viewer = document.createElement("perspective-viewer");
  viewer.style.height = "600px";
  viewer.style.width = "100%";
  await viewer.load(table);

  return viewer;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function loadLink(href) {
  return new Promise((resolve) => {
    if (document.querySelector(`link[href="${href}"]`)) return resolve();
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    l.onload = resolve;
    document.head.appendChild(l);
  });
}