/* Prioridad de stats en los raros: cuántas piezas llevan cada tipo de stat, en barras. */

/** Barras de stats de los raros, con la nota de qué piezas cuentan. */
const rareStats: Component<[rares: Item[]], DocumentFragment> = rares => {
  const slots = [...new Set(rares.map(r => slotEs(r.slot)))].join(", ").toLowerCase();
  const ol = el("ol", "stats");
  for (const [label, n] of gearStatCounts(rares)) {
    const bar = el("span", "bar", "", el("i"));
    (bar.firstChild as HTMLElement).style.width = `${n / rares.length * 100}%`;
    ol.append(el("li", "", "", el("span", "", label), bar, el("b", "", `${n}/${rares.length}`)));
  }
  const frag = document.createDocumentFragment();
  frag.append(el("p", "note", `Cuántas de sus ${rares.length} piezas raras (${slots}) llevan cada tipo de stat.`), ol);
  return frag;
};
