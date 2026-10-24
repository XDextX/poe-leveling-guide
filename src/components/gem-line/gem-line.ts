/* Líneas de gemas ("cómo · gemas · nota") y el bloque de gemas de un paso de la ruta. */

/** Línea "cómo · gemas · nota": la usan los pasos de la ruta y las tarjetas de leveling. `note` es HTML. */
const gemLine: Component<[how: string, ids: string[], opts?: { withCost?: boolean; note?: string }], HTMLDivElement> = (how, ids, { withCost = false, note = "" } = {}) => {
  const line = el("div", "line", "", el("span", "how", how), ...ids.map(id => gemEl(id, withCost)));
  if (note) line.insertAdjacentHTML("beforeend", `<span class="cost">${note}</span>`);
  return line;
};

/** Bloque de gemas de un paso: una línea por recompensa o vendedor; las compras llevan su coste. */
const gemsBlock: Component<[groups: GemGroup[]], HTMLDivElement> = groups =>
  el("div", "gems", "", ...groups.map(g => gemLine(g.how, g.ids, g.buy ? { withCost: true, note: `Coste: ${costText(g.ids)}` } : {})));
