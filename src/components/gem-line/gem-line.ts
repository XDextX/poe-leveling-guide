/* Líneas de gemas ("cómo · gemas · nota") y el bloque de gemas de un paso de la ruta. */

/** Línea "cómo · gemas · nota": la usan los pasos de la ruta y las tarjetas de leveling. `note` es HTML. */
function gemLine(how: string, ids: string[], { withCost = false, note = "" }: { withCost?: boolean; note?: string } = {}): HTMLDivElement {
  const line = el("div", "line", "", el("span", "how", how), ...ids.map(id => gemEl(id, withCost)));
  if (note) line.insertAdjacentHTML("beforeend", `<span class="cost">${note}</span>`);
  return line;
}

/** Bloque de gemas de un paso: una línea por recompensa o vendedor; las compras llevan su coste. */
function gemsBlock(groups: GemGroup[]): HTMLDivElement {
  return el("div", "gems", "", ...groups.map(g => gemLine(g.how, g.ids, g.buy ? { withCost: true, note: `Coste: ${costText(g.ids)}` } : {})));
}
