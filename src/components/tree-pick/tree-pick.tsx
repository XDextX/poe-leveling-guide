/* El árbol de un tramo de "Mi leveling": el mapa del árbol donde el jugador coge y quita nodos con un clic. */

import { CLASS_STARTS } from "../../js/data";
import { heatControls } from "../heat-controls/heat-controls";
import { drawHeat } from "../heatmap/heatmap";
import "./tree-pick.css";

interface TreePickProps {
  /** El id de clase del árbol de la build (para saber cuál es el inicio). */
  classId: string;
  /** Los nodos que lleva este tramo; se vuelve a pedir en cada dibujo. */
  nodes: () => string[];
  /** Nodos que fijan el encuadre (el árbol final y lo de todos los tramos): igual en todos los tramos, para verlos en el mismo sitio. */
  frame: () => string[];
  /** Maestrías elegidas, para las fichas de los nodos. */
  masteries: [node: string, effect: string][];
  /** El aviso de este tramo (si gasta de más); "" si no hay. */
  warning: () => string;
  /** Se hace clic en un nodo. */
  onNode: (id: string) => void;
  /** Si el mapa empieza desplegado, y qué hacer cuando el jugador lo despliega o lo pliega. */
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

/** Cómo repintar un <TreePick> (su resumen, su aviso y el mapa) tras cambiar los nodos. */
export const refreshTree = new WeakMap<HTMLElement, () => void>();

/** Mapa clicable del árbol de un tramo: <TreePick classId="1" nodes={() => stage.nodes} frame={…} … /> */
export const TreePick: Component<TreePickProps, HTMLDetailsElement> = ({ classId, nodes, frame, masteries, warning, onNode, open = false, onToggle }) => {
  const canvas = <canvas class="heat" role="img" aria-label="Árbol de pasivas de este tramo: pulsa un nodo para cogerlo o quitarlo" /> as HTMLCanvasElement;
  const label = <span /> as HTMLElement, note = <p class="note tree-warning" role="status" /> as HTMLElement;
  const draw = () => drawHeat(canvas, nodes(), [], "none", [CLASS_STARTS[classId], ...frame()]);
  const root = (
    <details class="tree-pick" open={open} onToggle={(e: Event) => { const d = e.target as HTMLDetailsElement; onToggle?.(d.open); if (d.open) requestAnimationFrame(draw); }}>
      <summary>{label}</summary>
      <div class="heat-wrap">{canvas}</div>
      {note}
      <p class="note">Pulsa un nodo para cogerlo (se cogen también los del camino más corto) o para quitarlo (y lo que quede sin conexión). Arrastra para mover y Ctrl+rueda o pellizca para el zoom. Las maestrías no se eligen aquí.</p>
    </details>
  ) as HTMLDetailsElement;
  const refresh = () => {
    const n = nodes().length;
    label.textContent = `Árbol: ${n} punto${n === 1 ? "" : "s"}`;
    note.textContent = warning();
    if (root.open) draw();
  };
  refreshTree.set(root, refresh);
  heatControls(canvas, draw, masteries, onNode);
  refresh();
  if (open) requestAnimationFrame(draw);
  return root;
};
