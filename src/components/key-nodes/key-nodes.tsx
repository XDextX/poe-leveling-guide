/* Puntos indispensables: las keystones y los notables cogidos, numerados como en el mapa de calor. */

import { NODES } from "../../js/data";
import { KIND_ES, nodeKind } from "../../js/stats";
import { NodeIcon } from "../node-icon/node-icon";
import "./key-nodes.css";

interface KeyNodesProps {
  /** Ids de los nodos, en el orden de la lista. */
  nodes: string[];
}

/** Lista numerada de los puntos indispensables. */
export const KeyNodes: Component<KeyNodesProps, HTMLOListElement> = ({ nodes }) => (
  <ol class="key">
    {nodes.map((id, i) => {
      const n = NODES[id], kind = nodeKind(id);
      return (
        <li>
          <span class="num">{i + 1}</span>
          {/* Hueco del icono aunque el nodo no tenga, para que la rejilla no se descuadre. */}
          {n.icon ? <NodeIcon node={n} size={28} /> : <span />}
          <div>
            <b>{n.name}</b> <span class={`kind ${kind === "keystone" ? "key" : kind}`}>{kind === "keystone" ? "Keystone" : KIND_ES[kind]}</span>
            <p>{n.stats.join(" · ")}</p>
          </div>
        </li>
      );
    })}
  </ol>
) as HTMLOListElement;
