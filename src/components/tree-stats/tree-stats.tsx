/* Stats sumadas del árbol, en columnas de daño, defensa y otros. */

import { KIND_ES, treeStats } from "../../js/stats";
import "./tree-stats.css";

interface TreeStatsProps {
  tree: BuildTree;
  /** Puntos en el árbol principal y notables de ascendencia, para el resumen. */
  mainCount: number;
  ascCount: number;
}

/** Resumen de puntos y una columna por tipo de stat, con las 14 primeras de cada una. */
export const TreeStats: Component<TreeStatsProps, DocumentFragment> = ({ tree, mainCount, ascCount }) => {
  const stats = treeStats(tree);
  return (
    <>
      <p class="note">{mainCount} puntos en el árbol, {ascCount} notables de ascendencia y {tree.masteries.length} maestrías. Clasificación aproximada por palabras clave.</p>
      <div class="tree-cols">
        {(["dmg", "def", "other"] as const).filter(k => stats[k].length).map(k => (
          <div>
            <b class={`kind ${k}`}>{KIND_ES[k]}</b>
            <ul>{stats[k].slice(0, 14).map(s => <li title={s.n > 1 ? `${s.n} nodos` : undefined}>{s.text}</li>)}</ul>
            {stats[k].length > 14 && <p class="note">y {stats[k].length - 14} más</p>}
          </div>
        ))}
      </div>
    </>
  ) as DocumentFragment;
};
