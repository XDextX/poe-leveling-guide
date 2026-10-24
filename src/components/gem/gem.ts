/* Una gema: su casilla de "conseguida", su color de atributo, su nivel y, si se compra, su coste. */

// Gemas de leveling sugeridas que no están en la build: se marcan como "sugerida" allí donde aparezcan.
let suggested = new Set<string>();

// Gemas marcadas como conseguidas, por build; si el navegador no deja guardar, la guía funciona igual.
const doneStore = {
  key: "", ids: new Set<string>(),
  load(key: string) { this.key = key; try { this.ids = new Set<string>(JSON.parse(localStorage.getItem(key) ?? "null") || []); } catch { this.ids = new Set<string>(); } },
  set(id: string, on: boolean) { on ? this.ids.add(id) : this.ids.delete(id); try { localStorage.setItem(this.key, JSON.stringify([...this.ids])); } catch {} },
};

const shortCost = (level: number): string => cost(level).replace(/^(Orb of|Scroll of) /, "");
/** Totales de moneda de unas compras, como texto: "2× Orb of Alteration, 1× Scroll of Wisdom". */
function costText(ids: string[]): string {
  const total: Record<string, number> = {};
  ids.forEach(id => { const c = cost(GEMS[id].level); total[c] = (total[c] || 0) + 1; });
  return Object.entries(total).map(([c, n]) => `${n}× ${esc(c)}`).join(", ");
}

/** Una gema con su casilla de "conseguida", su color de atributo, su nivel y, si se compra, su coste. */
function gemEl(id: string, withCost?: boolean): HTMLLabelElement {
  const { name, attr, level } = GEMS[id];
  const isDone = doneStore.ids.has(id);
  const box = Object.assign(el("input"), { type: "checkbox", checked: isDone });
  const l = el("label", "gem" + (isDone ? " done" : ""), "", box, el("i", attr), el("span", "", name),
    el("small", "", `nv ${level}${withCost ? " · " + shortCost(level) : ""}`));
  if (suggested.has(id)) {
    const sug = el("em", "sug", "sugerida");
    sug.title = "Sugerencia automática de leveling: no está en tu build";
    l.append(sug);
  }
  box.onchange = () => { doneStore.set(id, box.checked); l.classList.toggle("done", box.checked); };
  return l;
}
