/* Tarjeta de un tramo del leveling sugerido: habilidad, soportes y cuánto del árbol final tendrías. */

/** Tarjeta del tramo: `tree` es el árbol de ese tramo y `prev` el del anterior, para listar los notables nuevos. */
function stageCard(s: StageSkill, mainId: string, tree: TreeStage | undefined, prev: TreeStage | undefined, treesSuggested: boolean): HTMLDivElement {
  const card = el("div", "stagecard");
  card.innerHTML = `<h3>Actos ${s.acts[0]}-${s.acts[1]} <span>· nv ${s.from}–${s.to}</span></h3>`;
  if (s.skill) card.append(gemLine(s.own ? "Tu habilidad" : "Habilidad", [s.skill], { note: s.mainAt ? `Cambia a ${esc(GEMS[mainId].name)} desde nv ${s.mainAt}` : "" }));
  if (s.supports.length) card.append(gemLine("Soportes", s.supports, { note: "por orden: con pocos enlaces, usa los primeros" }));
  if (tree) {
    const had = new Set(prev?.nodes ?? []);
    const fresh = tree.nodes.filter(id => !had.has(id) && (NODES[id].type === NODE.NOTABLE || NODES[id].type === NODE.KEYSTONE)).map(id => NODES[id].name);
    card.append(el("p", "note", `Árbol: ${treesSuggested ? "≈" + tree.points + " puntos, " : ""}${tree.nodes.length} nodos${fresh.length ? ". Nuevos notables: " + fresh.join(", ") : ""}. Míralo en el mapa de calor, más abajo.`));
  }
  return card;
}
