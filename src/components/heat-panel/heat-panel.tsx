/* Panel del mapa de calor: botoneras de etapa y de daño/defensa, el mapa interactivo y su leyenda. */

import { NODES } from "../../js/data";
import { heatControls } from "../heat-controls/heat-controls";
import { drawHeat, setRedrawHeat } from "../heatmap/heatmap";
import { ToggleGroup } from "../toggle-group/toggle-group";

interface HeatPanelProps {
  /** Nodos del árbol final: fijan el encuadre. */
  main: string[];
  /** Puntos indispensables, en el orden de su lista. */
  keyIds: string[];
  stages: TreeStage[];
  stagesSuggested: boolean;
  /** Maestrías elegidas. */
  masteries: [node: string, effect: string][];
}

/** Mapa de calor del árbol final o de una etapa, con sus botoneras y su leyenda. */
export const HeatPanel: Component<HeatPanelProps, DocumentFragment> = ({ main, keyIds, stages, stagesSuggested, masteries }) => {
  const canvas = <canvas class="heat" role="img" aria-label="Árbol de pasivas con las zonas de daño en rojo y las de defensa en azul" /> as HTMLCanvasElement;
  const stageNote = <p class="note stage-note" /> as HTMLParagraphElement;
  let mode = "both", stage = -1;
  const draw = () => {
    const nodes = stage < 0 ? main : stages[stage].nodes.filter(id => !NODES[id].ascendancy), set = new Set(nodes);
    drawHeat(canvas, nodes, keyIds.map((id, i): [string, number] => [id, i + 1]).filter(([id]) => set.has(id)), mode, main);
    const st = stages[stage];
    stageNote.textContent = !st ? "" : (stagesSuggested ? `Sugerencia automática: ≈${st.points} puntos hasta nv ≈${st.level}, solo con nodos de tu árbol final. ` : `Árbol "${st.title}" de la build. `) + `${nodes.length} nodos cogidos.`;
  };
  const panel = (
    <>
      {stages.length > 0 && (
        <ToggleGroup className="stages" label="Etapa del árbol" options={[["-1", "Final"], ...stages.map((s, i): [string, string] => [String(i), s.title])]} onPick={v => { stage = +v; draw(); }} />
      )}
      <ToggleGroup className="kinds" label="Qué mostrar" options={[["both", "Ambos"], ["dmg", "Daño"], ["def", "Defensa"]]} onPick={v => { mode = v; draw(); }} />
      <div class="heat-wrap">{canvas}</div>
      {stageNote}
      <p class="note">
        <span class="kind dmg">rojo</span>: zonas que aportan daño · <span class="kind def">azul</span>: defensa · los números marcan los puntos indispensables de la lista.
        Arrastra para mover, Ctrl+rueda o pellizca para hacer zoom, y pasa el ratón o toca un nodo para ver qué hace.
      </p>
    </>
  ) as DocumentFragment;
  heatControls(canvas, draw, masteries);
  setRedrawHeat(draw);
  // Se dibuja cuando el canvas ya está en la página y tiene ancho.
  requestAnimationFrame(draw);
  return panel;
};
