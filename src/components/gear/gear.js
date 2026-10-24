/* Equipo de la build: únicos por nivel y prioridad de stats de los raros. */

/** Equipo de la build: los únicos por nivel requerido y qué stats se repiten en sus raros. */
function gearSection(items) {
  const sec = section("Equipo de la build", "act gear", true, { id: "equipo", label: "Equipo" });
  // Por nivel requerido; los que no piden nivel (joyas) van al final.
  const uniques = items.filter(i => i.rarity === "UNIQUE").sort((a, b) => (a.req || 999) - (b.req || 999));
  if (uniques.length) {
    sec.insertAdjacentHTML("beforeend", `<h3>Únicos</h3><table><thead><tr><th>Objeto</th><th>Hueco</th><th class="n">Desde nv</th></tr></thead><tbody></tbody></table>`);
    const tb = sec.querySelector("tbody");
    for (const u of uniques) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td><b class="unique"></b><small></small></td><td></td><td class="n"></td>`;
      tr.querySelector("b").textContent = u.name;
      tr.querySelector("small").textContent = " " + u.base;
      tr.children[1].textContent = slotEs(u.slot);
      tr.children[2].textContent = u.req || "—";
      tb.append(tr);
    }
  }
  // Las joyas del árbol no son equipo: contarían como "raros" con stats de pasivas.
  const rares = items.filter(i => i.rarity === "RARE" && i.slot !== "Jewel" && !i.slot.includes("Abyssal"));
  if (rares.length) {
    sec.insertAdjacentHTML("beforeend", `<h3>Prioridad de stats en los raros</h3><p class="note">Cuántas de sus ${rares.length} piezas raras (${[...new Set(rares.map(r => slotEs(r.slot)))].join(", ").toLowerCase()}) llevan cada tipo de stat.</p><ol class="stats"></ol>`);
    const ol = sec.querySelector("ol.stats");
    for (const [label, n] of gearStatCounts(rares)) {
      const li = document.createElement("li");
      li.innerHTML = `<span></span><span class="bar"><i style="width:${n / rares.length * 100}%"></i></span><b>${n}/${rares.length}</b>`;
      li.firstChild.textContent = label;
      ol.append(li);
    }
  }
  sec.insertAdjacentHTML("beforeend", `<p class="note">En la campaña, las resistencias bajan un 30 % al matar a Kitava en el acto 5 y otro 30 % en el acto 10: conviene ir subiéndolas antes de cada uno.</p>`);
  return sec;
}
