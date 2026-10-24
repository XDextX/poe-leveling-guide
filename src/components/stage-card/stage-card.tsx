/* Tarjeta de un tramo del leveling sugerido: habilidad, soportes y cuánto del árbol final tendrías. */

import { GEMS, NODE, NODES } from "../../js/data";
import { GemLine } from "../gem-line/gem-line";
import "./stage-card.css";

interface StageCardProps {
  stage: StageSkill;
  /** Habilidad principal de la build. */
  mainId: string;
  /** Árbol de este tramo y el del anterior, para listar los notables nuevos. */
  tree?: TreeStage;
  prev?: TreeStage;
  treesSuggested: boolean;
}

/** Tarjeta del tramo: habilidad, soportes y, si hay árbol, cuántos puntos y qué notables nuevos. */
export const StageCard: Component<StageCardProps, HTMLDivElement> = ({ stage: s, mainId, tree, prev, treesSuggested }) => {
  const had = new Set(prev?.nodes ?? []);
  const fresh = (tree?.nodes ?? []).filter(id => !had.has(id) && (NODES[id].type === NODE.NOTABLE || NODES[id].type === NODE.KEYSTONE)).map(id => NODES[id].name);
  return (
    <div class="stagecard">
      <h3>Actos {s.acts[0]}-{s.acts[1]} <span>· nv {s.from}–{s.to}</span></h3>
      {s.skill && <GemLine how={s.own ? "Tu habilidad" : "Habilidad"} ids={[s.skill]} note={s.mainAt ? `Cambia a ${GEMS[mainId].name} desde nv ${s.mainAt}` : ""} />}
      {s.supports.length > 0 && <GemLine how="Soportes" ids={s.supports} note="por orden: con pocos enlaces, usa los primeros" />}
      {tree && (
        <p class="note">
          Árbol: {treesSuggested ? "≈" + tree.points + " puntos, " : ""}{tree.nodes.length} nodos{fresh.length ? ". Nuevos notables: " + fresh.join(", ") : ""}. Míralo en el mapa de calor, más abajo.
        </p>
      )}
    </div>
  ) as HTMLDivElement;
};
