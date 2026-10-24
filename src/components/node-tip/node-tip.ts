/* Ficha de un nodo del árbol: icono, nombre, tipo, si está cogido y qué hace. */

const NODE_KIND_ES = ["", "Notable", "Keystone", "Maestría", "Joya", "Inicio"];

/**
 * Contenido de la ficha del nodo. `taken` y `num` vienen del último dibujo del mapa (cogido, número en la lista);
 * `effect` es el efecto elegido si es una maestría cogida, y sustituye a sus stats.
 */
function nodeTip(n: TreeNode, taken: boolean, num: number | undefined, effect: string): Node[] {
  const info = el("small", taken ? "taken" : "", [NODE_KIND_ES[n.type], taken ? "Cogido" : "No cogido", num ? `nº ${num} de la lista` : ""].filter(Boolean).join(" · "));
  const icon = nodeIcon(n, 36);
  const head = el("div", "heat-tip-head", "", ...(icon ? [icon] : []), el("div", "", "", el("b", "", n.name), info));
  return [head, ...(effect ? effect.split("\n") : n.stats).map(t => el("p", "", t)), ...n.reminder.map(t => el("p", "reminder", t))];
}
