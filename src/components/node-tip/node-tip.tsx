/* Ficha de un nodo del árbol: icono, nombre, tipo, si está cogido y qué hace. */

import { NodeIcon } from "../node-icon/node-icon";
import "./node-tip.css";

const NODE_KIND_ES = ["", "Notable", "Keystone", "Maestría", "Joya", "Inicio"];

interface NodeTipProps {
  node: TreeNode;
  /** Cogido en el árbol que se está viendo. */
  taken: boolean;
  /** Número en la lista de indispensables, si está. */
  num?: number;
  /** Efecto elegido si es una maestría cogida; sustituye a sus stats. */
  effect: string;
}

/** Contenido de la ficha del nodo. */
export const NodeTip: Component<NodeTipProps, DocumentFragment> = ({ node, taken, num, effect }) => (
  <>
    <div class="heat-tip-head">
      <NodeIcon node={node} size={36} />
      <div>
        <b>{node.name}</b>
        <small class={taken ? "taken" : undefined}>{[NODE_KIND_ES[node.type], taken ? "Cogido" : "No cogido", num ? `nº ${num} de la lista` : ""].filter(Boolean).join(" · ")}</small>
      </div>
    </div>
    {(effect ? effect.split("\n") : node.stats).map(t => <p>{t}</p>)}
    {node.reminder.map(t => <p class="reminder">{t}</p>)}
  </>
) as DocumentFragment;
