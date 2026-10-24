/* Equipo de la build: únicos por nivel y prioridad de stats de los raros. */

/** Ficha del único al estilo del juego: nombre, base, nivel, implícitos y mods tal como los trae la build. Se ve al pasar el ratón o al tocar. */
function uniqueTip(u: Item, icon: string): HTMLDivElement {
  const tip = document.createElement("div"), add = (cls: string, lines: string[]) => {
    if (!lines.length) return;
    const div = document.createElement("div"); div.className = cls;
    for (const t of lines) div.append(Object.assign(document.createElement("p"), { textContent: t }));
    tip.append(div);
  };
  tip.className = "utip";
  add("utip-head", [u.name, u.base]);
  if (icon) tip.append(Object.assign(document.createElement("img"), { className: "utip-icon", src: icon, alt: "" }));
  add("utip-req", u.req ? [`Nivel requerido ${u.req}`] : []);
  add("utip-mods", u.mods.slice(0, u.implicits));
  add("utip-mods", u.mods.slice(u.implicits));
  return tip;
}

/** Equipo de la build: los únicos por nivel requerido y qué stats se repiten en sus raros. */
function gearSection(items: Item[]): HTMLDetailsElement {
  const sec = section("Equipo de la build", "act gear", true, { id: "equipo", label: "Equipo" });
  // Por nivel requerido; los que no piden nivel (joyas) van al final.
  const uniques = items.filter(i => i.rarity === "UNIQUE").sort((a, b) => (a.req || 999) - (b.req || 999));
  if (uniques.length) {
    sec.insertAdjacentHTML("beforeend", `<h3>Únicos</h3><table><thead><tr><th>Objeto</th><th>Hueco</th><th class="n">Desde nv</th></tr></thead><tbody></tbody></table>`);
    const tb = sec.querySelector("tbody")!;
    // Con ratón la ficha sigue al cursor, sin salirse de la ventana; al tocar o con el teclado se queda bajo el objeto.
    tb.addEventListener("mousemove", e => {
      const tip = (e.target as Element).closest("tr")?.querySelector<HTMLElement>(".utip"); if (!tip) return;
      const x = Math.min(e.clientX + 16, innerWidth - tip.offsetWidth - 8), below = e.clientY + 16 + tip.offsetHeight <= innerHeight;
      tip.style.cssText = `position:fixed;left:${Math.max(8, x)}px;top:${below ? e.clientY + 16 : Math.max(8, e.clientY - 16 - tip.offsetHeight)}px`;
    });
    tb.addEventListener("mouseleave", () => tb.querySelectorAll<HTMLElement>(".utip").forEach(t => t.style.cssText = ""));
    for (const u of uniques) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td><span class="item" tabindex="0"><span class="ico"></span><span><b class="unique"></b><small></small></span></span></td><td></td><td class="n"></td>`;
      tr.querySelector("b")!.textContent = u.name;
      // Icono del CDN de GGG; PoB antepone "Foulborn " a los únicos mutados: se usa el arte del normal.
      const art = UNIQUES[u.name.replace(/^Foulborn /, "")];
      const icon = art ? `https://web.poecdn.com/image/Art/${art[0]}.png?scale=1&w=${art[1]}&h=${art[2]}` : "";
      if (icon) tr.querySelector(".ico")!.append(Object.assign(document.createElement("img"), { src: icon, alt: "", loading: "lazy" }));
      tr.querySelector("small")!.textContent = " " + u.base;
      tr.children[1].textContent = slotEs(u.slot);
      tr.children[2].textContent = u.req ? String(u.req) : "—";
      tr.children[0].append(uniqueTip(u, icon));
      tb.append(tr);
    }
  }
  // Las joyas del árbol no son equipo: contarían como "raros" con stats de pasivas.
  const rares = items.filter(i => i.rarity === "RARE" && i.slot !== "Jewel" && !i.slot.includes("Abyssal"));
  if (rares.length) {
    sec.insertAdjacentHTML("beforeend", `<h3>Prioridad de stats en los raros</h3><p class="note">Cuántas de sus ${rares.length} piezas raras (${[...new Set(rares.map(r => slotEs(r.slot)))].join(", ").toLowerCase()}) llevan cada tipo de stat.</p><ol class="stats"></ol>`);
    const ol = sec.querySelector("ol.stats")!;
    for (const [label, n] of gearStatCounts(rares)) {
      const li = document.createElement("li");
      li.innerHTML = `<span></span><span class="bar"><i style="width:${n / rares.length * 100}%"></i></span><b>${n}/${rares.length}</b>`;
      li.firstElementChild!.textContent = label;
      ol.append(li);
    }
  }
  sec.insertAdjacentHTML("beforeend", `<p class="note">En la campaña, las resistencias bajan un 30 % al matar a Kitava en el acto 5 y otro 30 % en el acto 10: conviene ir subiéndolas antes de cada uno.</p>`);
  return sec;
}
