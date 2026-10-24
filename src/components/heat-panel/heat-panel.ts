/* Panel del mapa de calor: botoneras de etapa y de daño/defensa, el mapa interactivo y su leyenda. */

/**
 * Mapa de calor del árbol final o de una etapa. `main` son los nodos del árbol final (fijan el encuadre),
 * `key` los puntos indispensables en el orden de su lista y `masteries` las maestrías elegidas.
 */
const heatPanel: Component<[main: string[], key: string[], stages: TreeStage[], stagesSuggested: boolean, masteries: [node: string, effect: string][]], DocumentFragment> = (main, key, stages, stagesSuggested, masteries) => {
  const canvas = el("canvas", "heat");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Árbol de pasivas con las zonas de daño en rojo y las de defensa en azul");
  const stageNote = el("p", "note stage-note");
  let mode = "both", stage = -1;
  const draw = () => {
    const nodes = stage < 0 ? main : stages[stage].nodes.filter(id => !NODES[id].ascendancy), set = new Set(nodes);
    drawHeat(canvas, nodes, key.map((id, i): [string, number] => [id, i + 1]).filter(([id]) => set.has(id)), mode, main);
    const st = stages[stage];
    stageNote.textContent = !st ? "" : (stagesSuggested ? `Sugerencia automática: ≈${st.points} puntos hasta nv ≈${st.level}, solo con nodos de tu árbol final. ` : `Árbol "${st.title}" de la build. `) + `${nodes.length} nodos cogidos.`;
  };

  const frag = document.createDocumentFragment();
  if (stages.length) frag.append(toggleGroup("stages", "Etapa del árbol", [["-1", "Final"], ...stages.map((s, i): [string, string] => [String(i), s.title])], v => { stage = +v; draw(); }));
  frag.append(toggleGroup("kinds", "Qué mostrar", [["both", "Ambos"], ["dmg", "Daño"], ["def", "Defensa"]], v => { mode = v; draw(); }));
  const legend = el("p", "note");
  legend.innerHTML = `<span class="kind dmg">rojo</span>: zonas que aportan daño · <span class="kind def">azul</span>: defensa · los números marcan los puntos indispensables de la lista. Arrastra para mover, Ctrl+rueda o pellizca para hacer zoom, y pasa el ratón o toca un nodo para ver qué hace.`;
  frag.append(el("div", "heat-wrap", "", canvas), stageNote, legend);
  heatControls(canvas, draw, masteries);
  redrawHeat = draw;
  // Se dibuja cuando el canvas ya está en la página y tiene ancho.
  requestAnimationFrame(draw);
  return frag;
};
