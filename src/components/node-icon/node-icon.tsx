/* Icono de un nodo del árbol, recortado de la hoja de sprites del CDN de GGG. */

import { SHEETS } from "../../js/data";
import "./node-icon.css";

interface NodeIconProps {
  node: TreeNode;
  /** Lado en px. */
  size: number;
}

/** Icono del nodo escalado a size px, o null si no tiene; sin conexión simplemente no aparece. */
export const NodeIcon: Component<NodeIconProps, HTMLSpanElement | null> = ({ node, size }) => {
  if (!node.icon) return null;
  const [sheet, x, y, w] = node.icon, [url, sw, sh] = SHEETS[sheet], k = size / w;
  return <span class="node-icon" style={`width:${size}px;height:${size}px;background:url("${url}") ${-x * k}px ${-y * k}px / ${sw * k}px ${sh * k}px`} /> as HTMLSpanElement;
};
