/* Equipo de la build: tabla de únicos y prioridad de stats de los raros. */

/** Equipo de la build: los únicos por nivel requerido y qué stats se repiten en sus raros. */
const gearSection: Component<[items: Item[]], HTMLDetailsElement> = items => {
  const sec = section("Equipo de la build", "act gear", true, { id: "equipo", label: "Equipo" });
  // Por nivel requerido; los que no piden nivel (joyas) van al final.
  const uniques = items.filter(i => i.rarity === "UNIQUE").sort((a, b) => (a.req || 999) - (b.req || 999));
  if (uniques.length) sec.append(subhead("Únicos"), uniqueTable(uniques));
  // Las joyas del árbol no son equipo: contarían como "raros" con stats de pasivas.
  const rares = items.filter(i => i.rarity === "RARE" && i.slot !== "Jewel" && !i.slot.includes("Abyssal"));
  if (rares.length) sec.append(subhead("Prioridad de stats en los raros"), rareStats(rares));
  sec.append(el("p", "note", "En la campaña, las resistencias bajan un 30 % al matar a Kitava en el acto 5 y otro 30 % en el acto 10: conviene ir subiéndolas antes de cada uno."));
  return sec;
};
