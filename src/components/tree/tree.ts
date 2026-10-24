/* Árbol de pasivas: stats sumadas, mapa de calor por etapas, puntos indispensables y ascendencia/maestrías. */

/** Sección del árbol. `stages` son las etapas (de la build o sugeridas) que se pueden ver en el mapa de calor. */
const treeSection: Component<[tree: BuildTree, stages: TreeStage[], stagesSuggested: boolean], HTMLDetailsElement> = (tree, stages, stagesSuggested) => {
  const sec = section("Árbol de pasivas", "act tree", true, { id: "arbol", label: "Árbol de pasivas" });
  const main = tree.nodes.filter(id => !NODES[id].ascendancy);
  const asc = tree.nodes.filter(id => NODES[id].ascendancy && NODES[id].type === NODE.NOTABLE);
  // Keystones primero y luego notables, por nombre: este orden da los números del mapa y de la lista.
  const key = main.filter(id => NODES[id].type === NODE.KEYSTONE || NODES[id].type === NODE.NOTABLE)
    .sort((a, b) => NODES[b].type - NODES[a].type || NODES[a].name.localeCompare(NODES[b].name));

  sec.append(subhead("Stats del árbol"), treeStatsBlock(tree, main.length, asc.length));
  sec.append(subhead("Mapa de calor"), heatPanel(main, key, stages, stagesSuggested, tree.masteries));
  sec.append(subhead("Puntos indispensables"), el("p", "note", "Las keystones y los notables que tiene cogidos la build; el resto son nodos pequeños o de paso."), keyNodes(key));
  const extras = treeExtras(asc, tree.masteries);
  if (extras) sec.append(subhead("Ascendencia y maestrías"), extras);
  return sec;
};
