/* Árbol de pasivas: stats sumadas, mapa de calor por etapas y puntos indispensables. */

/** Botonera de opciones excluyentes: marca la pulsada y avisa con su valor. */
function toggleGroup(root, selector, attr, onPick) {
  root.querySelector(selector)?.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    root.querySelectorAll(selector + " button").forEach(x => x.setAttribute("aria-pressed", x === b));
    onPick(b.dataset[attr]);
  });
}

/** Árbol: stats sumadas, mapa de calor de daño/defensa (por etapas si las hay) y los puntos indispensables. */
function treeSection(tree, stages, stagesSuggested) {
  const sec = section("Árbol de pasivas", "act gear tree");
  const main = tree.nodes.filter(id => !NODES[id].ascendancy);
  const asc = tree.nodes.filter(id => NODES[id].ascendancy && NODES[id].type === NODE.NOTABLE);
  const key = main.filter(id => NODES[id].type === NODE.KEYSTONE || NODES[id].type === NODE.NOTABLE)
    .sort((a, b) => NODES[b].type - NODES[a].type || NODES[a].name.localeCompare(NODES[b].name));

  const stats = treeStats(tree);
  sec.insertAdjacentHTML("beforeend", `<h3>Stats del árbol</h3><p class="note">${main.length} puntos en el árbol, ${asc.length} notables de ascendencia y ${tree.masteries.length} maestrías. Clasificación aproximada por palabras clave.</p><div class="cols"></div>`);
  for (const k of ["dmg", "def", "other"]) {
    if (!stats[k].length) continue;
    const col = document.createElement("div");
    col.innerHTML = `<b class="kind ${k}">${KIND_ES[k]}</b><ul></ul>`;
    for (const s of stats[k].slice(0, 14)) { const li = document.createElement("li"); li.textContent = s.text; if (s.n > 1) li.title = `${s.n} nodos`; col.querySelector("ul").append(li); }
    if (stats[k].length > 14) col.insertAdjacentHTML("beforeend", `<p class="note">y ${stats[k].length - 14} más</p>`);
    sec.querySelector(".cols").append(col);
  }

  sec.insertAdjacentHTML("beforeend", `<h3>Mapa de calor</h3>
    ${stages.length ? `<div class="modes stages" role="group" aria-label="Etapa del árbol"><button data-s="-1" aria-pressed="true">Final</button>${stages.map((s, i) => `<button data-s="${i}" aria-pressed="false">${esc(s.title)}</button>`).join("")}</div>` : ""}
    <div class="modes kinds" role="group" aria-label="Qué mostrar"><button data-m="both" aria-pressed="true">Ambos</button><button data-m="dmg" aria-pressed="false">Daño</button><button data-m="def" aria-pressed="false">Defensa</button></div>
    <canvas class="heat" role="img" aria-label="Árbol de pasivas con las zonas de daño en rojo y las de defensa en azul"></canvas>
    <p class="note stage-note"></p>
    <p class="note"><span class="kind dmg">rojo</span>: zonas que aportan daño · <span class="kind def">azul</span>: defensa · los números marcan los puntos indispensables de la lista.</p>`);
  const canvas = sec.querySelector("canvas");
  let mode = "both", stage = -1;
  const draw = () => {
    const nodes = stage < 0 ? main : stages[stage].nodes.filter(id => !NODES[id].ascendancy), set = new Set(nodes);
    drawHeat(canvas, nodes, key.map((id, i) => [id, i + 1]).filter(([id]) => set.has(id)), mode, main);
    const st = stages[stage];
    sec.querySelector(".stage-note").textContent = !st ? "" : (stagesSuggested ? `Sugerencia automática: ≈${st.points} puntos hasta nv ≈${st.level}, solo con nodos de tu árbol final. ` : `Árbol "${st.title}" de la build. `) + `${nodes.length} nodos cogidos.`;
  };
  toggleGroup(sec, ".kinds", "m", v => { mode = v; draw(); });
  toggleGroup(sec, ".stages", "s", v => { stage = +v; draw(); });
  redrawHeat = draw;
  requestAnimationFrame(draw);

  sec.insertAdjacentHTML("beforeend", `<h3>Puntos indispensables</h3><p class="note">Las keystones y los notables que tiene cogidos la build; el resto son nodos pequeños o de paso.</p><ol class="key"></ol>`);
  const ol = sec.querySelector("ol.key");
  key.forEach((id, i) => {
    const n = NODES[id], kind = nodeKind(id);
    const li = document.createElement("li");
    li.innerHTML = `<span class="num">${i + 1}</span><div><b></b> <span class="kind ${kind === "keystone" ? "key" : kind}">${kind === "keystone" ? "Keystone" : KIND_ES[kind]}</span><p></p></div>`;
    li.querySelector("b").textContent = n.name;
    li.querySelector("p").textContent = n.stats.join(" · ");
    ol.append(li);
  });
  const extras = [...asc.map(id => [NODES[id].name + " (ascendencia)", NODES[id].stats.join(" · ")]),
    ...tree.masteries.map(([node, eff]) => [NODES[node]?.name || "Maestría", (MASTERIES[node]?.[eff] || "").replace(/\n/g, " · ")])].filter(([, s]) => s);
  if (extras.length) {
    sec.insertAdjacentHTML("beforeend", `<h3>Ascendencia y maestrías</h3><ul class="extras"></ul>`);
    fillNamed(sec.querySelector(".extras"), extras);
  }
  return sec;
}
