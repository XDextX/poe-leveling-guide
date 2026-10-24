/* Stats sumadas del árbol, en columnas de daño, defensa y otros. */

/** Resumen de puntos y una columna por tipo de stat, con las 14 primeras de cada una. */
function treeStatsBlock(tree: BuildTree, mainCount: number, ascCount: number): DocumentFragment {
  const stats = treeStats(tree), cols = el("div", "tree-cols");
  for (const k of ["dmg", "def", "other"] as const) {
    if (!stats[k].length) continue;
    const ul = el("ul", "", "", ...stats[k].slice(0, 14).map(s => {
      const li = el("li", "", s.text);
      if (s.n > 1) li.title = `${s.n} nodos`;
      return li;
    }));
    cols.append(el("div", "", "", el("b", `kind ${k}`, KIND_ES[k]), ul, ...(stats[k].length > 14 ? [el("p", "note", `y ${stats[k].length - 14} más`)] : [])));
  }
  const frag = document.createDocumentFragment();
  frag.append(el("p", "note", `${mainCount} puntos en el árbol, ${ascCount} notables de ascendencia y ${tree.masteries.length} maestrías. Clasificación aproximada por palabras clave.`), cols);
  return frag;
}
