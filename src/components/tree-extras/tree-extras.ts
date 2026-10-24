/* Notables de ascendencia y maestrías elegidas, con su efecto. */

/** Lista de ascendencia y maestrías, o null si no hay ninguna con efecto. */
function treeExtras(asc: string[], masteries: [node: string, effect: string][]): HTMLUListElement | null {
  const extras = [...asc.map((id): [string, string] => [NODES[id].name + " (ascendencia)", NODES[id].stats.join(" · ")]),
    ...masteries.map(([node, eff]): [string, string] => [NODES[node]?.name || "Maestría", (MASTERIES[node]?.[eff] || "").replace(/\n/g, " · ")])].filter(([, s]) => s);
  if (!extras.length) return null;
  const ul = el("ul", "extras");
  fillNamed(ul, extras);
  return ul;
}
