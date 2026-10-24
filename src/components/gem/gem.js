/* Gemas: la casilla de "conseguida", las líneas de gemas y los costes. */

// Gemas de leveling sugeridas que no están en la build: se marcan como "sugerida" allí donde aparezcan.
let suggested = new Set();

// Gemas marcadas como conseguidas, por build; si el navegador no deja guardar, la guía funciona igual.
const doneStore = {
  key: "", ids: new Set(),
  load(key) { this.key = key; try { this.ids = new Set(JSON.parse(localStorage.getItem(key)) || []); } catch { this.ids = new Set(); } },
  set(id, on) { on ? this.ids.add(id) : this.ids.delete(id); try { localStorage.setItem(this.key, JSON.stringify([...this.ids])); } catch {} },
};

const shortCost = level => cost(level).replace(/^(Orb of|Scroll of) /, "");
/** Totales de moneda de unas compras, como texto: "2× Orb of Alteration, 1× Scroll of Wisdom". */
function costText(ids) {
  const total = {};
  ids.forEach(id => { const c = cost(GEMS[id].level); total[c] = (total[c] || 0) + 1; });
  return Object.entries(total).map(([c, n]) => `${n}× ${esc(c)}`).join(", ");
}

/** Una gema con su casilla de "conseguida", su color de atributo, su nivel y, si se compra, su coste. */
function gemEl(id, withCost) {
  const { name, attr, level } = GEMS[id];
  const l = document.createElement("label");
  const isDone = doneStore.ids.has(id);
  l.className = "gem" + (isDone ? " done" : "");
  l.innerHTML = `<input type="checkbox"><i class="${attr}"></i><span></span><small>nv ${level}${withCost ? " · " + shortCost(level) : ""}</small>`;
  l.querySelector("span").textContent = name;
  if (suggested.has(id)) l.insertAdjacentHTML("beforeend", `<em class="sug" title="Sugerencia automática de leveling: no está en tu build">sugerida</em>`);
  const box = l.querySelector("input");
  box.checked = isDone;
  box.onchange = () => { doneStore.set(id, box.checked); l.classList.toggle("done", box.checked); };
  return l;
}

/** Línea "cómo · gemas · nota": la usan los pasos de la ruta y las tarjetas de leveling. `note` es HTML. */
function gemLine(how, ids, { withCost = false, note = "" } = {}) {
  const line = document.createElement("div");
  line.className = "line";
  line.innerHTML = `<span class="how"></span>`;
  line.firstChild.textContent = how;
  ids.forEach(id => line.append(gemEl(id, withCost)));
  if (note) line.insertAdjacentHTML("beforeend", `<span class="cost">${note}</span>`);
  return line;
}

/** Bloque de gemas de un paso: una línea por recompensa o vendedor; las compras llevan su coste. */
function gemsBlock(groups) {
  const box = document.createElement("div");
  box.className = "gems";
  for (const g of groups) box.append(gemLine(g.how, g.ids, g.buy ? { withCost: true, note: `Coste: ${costText(g.ids)}` } : {}));
  return box;
}
