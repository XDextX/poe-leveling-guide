/* Notables de ascendencia y maestrías elegidas, con su efecto. */

import { MASTERIES, NODES } from "../../js/data";
import { NamedList } from "../named-list/named-list";
import "./tree-extras.css";

interface TreeExtrasProps {
  /** Notables de ascendencia cogidos. */
  asc: string[];
  masteries: [node: string, effect: string][];
}

/** Ascendencia y maestrías, o null si no hay ninguna con efecto. */
export const TreeExtras: Component<TreeExtrasProps, HTMLUListElement | null> = ({ asc, masteries }) => {
  const extras = [...asc.map((id): [string, string] => [NODES[id].name + " (ascendencia)", NODES[id].stats.join(" · ")]),
    ...masteries.map(([node, eff]): [string, string] => [NODES[node]?.name || "Maestría", (MASTERIES[node]?.[eff] || "").replace(/\n/g, " · ")])].filter(([, s]) => s);
  return extras.length ? <NamedList items={extras} className="extras" /> as HTMLUListElement : null;
};
