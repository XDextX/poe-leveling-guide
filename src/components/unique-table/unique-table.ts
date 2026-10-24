/* Tabla de los únicos de la build, por nivel requerido, con su icono y su ficha. */

/** Tabla de únicos. Con ratón la ficha sigue al cursor; al tocar o con el teclado se queda bajo el objeto. */
const uniqueTable: Component<[uniques: Item[]], HTMLTableElement> = uniques => {
  const table = el("table", "uniques");
  table.innerHTML = `<thead><tr><th>Objeto</th><th>Hueco</th><th class="n">Desde nv</th></tr></thead>`;
  const tb = el("tbody");
  for (const u of uniques) {
    const icon = uniqueIcon(u.name);
    // Caja fija para el icono, haya o no: así los nombres quedan alineados.
    const ico = el("span", "ico", "", ...(icon ? [Object.assign(el("img"), { src: icon, alt: "", loading: "lazy" })] : []));
    const item = el("span", "item", "", ico, el("span", "", "", el("b", "unique", u.name), el("small", "", " " + u.base)));
    item.tabIndex = 0;
    tb.append(el("tr", "", "", el("td", "", "", item, uniqueTip(u, icon)), el("td", "", slotEs(u.slot)), el("td", "n", u.req ? String(u.req) : "—")));
  }
  tb.addEventListener("mousemove", e => {
    const tip = (e.target as Element).closest("tr")?.querySelector<HTMLElement>(".utip"); if (!tip) return;
    tip.style.position = "fixed";
    placeTip(tip, e.clientX, e.clientY, innerWidth, innerHeight, 16);
  });
  tb.addEventListener("mouseleave", () => tb.querySelectorAll<HTMLElement>(".utip").forEach(t => t.style.cssText = ""));
  table.append(tb);
  return table;
};
